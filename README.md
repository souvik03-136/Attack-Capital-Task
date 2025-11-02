# Unified Inbox - Multi-Channel Customer Outreach Platform

A production-ready unified communication platform that consolidates SMS, WhatsApp, and Email into a single interface with message scheduling, contact management, internal notes, and analytics.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Testing Guide](#testing-guide)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### Core Functionality
- **Multi-Channel Messaging**: Unified interface for SMS, WhatsApp, and Email
- **Real-time Inbox**: Receive and respond to messages across all channels
- **Contact Management**: Centralized contact database with search and filtering
- **Message Scheduling**: Schedule messages for future delivery
- **Internal Notes**: Team collaboration with @mentions and privacy controls
- **Analytics Dashboard**: Track message volume, response times, and channel performance
- **Media Support**: Send and receive images/files via MMS and WhatsApp

### Technical Features
- **TypeScript**: Full type safety across frontend and backend
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **Database ORM**: Prisma for type-safe database access
- **Authentication**: Secure credential-based auth with Better Auth
- **Webhook Integration**: Real-time message reception via Twilio
- **Factory Pattern**: Extensible channel integration architecture

## 🏗️ Architecture

### System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser]
        B[Mobile Browser]
    end
    
    subgraph "Next.js Application"
        C[React UI Components]
        D[API Routes]
        E[Server Actions]
    end
    
    subgraph "Business Logic"
        F[Auth Service]
        G[Message Factory]
        H[Scheduler Service]
    end
    
    subgraph "Data Layer"
        I[(PostgreSQL)]
        J[Prisma ORM]
    end
    
    subgraph "External Services"
        K[Twilio SMS]
        L[Twilio WhatsApp]
        M[Resend Email]
    end
    
    A --> C
    B --> C
    C --> D
    D --> F
    D --> G
    D --> J
    E --> H
    F --> J
    G --> K
    G --> L
    G --> M
    H --> J
    J --> I
    K -.webhook.-> D
    L -.webhook.-> D
```

### Database Schema

```mermaid
erDiagram
    User ||--o{ Session : has
    User ||--o{ Message : creates
    User ||--o{ Note : writes
    Contact ||--o{ Message : receives
    Contact ||--o{ Note : about
    
    User {
        string id PK
        string email UK
        string name
        string password
        string role
        datetime createdAt
    }
    
    Session {
        string id PK
        string userId FK
        string token UK
        datetime expiresAt
        datetime createdAt
    }
    
    Contact {
        string id PK
        string name
        string phone UK
        string email
        json socialHandles
        json metadata
        datetime createdAt
        datetime updatedAt
    }
    
    Message {
        string id PK
        string contactId FK
        string userId FK
        string channel
        string direction
        string content
        string status
        json metadata
        string mediaUrl
        datetime scheduledAt
        datetime sentAt
        datetime createdAt
    }
    
    Note {
        string id PK
        string contactId FK
        string userId FK
        string content
        boolean isPrivate
        string[] mentions
        datetime createdAt
        datetime updatedAt
    }
```

### Message Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Web UI
    participant API as API Routes
    participant F as Message Factory
    participant T as Twilio/Resend
    participant DB as Database
    participant W as Webhook
    
    Note over U,W: Outbound Message Flow
    U->>UI: Compose message
    UI->>API: POST /api/messages
    API->>DB: Check contact exists
    DB-->>API: Contact data
    API->>F: createSender(channel)
    F->>T: Send message
    T-->>F: Message ID & status
    F-->>API: Result
    API->>DB: Save message record
    DB-->>API: Success
    API-->>UI: Message sent
    UI-->>U: Update UI
    
    Note over U,W: Inbound Message Flow
    T->>W: POST /api/webhooks/twilio
    W->>DB: Find/create contact
    W->>DB: Save message
    DB-->>W: Success
    W-->>T: 200 OK (TwiML)
    
    Note over U,W: Scheduled Message Flow
    U->>UI: Schedule message
    UI->>API: POST /api/messages
    API->>DB: Save with scheduledAt
    DB-->>API: Success
    loop Every minute
        API->>DB: Query due messages
        DB-->>API: Scheduled messages
        API->>F: Send each message
        F->>T: Deliver message
        API->>DB: Update status
    end
```

### Component Architecture

```mermaid
graph LR
    subgraph "Pages"
        A[Login Page]
        B[Inbox Page]
        C[Analytics Page]
    end
    
    subgraph "Inbox Components"
        D[MessageList]
        E[MessageThread]
        F[Composer]
        G[ContactProfile]
    end
    
    subgraph "Analytics Components"
        H[Dashboard]
        I[Charts]
    end
    
    subgraph "UI Components"
        J[Button]
        K[Input]
        L[Modal]
    end
    
    subgraph "Shared"
        M[Navbar]
    end
    
    B --> D
    B --> E
    B --> F
    B --> G
    C --> H
    H --> I
    D --> J
    D --> K
    E --> J
    F --> J
    F --> K
    G --> L
    G --> J
    G --> K
    A --> J
    A --> K
    B --> M
    C --> M
```

### Integration Flow

```mermaid
graph TD
    A[Message Request] --> B{Channel Type?}
    
    B -->|SMS| C[TwilioSMSSender]
    B -->|WhatsApp| D[TwilioWhatsAppSender]
    B -->|Email| E[EmailSender]
    
    C --> F[Twilio API]
    D --> G[Twilio WhatsApp API]
    E --> H[Resend API]
    
    F --> I{Success?}
    G --> I
    H --> I
    
    I -->|Yes| J[Update Status: Sent]
    I -->|No| K[Update Status: Failed]
    
    J --> L[Return Message ID]
    K --> L
    
    L --> M[Store in Database]
    M --> N[Notify UI]
```

## 📦 Prerequisites

### Required Software

| Software | Version | Purpose | Installation |
|----------|---------|---------|--------------|
| Node.js | 18+ | Runtime environment | [nodejs.org](https://nodejs.org) |
| Docker | Latest | PostgreSQL container | [docker.com](https://docker.com) |
| Git | Latest | Version control | [git-scm.com](https://git-scm.com) |
| ngrok | Latest | Webhook tunneling | [ngrok.com](https://ngrok.com) |

### Required Accounts

1. **Twilio Account**
   - Sign up at [twilio.com](https://www.twilio.com/try-twilio)
   - Purchase a phone number with SMS and MMS capabilities
   - For WhatsApp: Request access to WhatsApp Business API
   - Note: Account SID, Auth Token, and Phone Number

2. **Resend Account** (Optional for Email)
   - Sign up at [resend.com](https://resend.com)
   - Get API key from dashboard
   - Free tier: 100 emails/day

3. **ngrok Account** (Free tier sufficient)
   - Sign up at [ngrok.com](https://ngrok.com)
   - Download and install ngrok
   - Get authtoken from dashboard

## 🚀 Installation

### Step 1: Clone and Setup Project

```bash
# Create Next.js project
npx create-next-app@latest unified-inbox --typescript --tailwind --app
cd unified-inbox

# Install dependencies
npm install @prisma/client prisma better-auth twilio resend zod date-fns clsx tailwind-merge

# Install dev dependencies
npm install -D @types/node @types/react @types/react-dom typescript
```

### Step 2: Project Structure

Create the following directory structure:

```
unified-inbox/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...all]/route.ts
│   │   │   ├── webhooks/twilio/route.ts
│   │   │   ├── messages/route.ts
│   │   │   ├── contacts/route.ts
│   │   │   ├── notes/route.ts
│   │   │   ├── scheduled/route.ts
│   │   │   └── analytics/route.ts
│   │   ├── inbox/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── login/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── inbox/
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageThread.tsx
│   │   │   ├── Composer.tsx
│   │   │   └── ContactProfile.tsx
│   │   ├── analytics/
│   │   │   └── Dashboard.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   └── Navbar.tsx
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── scheduler.ts
│   │   ├── utils.ts
│   │   └── integrations/
│   │       ├── types.ts
│   │       ├── factory.ts
│   │       ├── twilio.ts
│   │       └── email.ts
│   └── types/
│       └── index.ts
├── .env.local
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── postcss.config.js
└── README.md
```

Copy all files from the provided implementation into their respective locations.

### Step 3: Setup PostgreSQL Database

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker run --name unified-inbox-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=unified_inbox \
  -p 5432:5432 \
  -d postgres:15-alpine

# Verify it's running
docker ps

# View logs
docker logs unified-inbox-postgres
```

#### Option B: Using Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb unified_inbox
```

#### Option C: Using Cloud PostgreSQL

Use any managed PostgreSQL service:
- **Supabase**: Free tier available
- **Railway**: $5/month
- **Neon**: Free tier with branching
- **AWS RDS**: Pay-as-you-go

## ⚙️ Configuration

### Step 1: Create Environment File

Create `.env.local` in the project root:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/unified_inbox"

# Authentication
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET="your-secret-key-minimum-32-characters-long-please-change-this"
BETTER_AUTH_URL="http://localhost:3000"

# Twilio
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_twilio_auth_token_here"
TWILIO_PHONE_NUMBER="+1234567890"

# Resend (optional)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
```

### Step 2: Generate Secrets

```bash
# Generate BETTER_AUTH_SECRET
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 3: Configure Twilio

1. **Login to Twilio Console**
   - Go to [console.twilio.com](https://console.twilio.com)

2. **Get Credentials**
   - Copy Account SID from dashboard
   - Copy Auth Token from dashboard
   - Note your Twilio phone number

3. **Configure Phone Number** (will complete after ngrok setup)
   - Navigate to Phone Numbers → Manage → Active Numbers
   - Click on your number
   - Keep this tab open for later

### Step 4: Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Optional: Open Prisma Studio to view data
npx prisma studio
```

## 🏃 Running the Application

You'll need **4 terminal windows** running simultaneously:

### Terminal 1: Next.js Development Server

```bash
# Start the application
npm run dev

# Application will be available at:
# http://localhost:3000
```

Expected output:
```
▲ Next.js 14.2.0
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.5s
```

### Terminal 2: ngrok Tunnel (for webhooks)

```bash
# Authenticate ngrok (first time only)
ngrok authtoken YOUR_NGROK_AUTH_TOKEN

# Start tunnel
ngrok http 3000
```

Expected output:
```
Session Status    online
Account           your-account
Version           3.x.x
Region            United States (us)
Forwarding        https://abcd-1234.ngrok-free.app -> http://localhost:3000
```

**Important**: Copy the `https://` URL (e.g., `https://abcd-1234.ngrok-free.app`)

### Terminal 3: Configure Twilio Webhook

Now complete the Twilio configuration:

1. Go back to your Twilio phone number settings
2. Under "Messaging":
   - **A MESSAGE COMES IN**: 
     - Webhook URL: `https://YOUR-NGROK-URL.ngrok-free.app/api/webhooks/twilio`
     - HTTP Method: `POST`
   - Click "Save"

For WhatsApp (if configured):
3. Under "WhatsApp":
   - Same webhook URL as above
   - HTTP Method: `POST`
   - Click "Save"

### Terminal 4: Message Scheduler

```bash
# Run the scheduler
npm run scheduler
```

Expected output:
```
Scheduler tick: 2024-11-02T10:00:00.000Z
Scheduler tick: 2024-11-02T10:01:00.000Z
...
```

This polls every 60 seconds for scheduled messages.

## 🧪 Testing Guide

### 1. Create Your Account

```mermaid
graph LR
    A[Open http://localhost:3000] --> B[Click Sign Up]
    B --> C[Enter Email]
    C --> D[Enter Password]
    D --> E[Enter Name]
    E --> F[Click Sign Up Button]
    F --> G[Redirected to Inbox]
```

**Steps:**
1. Navigate to `http://localhost:3000`
2. Click "Don't have an account? Sign up"
3. Enter:
   - **Name**: Your Name
   - **Email**: test@example.com
   - **Password**: SecurePassword123
4. Click "Sign Up"
5. You'll be logged in automatically

### 2. Create a Test Contact

**Steps:**
1. Click "+ New Contact" button
2. Fill in details:
   - **Name**: John Doe
   - **Phone**: +1234567890 (use your real phone for testing)
   - **Email**: john@example.com (optional)
3. Click "Create Contact"
4. Contact appears in left sidebar

### 3. Send an SMS Message

**Steps:**
1. Click on the contact you just created
2. Message thread opens on the right
3. In the composer at the bottom:
   - **Channel**: Select "SMS"
   - **Message**: Type "Hello from Unified Inbox!"
4. Click "Send" or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)
5. Message appears in thread with blue background
6. Check your phone for the SMS

### 4. Test Inbound Messages

**Option A: Real SMS (Recommended)**
1. From your phone, send an SMS to your Twilio number
2. Message should appear in the inbox within 1-2 seconds
3. White background indicates inbound message

**Option B: Twilio Console Test**
1. Go to Twilio Console → Messaging → Try it out → Send an SMS
2. From: Your Twilio number
3. To: Any number
4. Body: "Test message"
5. Message will trigger webhook

### 5. Test Message Scheduling

**Steps:**
1. Select a contact
2. In composer:
   - Click the datetime picker
   - Select a time 2-3 minutes in the future
   - Type message: "This is a scheduled message"
3. Click "Schedule"
4. Message status shows as "scheduled"
5. Wait for the scheduled time
6. Scheduler will send it automatically
7. Status updates to "sent"

### 6. Test WhatsApp (if configured)

**Steps:**
1. First, opt-in to WhatsApp:
   - Send "join [your-sandbox-keyword]" to your Twilio WhatsApp number
2. Create/select contact with phone number
3. Choose "WhatsApp" channel
4. Send message
5. Message appears in your WhatsApp

### 7. Test Email Channel

**Steps:**
1. Create contact with email address
2. Select "Email" channel
3. Type message
4. Click "Send"
5. Check recipient's inbox

### 8. Add Internal Notes

**Steps:**
1. Select a contact
2. Click "View Profile"
3. In the notes section:
   - Type: "Customer is interested in premium plan @teamlead"
   - Check "Private note" if needed
4. Click "Add Note"
5. Note appears with timestamp and author
6. @mention is highlighted

### 9. View Analytics

**Steps:**
1. Click "Analytics" in navbar
2. Dashboard shows:
   - Total messages sent
   - Total contacts
   - Average response time
   - Messages by channel (SMS, WhatsApp, Email)
   - Messages by status
   - Daily activity chart

### 10. Test Media Messages (MMS)

**Steps:**
1. Find a public image URL (e.g., `https://picsum.photos/300/200`)
2. In composer:
   - Paste URL in "Media URL" field
   - Add message text
   - Select SMS or WhatsApp channel
3. Send message
4. Image appears in thread

## 📡 API Documentation

### Authentication

#### Sign Up
```http
POST /api/auth/sign-up
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "John Doe"
}
```

#### Sign In
```http
POST /api/auth/sign-in
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

### Contacts

#### List Contacts
```http
GET /api/contacts?search=john
```

#### Create Contact
```http
POST /api/contacts
Content-Type: application/json

{
  "name": "Jane Smith",
  "phone": "+1234567890",
  "email": "jane@example.com"
}
```

### Messages

#### Get Messages
```http
GET /api/messages?contactId=clxxxx&channel=sms&status=sent
```

#### Send Message
```http
POST /api/messages
Content-Type: application/json

{
  "contactId": "clxxxx",
  "channel": "sms",
  "content": "Hello!",
  "userId": "user_id",
  "scheduledAt": "2024-11-02T15:00:00Z",
  "mediaUrl": "https://example.com/image.jpg"
}
```

### Notes

#### Get Notes
```http
GET /api/notes?contactId=clxxxx
```

#### Create Note
```http
POST /api/notes
Content-Type: application/json

{
  "contactId": "clxxxx",
  "userId": "user_id",
  "content": "Important note @john",
  "isPrivate": false
}
```

### Analytics

#### Get Analytics
```http
GET /api/analytics
```

Response:
```json
{
  "totalMessages": 1250,
  "totalContacts": 87,
  "byChannel": [
    { "channel": "sms", "_count": 450 },
    { "channel": "whatsapp", "_count": 600 },
    { "channel": "email", "_count": 200 }
  ],
  "byStatus": [
    { "status": "sent", "_count": 1100 },
    { "status": "failed", "_count": 50 },
    { "status": "scheduled", "_count": 100 }
  ],
  "avgResponseTime": [{ "avg_seconds": 180 }],
  "dailyActivity": {
    "2024-11-01": 120,
    "2024-11-02": 95
  }
}
```

### Webhooks

#### Twilio Webhook
```http
POST /api/webhooks/twilio
Content-Type: application/x-www-form-urlencoded

MessageSid=SMxxxx&
From=%2B1234567890&
Body=Hello&
NumMedia=0
```

### Scheduled Messages

#### Process Scheduled
```http
POST /api/scheduled
```

#### List Scheduled
```http
GET /api/scheduled
```

## 🚢 Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add BETTER_AUTH_SECRET
vercel env add BETTER_AUTH_URL
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
vercel env add TWILIO_PHONE_NUMBER
vercel env add RESEND_API_KEY

# Deploy production
vercel --prod
```

**Setup Cron for Scheduler:**

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/scheduled",
    "schedule": "* * * * *"
  }]
}
```

### Option 2: Railway

1. Create account at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select repository
4. Add PostgreSQL service
5. Add environment variables
6. Deploy

### Option 3: Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
docker build -t unified-inbox .
docker run -p 3000:3000 --env-file .env.local unified-inbox
```

### Post-Deployment Checklist

- [ ] Update BETTER_AUTH_URL to production URL
- [ ] Update Twilio webhook URLs to production domain
- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Test all channels (SMS, WhatsApp, Email)
- [ ] Test webhooks with real messages
- [ ] Configure production cron job
- [ ] Setup error monitoring (Sentry, LogRocket)
- [ ] Configure CORS if needed
- [ ] Setup SSL/TLS certificates
- [ ] Configure rate limiting

## 🐛 Troubleshooting

### Database Issues

**Problem**: `Error: P1001: Can't reach database server`

**Solutions**:
```bash
# Check if PostgreSQL is running
docker ps

# Restart container
docker restart unified-inbox-postgres

# Check logs
docker logs unified-inbox-postgres

# Verify connection string
echo $DATABASE_URL
```

**Problem**: `Error: P2002: Unique constraint failed`

**Solution**: Contact with phone/email already exists. Use a different number.

### Twilio Webhook Issues

**Problem**: Messages not appearing in inbox

**Checklist**:
1. ✅ ngrok is running
2. ✅ Webhook URL is correct in Twilio console
3. ✅ URL includes `/api/webhooks/twilio`
4. ✅ HTTP method is POST
5. ✅ ngrok URL hasn't changed (restart ngrok)

**Debug**:
```bash
# Check Twilio console → Monitor → Logs → Errors
# View ngrok requests
ngrok http 3000 --log=stdout
```

**Problem**: `11200: HTTP retrieval failure`

**Solution**: ngrok tunnel is down. Restart ngrok and update webhook URL.

### Authentication Issues

**Problem**: `Error: BETTER_AUTH_SECRET must be at least 32 characters`

**Solution**:
```bash
# Generate new secret
openssl rand -base64 32

# Add to .env.local
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
```

**Problem**: Session expires immediately

**Solution**: Clear cookies and restart app:
```bash
# Clear browser cookies for localhost:3000
# Restart Next.js server
npm run dev
```

### Message Sending Issues

**Problem**: `Error: Contact missing phone`

**Solution**: Ensure contact has phone number for SMS/WhatsApp or email for Email channel.

**Problem**: SMS sends but WhatsApp fails

**Solution**: 
- Verify WhatsApp sandbox is enabled in Twilio
- Send "join [sandbox-keyword]" from recipient's phone
- Check WhatsApp message limits

**Problem**: `Error: The message From/To pair violates a blacklist rule`

**Solution**: Number is blocked. Remove from blacklist in Twilio console.

### Scheduler Issues

**Problem**: Scheduled messages not sending

**Checklist**:
1. ✅ Scheduler is running (`npm run scheduler`)
2. ✅ Message has `scheduledAt` in the past
3. ✅ Message status is "scheduled"
4. ✅ Check scheduler terminal for errors

**Manual trigger**:
```bash
curl -X POST http://localhost:3000/api/scheduled
```

### Build Issues

**Problem**: `Module not found: Can't resolve '@/...'`

**Solution**: Check `tsconfig.json` paths configuration:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Problem**: Prisma client not generated

**Solution**:
```bash
npx prisma generate
npm run dev
```

## 📊 Performance Optimization

### Database Indexing

The schema includes indexes on frequently queried fields:
- `Contact.phone`
- `Contact.email`
- `Message.contactId`
- `Message.channel`
- `Message.status`
- `Message.scheduledAt`

### Caching Strategies

Consider implementing:
- Redis for session storage
- CDN for static assets
- Database query caching

### Monitoring

Recommended tools:
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Datadog**: APM monitoring
- **Prisma Pulse**: Database changes

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit `.env.local`
2. **API Rate Limiting**: Implement rate limits on API routes
3. **Input Validation**: Use Zod schemas
4. **SQL Injection**: Prisma prevents by default
5. **XSS Protection**: Next.js escapes by default
6. **HTTPS**: Use in production always
7. **Webhook Validation**: Verify Twilio signatures

## 📈 Scaling Considerations

### Current Limitations
- Single server architecture
- Database polling for scheduler
- No message queuing

### Scale to 10,000+ messages/day
1. Add Redis for caching
2. Implement message queue (Bull, BullMQ)
3. Use separate worker for scheduler
4. Add read replicas for database
5. Implement connection pooling

### Scale to 100,000+ messages/day
1. Microservices architecture
2. Kubernetes orchestration
3. Message queue (RabbitMQ, Kafka)
4. Distributed caching
5. Load balancers
6. Database sharding

## 📞 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@example.com
- **Discord**: [Join our server](https://discord.gg/example)

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Credits

Built with:
- Next.js
- Prisma
- Tailwind CSS
- Better Auth
- Twilio
- Resend

---

**Ready to get started?** Jump to [Installation](#installation) and follow the step-by-step guide!