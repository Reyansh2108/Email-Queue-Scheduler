import express, { Request, Response } from 'express';
import cors from 'cors';
import { emailQueue } from './queues/emailQueue';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/schedule', async (req: Request, res: Response) => {
  try {
    const { recipients, subject, body, delayBetweenSeconds } = req.body;

    for (let i = 0; i < recipients.length; i++) {
      await emailQueue.add('send-email', {
        recipient: recipients[i],
        subject,
        body,
        delaySeconds: delayBetweenSeconds || 2,
      });
    }

    res.json({ success: true, message: 'Emails queued successfully!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(5001, () => {
    console.log('🚀 Server running on http://localhost:5001');
  });