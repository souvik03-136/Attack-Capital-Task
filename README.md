# Unified Inbox - Multi-Channel Customer Outreach Platform

Complete implementation of unified communication platform for SMS, WhatsApp, and Email.

## Features

- **Multi-Channel Messaging**: SMS, WhatsApp, Email via unified interface
- **Contact Management**: Centralized contact database with search
- **Message Scheduling**: Schedule messages for future delivery
- **Internal Notes**: Add notes to contacts with @mentions and privacy controls
- **Real-time Analytics**: Track message volume, response times, channel usage
- **Responsive UI**: Mobile-friendly interface built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth
- **Integrations**: Twilio (SMS/WhatsApp), Resend (Email)

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- Docker (for PostgreSQL)
- Twilio account
- Resend account (optional)

### 2. Clone and Install
```bash
git clone <your-repo>
cd unified-inbox
npm install
```

### 3. Start PostgreSQL
```bash
docker run --name postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=unified_inbox \
  -p 5432:5432 \
  -d postgres:15
```

### 4. Configure Environment
Create `.env.local`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/unified_inbox"
BETTER_AUTH_SECRET="generate-a-secure-32-character-minimum-secret"
BETTER_AUTH_URL="http://localhost:3000"
TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"
RESEND_API_KEY="re_your_resend_key"
```

### 5. Setup Database
```bash
npx prisma generate
npx prisma db push
```

### 6. Run Development Server
```bash
npm run dev
```

Open http://localhost:3000

### 7. Setup Webhooks (Separate Terminal)
```bash
ngrok http 3000
```

Configure Twilio webhook URL:
- Go to Twilio Console → Phone Numbers → Active Numbers
- Select your number
- Set "A MESSAGE COMES IN" webhook to: `https://your-ngrok-url.ngrok.io/api/webhooks/twilio`
- Method: POST
- Save

### 8. Run Scheduler (Separate Terminal)
```bash
npm run scheduler
```

## Testing Guide

### 1. Create Account
- Navigate to http://localhost:3000
- Click "Sign Up"
- Enter email, password, and name
- Submit

### 2. Add Contact
- Click "+ New Contact"
- Enter name, phone (with country code: +1234567890)
- Optionally add email
- Click "Create Contact"

### 3. Send Messages
- Select contact from list
- Choose channel (SMS/WhatsApp/Email)
- Type message
- Click "Send" or schedule for later

### 4. Test Inbound Messages
- Use Twilio console to send test SMS/WhatsApp to your number
- Messages appear in inbox automatically

### 5. Add Notes
- Click "View Profile" on contact
- Add notes with optional @mentions
- Toggle private/public

### 6. View Analytics
- Navigate to Analytics page
- View message counts, channel distribution, response times

## Integration Comparison

| Channel   | Latency | Cost/Message | Reliability | Setup Complexity |
|-----------|---------|--------------|-------------|------------------|
| SMS       | <1s     | $0.0075      | 99.9%       | Easy             |
| WhatsApp  | <2s     | $0.0050      | 99.5%       | Medium           |
| Email     | <5s     | Free tier    | 99.0%       | Easy             |

## Key Architecture Decisions

1. **Factory Pattern for Channels**: `createSender()` abstracts channel-specific logic
2. **Database Polling for Scheduling**: Simple cron-based scheduler via DB queries
3. **Unified Message Schema**: Single table normalizes all channels
4. **Better Auth**: Simple setup with credential-based authentication
5. **Prisma ORM**: Type-safe database access with auto-generated types
6. **Next.js API Routes**: Serverless functions for webhooks and APIs

## Project Structure