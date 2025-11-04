# Unified Inbox - Multi-Channel Customer Outreach Platform

A production-ready unified communication platform that consolidates SMS, WhatsApp, and Email into a single interface with message scheduling, contact management, and analytics.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)

## ✨ Features

- **Multi-Channel Messaging**: Unified interface for SMS, WhatsApp, and Email
- **Real-time Inbox**: Receive and respond to messages across all channels
- **Contact Management**: Centralized contact database with search and filtering
- **Message Scheduling**: Schedule messages for future delivery
- **Internal Notes**: Team collaboration with @mentions and privacy controls
- **Analytics Dashboard**: Track message volume, response times, and channel performance
- **Media Support**: Send and receive images/files via MMS and WhatsApp
- **TypeScript**: Full type safety across frontend and backend
- **Responsive Design**: Mobile-first UI with Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)
- [Twilio Account](https://www.twilio.com/try-twilio) with phone number
- [ngrok](https://ngrok.com) for webhook tunneling
- [Resend Account](https://resend.com) (optional, for email)

### Installation

```bash
# Clone and setup
npx create-next-app@latest unified-inbox --typescript --tailwind --app
cd unified-inbox

# Install dependencies
npm install @prisma/client prisma better-auth twilio resend zod date-fns clsx tailwind-merge

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Configuration

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/unified_inbox"

# Authentication (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET="your-secret-key-minimum-32-characters"
BETTER_AUTH_URL="http://localhost:3000"

# Twilio
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"

# Resend (optional)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
```

### Database Setup

```bash
# Start PostgreSQL with Docker
docker run --name unified-inbox-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=unified_inbox \
  -p 5432:5432 \
  -d postgres:15-alpine

# Initialize database
npx prisma generate
npx prisma db push
```

### Run the Application

You'll need 4 terminal windows:

**Terminal 1 - Next.js Server:**
```bash
npm run dev
# Opens at http://localhost:3000
```

**Terminal 2 - ngrok Tunnel:**
```bash
ngrok http 3000
# Copy the https:// URL
```

**Terminal 3 - Configure Twilio:**
1. Go to [Twilio Console → Phone Numbers](https://console.twilio.com/us1/develop/phone-numbers/manage/incoming)
2. Click your phone number
3. Under "Messaging" → "A MESSAGE COMES IN":
   - Webhook: `https://YOUR-NGROK-URL.ngrok-free.app/api/webhooks/twilio`
   - Method: POST
4. Save

**Terminal 4 - Message Scheduler:**
```bash
npm run scheduler
```

## 📖 Usage

### 1. Create Account
- Navigate to `http://localhost:3000`
- Click "Sign Up"
- Enter your details

### 2. Add a Contact
- Click "+ New Contact"
- Add name and phone number (use your real phone for testing)

### 3. Send a Message
- Select the contact
- Choose channel (SMS/WhatsApp/Email)
- Type your message
- Click "Send" or press Cmd+Enter

### 4. Test Inbound Messages
- Send an SMS to your Twilio number
- Message appears in inbox automatically

### 5. Schedule a Message
- Click the datetime picker in composer
- Select future time
- Type message and click "Schedule"

## 📡 API Endpoints

### Authentication
- `POST /api/auth/sign-up` - Create account
- `POST /api/auth/sign-in` - Login

### Contacts
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact

### Messages
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message

### Notes
- `GET /api/notes` - Get notes
- `POST /api/notes` - Create note

### Analytics
- `GET /api/analytics` - Get analytics data

### Webhooks
- `POST /api/webhooks/twilio` - Receive Twilio messages

## 🏗️ Project Structure

```
unified-inbox/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── inbox/             # Inbox page
│   │   ├── analytics/         # Analytics page
│   │   └── login/             # Auth pages
│   ├── components/
│   │   ├── inbox/             # Inbox components
│   │   ├── analytics/         # Analytics components
│   │   └── ui/                # Reusable UI components
│   ├── lib/
│   │   ├── auth.ts            # Authentication
│   │   ├── db.ts              # Database client
│   │   ├── scheduler.ts       # Message scheduler
│   │   └── integrations/      # Channel integrations
│   └── types/                 # TypeScript types
└── .env.local                 # Environment variables
```

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker ps

# Restart container
docker restart unified-inbox-postgres
```

### Webhooks Not Working
1. Verify ngrok is running
2. Check webhook URL in Twilio console
3. Ensure URL ends with `/api/webhooks/twilio`
4. Restart ngrok if URL changed

### Scheduled Messages Not Sending
1. Ensure scheduler is running (`npm run scheduler`)
2. Check message has `scheduledAt` in the past
3. Verify message status is "scheduled"

### Authentication Issues
```bash
# Generate new secret
openssl rand -base64 32

# Add to .env.local
BETTER_AUTH_SECRET="<generated-secret>"
```

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Deploy
vercel

# Set environment variables in Vercel dashboard
# Update BETTER_AUTH_URL to production domain
# Update Twilio webhook to production URL

# Setup cron for scheduler
# Add vercel.json with cron configuration
```

### Railway

1. Connect GitHub repository
2. Add PostgreSQL service
3. Set environment variables
4. Deploy

### Docker

```bash
docker build -t unified-inbox .
docker run -p 3000:3000 --env-file .env.local unified-inbox
```

## 📚 Documentation

For detailed documentation, see [DOCUMENTATION.md](./DOCUMENTATION.md):

- Complete architecture diagrams
- Database schema details
- Message flow sequences
- API documentation
- Performance optimization
- Security best practices
- Scaling considerations

## 🔒 Security

- Never commit `.env.local`
- Use HTTPS in production
- Implement rate limiting
- Validate Twilio webhook signatures
- Keep dependencies updated



## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [Better Auth](https://www.better-auth.com)
- [Twilio](https://twilio.com)
- [Resend](https://resend.com)


