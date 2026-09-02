import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const redisConnection = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

export const emailQueue = new Queue('email-queue', { 
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry failed email jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Wait 2s, then 4s, then 8s before retrying
    },
    removeOnComplete: { age: 3600 }, // Keep completed logs for 1 hour
    removeOnFail: { age: 86400 },    // Keep failed logs for 24 hours
  },
});

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (!transporter) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[SMTP] Ethereal test account ready: ${testAccount.user}`);
  }
  return transporter;
}

export const emailWorker = new Worker(
  'email-queue',
  async (job: Job) => {
    const { recipient, subject, body } = job.data;
    const activeTransporter = await getTransporter();

    const info = await activeTransporter.sendMail({
      from: '"QueuePulse Dispatcher" <no-reply@queuepulse.io>',
      to: recipient,
      subject: subject,
      text: body,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[Worker] Sent to: ${recipient} | Job ID: ${job.id}`);
    if (previewUrl) {
      console.log(`[Worker] Preview URL: ${previewUrl}`);
    }

    return { recipient, sentAt: new Date().toISOString(), messageId: info.messageId };
  },
  { 
    connection: redisConnection, 
    concurrency: Number(process.env.CONCURRENCY) || 5,
    limiter: {
      max: 10,       // Process maximum 10 emails
      duration: 1000 // per 1 second (1000ms)
    }
  }
);

emailWorker.on('completed', (job: Job) => {
  console.log(`[Job ${job.id}] Completed successfully.`);
});

emailWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[Job ${job?.id || 'unknown'}] Failed: ${err.message}`);
});