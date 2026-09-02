# Email Queue Scheduler

## 📝 Description

Email Queue Scheduler is a full-stack app for asynchronous batch email dispatching with rate throttling. Using a Redis-backed BullMQ worker, it prevents SMTP rate limits, logs execution via PostgreSQL and Prisma, and tracks real-time queue activity on a React dashboard.