import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { emailQueue } from './queues/emailQueue';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  return res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Enqueue Email Batch Endpoint
app.post('/api/schedule', async (req: Request, res: Response) => {
  try {
    const { recipients, subject, body, delayBetweenSeconds } = req.body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ success: false, error: 'Recipients list cannot be empty.' });
    }

    if (!subject || !body) {
      return res.status(400).json({ success: false, error: 'Subject and Body are required fields.' });
    }

    const delayMs = (Number(delayBetweenSeconds) || 0) * 1000;

    // Dispatch batch to Redis queue with staggered execution delays
    const queuePromises = recipients.map((recipient: string, index: number) => {
      return emailQueue.add(
        'send-email',
        { recipient, subject, body },
        { delay: index * delayMs }
      );
    });

    await Promise.all(queuePromises);

    return res.json({
      success: true,
      message: `Enqueued ${recipients.length} email(s) successfully.`,
      batchSize: recipients.length
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Live Queue Telemetry Endpoint
app.get('/api/jobs', async (_req: Request, res: Response) => {
  try {
    const jobs = await emailQueue.getJobs(['waiting', 'delayed', 'active', 'completed', 'failed']);

    const formattedJobs = jobs.map((job) => {
      let status: 'queued' | 'processing' | 'completed' | 'failed' = 'queued';

      if (job.finishedOn) {
        status = job.failedReason ? 'failed' : 'completed';
      } else if (job.processedOn) {
        status = 'processing';
      }

      return {
        id: job.id,
        recipientsCount: 1,
        subject: job.data.subject,
        timestamp: new Date(job.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }),
        delay: Math.round((job.opts.delay || 0) / 1000),
        status,
      };
    });

    return res.json({ success: true, jobs: formattedJobs.reverse() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 QueuePulse Backend Server running on http://localhost:${PORT}`);
});