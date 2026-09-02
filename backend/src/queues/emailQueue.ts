import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import nodemailer from 'nodemailer';

export const redisConnection = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
});

export const emailQueue = new Queue('email-queue', { connection: redisConnection });

export const emailWorker = new Worker(
  'email-queue',
  async (job: Job) => {
    const { recipient, subject, body, delaySeconds } = job.data;

    if (delaySeconds) {
      await new Promise((res) => setTimeout(res, delaySeconds * 1000));
    }

    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });

    await transporter.sendMail({
      from: '"ReachInbox Demo" <demo@reachinbox.ai>',
      to: recipient,
      subject: subject,
      text: body,
    });

    console.log(`[Worker] Sent email to: ${recipient}`);
  },
  { connection: redisConnection, concurrency: 5 }
);