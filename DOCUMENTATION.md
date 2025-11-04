# Unified Inbox - Technical Documentation

## 📋 Table of Contents

- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Message Flow](#message-flow)
- [Component Architecture](#component-architecture)
- [Integration Patterns](#integration-patterns)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Security](#security)
- [Performance](#performance)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture

### System Overview

The Unified Inbox follows a modern Next.js architecture with clear separation between client, server, and external services.

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

### Design Principles

1. **Factory Pattern**: Extensible channel integration architecture allowing easy addition of new messaging channels
2. **Type Safety**: Full TypeScript coverage across frontend and backend for compile-time error detection
3. **Separation of Concerns**: Clear boundaries between presentation, business logic, and data layers
4. **Webhook-Driven**: Real-time message reception via external webhooks from service providers
5. **Scheduled Processing**: Background job pattern for delayed message delivery

### Technology Stack

- **Frontend**: Next.js 14 with App Router, React 18, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with session-based security
- **Messaging**: Twilio (SMS/WhatsApp), Resend (Email)
- **Development**: TypeScript, Docker, ngrok

## 🗄️ Database Schema

### Entity Relationship Diagram

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

### Table Details

#### User Table
**Purpose**: Store user accounts and authentication data

**Key Fields**:
- `id`: Unique identifier using CUID format for distributed systems
- `email`: Unique email address used for login authentication
- `password`: Hashed password using Better Auth's bcrypt implementation
- `role`: User role for permission management (default: "user")
- `createdAt`: Account creation timestamp

#### Session Table
**Purpose**: Manage authentication sessions for logged-in users

**Key Fields**:
- `id`: Unique session identifier
- `token`: Session token used for auth validation in requests
- `expiresAt`: Session expiration timestamp (7 days default)
- `userId`: Foreign key linking to User table

**Behavior**: Sessions are validated on each request and cleaned up automatically on expiration

#### Contact Table
**Purpose**: Store customer and contact information across all channels

**Key Fields**:
- `id`: Unique contact identifier
- `name`: Display name for the contact
- `phone`: Unique phone number in E.164 format (e.g., +1234567890)
- `email`: Optional email address for email channel
- `socialHandles`: JSON field for additional contact methods (Twitter, LinkedIn, etc.)
- `metadata`: JSON field for custom data and integrations

**Constraints**: Phone and email have unique constraints to prevent duplicates

#### Message Table
**Purpose**: Store all messages across all channels in a unified schema

**Key Fields**:
- `id`: Unique message identifier
- `contactId`: Foreign key to Contact
- `userId`: Foreign key to User who sent/received message
- `channel`: Enum (sms, whatsapp, email)
- `direction`: Enum (inbound, outbound)
- `status`: Enum (sent, delivered, failed, scheduled, pending)
- `content`: Message body text
- `metadata`: JSON field for channel-specific data (Twilio SID, delivery receipts, etc.)
- `mediaUrl`: URL for attached media (MMS, WhatsApp images)
- `scheduledAt`: Timestamp for scheduled message delivery
- `sentAt`: Actual timestamp when message was sent
- `createdAt`: Message creation timestamp

**Design Notes**: Unified schema supports all channels rather than separate tables per channel

#### Note Table
**Purpose**: Internal team notes and collaboration about contacts

**Key Fields**:
- `id`: Unique note identifier
- `contactId`: Foreign key to Contact this note is about
- `userId`: Foreign key to User who created the note
- `content`: Note text supporting @mentions for team members
- `isPrivate`: Visibility flag (private notes only visible to creator)
- `mentions`: Array of user IDs mentioned in the note (extracted from @mentions)

**Features**: Supports team collaboration with @mentions and privacy controls

### Performance Indexes

Critical indexes for query performance:

| Table | Index | Purpose |
|-------|-------|---------|
| Contact | `phone` | Fast lookup for incoming messages |
| Contact | `email` | Email channel message routing |
| Message | `contactId` | Retrieve all messages for a contact |
| Message | `channel` | Filter by communication channel |
| Message | `status` | Query sent/failed/scheduled messages |
| Message | `scheduledAt` | Scheduler queries for due messages |
| Message | `(contactId, createdAt)` | Composite for chronological message history |
| Session | `token` | Fast session validation |
| Session | `expiresAt` | Cleanup of expired sessions |

## 📨 Message Flow

### Outbound Message Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Web UI
    participant API as API Routes
    participant F as Message Factory
    participant T as Twilio/Resend
    participant DB as Database
    
    U->>UI: Compose message
    UI->>API: POST /api/messages
    API->>DB: Verify contact exists
    DB-->>API: Contact data
    API->>F: createSender(channel)
    F->>T: Send message via API
    T-->>F: Message ID & status
    F-->>API: Result
    API->>DB: Save message record
    DB-->>API: Success
    API-->>UI: Message sent confirmation
    UI-->>U: Update UI with sent message
```

**Flow Description**:
1. User composes message in web interface
2. UI validates input and sends to API endpoint
3. API verifies contact exists and has required info (phone/email)
4. Message Factory creates appropriate sender (SMS/WhatsApp/Email)
5. Sender communicates with external service API
6. External service returns message ID and initial status
7. Message saved to database with metadata
8. UI updated to show sent message

### Inbound Message Flow

```mermaid
sequenceDiagram
    participant T as Twilio
    participant W as Webhook
    participant DB as Database
    participant UI as Web UI
    
    T->>W: POST /api/webhooks/twilio
    W->>DB: Find or create contact
    DB-->>W: Contact ID
    W->>DB: Save inbound message
    DB-->>W: Success
    W-->>T: 200 OK with TwiML
    
    Note over UI: User refreshes or polls
    UI->>DB: GET /api/messages
    DB-->>UI: New messages including inbound
```

**Flow Description**:
1. External service (Twilio) receives message from customer
2. Service immediately POSTs to configured webhook URL
3. Webhook endpoint finds existing contact or creates new one
4. Message saved with direction=inbound
5. Webhook returns 200 OK to acknowledge receipt (required by Twilio)
6. UI polls or refreshes to display new message
7. Future enhancement: WebSocket push for real-time updates

**Webhook Requirements**:
- Must respond within 15 seconds (Twilio timeout)
- Must return 200 status code or Twilio retries
- TwiML response can include auto-reply

### Scheduled Message Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as API Routes
    participant DB as Database
    participant S as Scheduler
    participant F as Factory
    participant T as Twilio
    
    U->>API: POST /api/messages (with scheduledAt)
    API->>DB: Save with status="scheduled"
    DB-->>API: Success
    API-->>U: Scheduled confirmation
    
    loop Every minute
        S->>DB: Query messages where scheduledAt <= now()
        DB-->>S: Due messages
        S->>F: Send each message
        F->>T: Deliver message
        T-->>F: Result
        F-->>S: Success/failure
        S->>DB: Update status & sentAt
    end
```

**Flow Description**:
1. User schedules message for future delivery
2. Message saved with `scheduledAt` timestamp and status="scheduled"
3. Scheduler runs every 60 seconds (configurable)
4. Queries database for messages due (scheduledAt in past, status=scheduled)
5. Each due message sent via appropriate channel
6. Status updated to "sent" or "failed" with sentAt timestamp
7. Failed messages can be retried or marked for manual review

**Scheduler Design**:
- Polling-based: Simple but not ideal for high volume
- Alternative: Queue-based with workers for scale
- Cron job in production (Vercel Cron, Railway Cron)
- Idempotent: Safe to run multiple times

## 🧩 Component Architecture

### Page Structure

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

### Component Responsibilities

#### MessageList Component
**Purpose**: Display list of contacts with recent message preview

**Features**:
- Shows all contacts with last message preview
- Displays unread message count badge
- Real-time updates via polling
- Search and filter by name, phone, email
- Click to open message thread

**State Management**: Fetches contacts and messages, manages selected contact

#### MessageThread Component
**Purpose**: Display full conversation history with selected contact

**Features**:
- Shows all messages in chronological order
- Groups messages by date
- Visual distinction between inbound/outbound
- Message status indicators (sent, delivered, failed)
- Media attachment display (images, files)
- Auto-scroll to latest message

**Performance**: Virtualized scrolling for long conversations

#### Composer Component
**Purpose**: Compose and send new messages

**Features**:
- Multi-line text input with character count
- Channel selector (SMS/WhatsApp/Email)
- Schedule message datetime picker
- Media URL input for attachments
- Send button with keyboard shortcuts (Cmd+Enter)
- Validation and error handling

**Smart Features**: Channel auto-selection based on contact info

#### ContactProfile Component
**Purpose**: View and edit contact information

**Features**:
- Display contact details
- Edit contact information modal
- View all notes for contact
- Add new internal notes
- @mention team members in notes
- Toggle private/public notes
- Message history summary statistics

**Access Control**: Private notes only visible to creator and admins

#### Dashboard Component
**Purpose**: Analytics and reporting

**Features**:
- Total messages sent/received metrics
- Total contacts count
- Average response time calculation
- Messages by channel breakdown (pie chart)
- Messages by status breakdown (bar chart)
- Daily activity timeline (line chart)
- Date range filter

**Data Updates**: Refreshes every 5 minutes or on demand

### UI Component Library

Reusable components for consistency:

- **Button**: Primary, secondary, danger variants with loading states
- **Input**: Text, email, phone with validation
- **Modal**: Dialog system for forms and confirmations
- **Select**: Dropdown for channel and filter selection
- **DatePicker**: Schedule message timestamp selection
- **Badge**: Status indicators and counts
- **Card**: Container for content sections
- **Navbar**: Main navigation with user menu

## 🔌 Integration Patterns

### Factory Pattern Implementation

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

### Integration Architecture

**MessageSender Interface**: All channel integrations implement a common interface with `send()` method

**Factory Pattern Benefits**:
- Easy to add new channels (Telegram, Slack, etc.)
- Consistent error handling across channels
- Testable with mock implementations
- Type-safe integration contracts

### Channel-Specific Implementations

#### Twilio SMS Sender
- Uses Twilio REST API
- Supports MMS (media messages)
- Returns Twilio Message SID as external ID
- Handles rate limiting and retries

#### Twilio WhatsApp Sender
- Uses Twilio WhatsApp API
- Requires recipient opt-in (sandbox or approved sender)
- Supports media, templates, and interactive messages
- 24-hour messaging window after user reply

#### Email Sender (Resend)
- Uses Resend API for transactional email
- HTML and plain text support
- Email templates possible
- Delivery tracking and bounces

### Adding New Channels

**To add a new channel** (e.g., Telegram):

1. Create new sender class implementing MessageSender interface
2. Add channel enum value to database schema
3. Update factory to return new sender
4. Add UI option in channel selector
5. Configure channel-specific credentials
6. Implement webhook handler if needed
7. Add tests for new integration

**Extension Points**: The factory pattern makes the system open for extension

## 📡 API Reference

### Authentication Endpoints

#### POST /api/auth/sign-up
Create a new user account

**Request Body**:
- `email` (string, required): Valid email address
- `password` (string, required): Minimum 8 characters
- `name` (string, required): User's full name

**Response**: User object with session token

**Errors**:
- 400: Invalid input (email taken, weak password)
- 500: Server error

#### POST /api/auth/sign-in
Authenticate existing user

**Request Body**:
- `email` (string, required): Registered email
- `password` (string, required): Account password

**Response**: User object with session token

**Errors**:
- 401: Invalid credentials
- 500: Server error

### Contact Endpoints

#### GET /api/contacts
List all contacts with optional search

**Query Parameters**:
- `search` (string, optional): Search by name, phone, or email

**Response**: Array of contact objects

**Sorting**: Alphabetical by name

#### POST /api/contacts
Create a new contact

**Request Body**:
- `name` (string, required): Contact name
- `phone` (string, optional): Phone in E.164 format
- `email` (string, optional): Valid email address

**Validation**: At least phone or email required

**Response**: Created contact object

**Errors**:
- 400: Invalid input or duplicate phone/email
- 500: Server error

#### PUT /api/contacts/:id
Update existing contact

**Request Body**: Same as POST (partial updates allowed)

**Response**: Updated contact object

### Message Endpoints

#### GET /api/messages
Retrieve messages with filters

**Query Parameters**:
- `contactId` (string, optional): Filter by contact
- `channel` (enum, optional): Filter by sms/whatsapp/email
- `status` (enum, optional): Filter by sent/delivered/failed/scheduled
- `direction` (enum, optional): Filter by inbound/outbound

**Response**: Array of message objects with contact info

**Pagination**: Not implemented (consider for large datasets)

#### POST /api/messages
Send a new message

**Request Body**:
- `contactId` (string, required): Target contact ID
- `channel` (enum, required): sms, whatsapp, or email
- `content` (string, required): Message text (1-1600 chars)
- `userId` (string, required): Sender user ID
- `scheduledAt` (ISO datetime, optional): Schedule for later
- `mediaUrl` (URL, optional): Media attachment URL

**Validation**: Contact must have phone (SMS/WhatsApp) or email (Email)

**Response**: Created message object with send status

**Errors**:
- 400: Invalid input or missing contact info
- 500: Server or external API error

### Note Endpoints

#### GET /api/notes
Get notes for a contact

**Query Parameters**:
- `contactId` (string, required): Contact ID

**Response**: Array of note objects

**Privacy**: Private notes filtered by user

#### POST /api/notes
Create a new note

**Request Body**:
- `contactId` (string, required): Contact ID
- `userId` (string, required): Author user ID
- `content` (string, required): Note text
- `isPrivate` (boolean, optional): Privacy flag (default: false)

**Processing**: Automatically extracts @mentions from content

**Response**: Created note object

### Analytics Endpoints

#### GET /api/analytics
Get analytics data

**No Parameters**: Returns all metrics

**Response Fields**:
- `totalMessages`: Count of all messages
- `totalContacts`: Count of all contacts
- `byChannel`: Array of message counts per channel
- `byStatus`: Array of message counts per status
- `avgResponseTime`: Average seconds to first response
- `dailyActivity`: Object mapping dates to message counts

**Performance**: Consider caching for large datasets

### Webhook Endpoints

#### POST /api/webhooks/twilio
Receive incoming messages from Twilio

**Content-Type**: `application/x-www-form-urlencoded`

**Twilio Parameters**:
- `MessageSid`: Unique message identifier
- `From`: Sender phone number
- `To`: Recipient phone (your Twilio number)
- `Body`: Message text content
- `NumMedia`: Number of media attachments
- `MediaUrl0`: First media attachment URL

**Response**: TwiML XML (200 OK required)

**Processing**:
- Find or create contact by phone
- Save message with direction=inbound
- Can include auto-reply in TwiML

**Security**: Should validate Twilio signature (not implemented)

### Scheduled Message Endpoints

#### POST /api/scheduled
Process scheduled messages (cron job)

**Authentication**: Should be protected (API key or internal only)

**Processing**:
- Queries messages where scheduledAt <= now() and status="scheduled"
- Sends each message via appropriate channel
- Updates status to "sent" or "failed"

**Response**: Count of processed, sent, and failed messages

#### GET /api/scheduled
List all scheduled messages

**Response**: Array of upcoming scheduled messages

**Use Case**: Admin interface to view/cancel scheduled messages

## ⚙️ Configuration

### Environment Variables

#### Required Variables

| Variable | Description | Format | Example |
|----------|-------------|--------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:port/db` | `postgresql://postgres:password@localhost:5432/unified_inbox` |
| `BETTER_AUTH_SECRET` | Auth secret key (min 32 chars) | Base64 string | Generated via `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Application base URL | URL | `http://localhost:3000` (dev) or `https://yourdomain.com` (prod) |
| `TWILIO_ACCOUNT_SID` | Twilio account identifier | AC + 32 hex chars | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Twilio API authentication token | 32 alphanumeric | Your auth token from console |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number | E.164 format | `+1234567890` |

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend email API key | N/A (email disabled without) |
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |

### Twilio Configuration

#### SMS Setup
1. Purchase phone number with SMS capabilities
2. Navigate to Phone Numbers → Manage → Active Numbers
3. Click your phone number
4. Under "Messaging" → "A MESSAGE COMES IN":
   - Webhook URL: `https://yourdomain.com/api/webhooks/twilio`
   - HTTP Method: `POST`
5. Save configuration

#### WhatsApp Setup
1. Request WhatsApp Business API access in Twilio console
2. For testing, use WhatsApp Sandbox:
   - Get your sandbox number from console
   - Users send "join [keyword]" to opt-in
3. Configure webhook (same URL as SMS)
4. For production: Apply for WhatsApp Business approval

#### MMS Support
- Ensure phone number supports MMS in console
- No additional configuration needed
- Media URLs must be publicly accessible
- Supported formats: JPEG, PNG, GIF (images), PDF (documents)

### Database Configuration

#### Connection String Format
`postgresql://[user[:password]@][host][:port][/dbname][?parameters]`

#### Connection Pooling
Add to connection string: `?connection_limit=20&pool_timeout=10`

Recommended limits:
- Development: 5-10 connections
- Production: 20-50 connections (depends on server resources)

#### SSL Configuration
For cloud databases add: `?sslmode=require`

Options:
- `disable`: No SSL
- `require`: SSL required
- `verify-ca`: Verify certificate authority
- `verify-full`: Full verification

### Resend Configuration

#### Email Setup
1. Sign up at resend.com
2. Get API key from dashboard
3. Verify sending domain or use onboarding domain
4. Configure in `.env.local`

#### Free Tier Limits
- 100 emails per day
- 3,000 emails per month
- No credit card required

## 🔒 Security

### Authentication Security

**Session-Based Auth**: Better Auth provides secure session management
- Sessions expire after 7 days (configurable)
- Secure cookies with httpOnly and sameSite flags
- CSRF protection built-in

**Password Security**:
- Minimum 8 characters enforced
- Bcrypt hashing with salt
- No plaintext passwords stored
- Password reset via email (to be implemented)

### API Security

#### Rate Limiting
**Recommended Implementation**:
- 10 requests per minute per IP for auth endpoints
- 100 requests per minute per user for API endpoints
- 1000 requests per hour for heavy operations

**Without Rate Limiting**: Vulnerable to brute force and DoS attacks

#### Input Validation
**All inputs validated using Zod schemas**:
- Type checking (string, number, email, URL)
- Length limits (message content max 1600 chars)
- Format validation (phone E.164, email RFC 5322)
- Sanitization to prevent XSS

#### Authorization
**Current**: Basic session checking
**Recommended**:
- Role-based access control (admin, user, viewer)
- Resource-level permissions (own messages only)
- API key for webhook endpoints

### Webhook Security

#### Twilio Signature Validation
**Recommended**: Validate X-Twilio-Signature header
- Prevents spoofed webhook requests
- Ensures requests are from Twilio
- Uses HMAC-SHA1 with auth token

**Current State**: Not implemented (security gap)

#### Webhook Best Practices
- Use HTTPS only (Twilio requirement)
- Validate signature on every request
- Return 200 within 15 seconds
- Log all webhook requests for audit
- Handle replay attacks (check MessageSid uniqueness)

### Data Protection

#### Personal Identifiable Information (PII)
**Current Storage**: Plain text in database
**Recommended**:
- Encrypt phone numbers and email addresses at rest
- Use application-level encryption (not just database encryption)
- Key management via environment variables or vault

#### Data Retention
**Recommended Policies**:
- Delete messages older than 2 years
- Archive inactive contacts after 1 year
- GDPR compliance: Right to deletion
- Backup retention: 30 days

#### Audit Logging
**Recommended**:
- Log all message sends
- Track contact edits with user attribution
- Monitor failed login attempts
- Alert on suspicious patterns

### Production Security Checklist

- [ ] Enable HTTPS with valid certificate
- [ ] Set secure environment variables
- [ ] Implement rate limiting
- [ ] Validate Twilio webhook signatures
- [ ] Add CORS restrictions
- [ ] Enable database SSL
- [ ] Implement proper error handling (don't leak stack traces)
- [ ] Add security headers (HSTS, CSP, X-Frame-Options)
- [ ] Regular dependency updates
- [ ] Security audit before launch
- [ ] Encrypt sensitive data at rest
- [ ] Implement audit logging
- [ ] Setup monitoring and alerts

## ⚡ Performance

### Database Performance

#### Index Strategy
**Critical Indexes**:
- Contact phone and email for webhook lookups
- Message contactId for conversation queries
- Message scheduledAt for scheduler
- Composite indexes for common queries

**Index Maintenance**:
- Monitor index usage with EXPLAIN ANALYZE
- Drop unused indexes (slow down writes)
- Rebuild fragmented indexes periodically

#### Query Optimization
**Common Issues**:
- N+1 query problem: Use Prisma `include` to fetch relations
- Missing WHERE clause indexes
- SELECT * instead of specific fields
- No pagination on large result sets

**Optimization Techniques**:
- Use database views for complex queries
- Denormalize for read-heavy tables
- Implement query result caching
- Use database connection pooling

#### Connection Pooling
**PgBouncer Recommended** for production:
- Transaction pooling mode
- Pool size: 20-50 connections
- Reduces connection overhead
- Handles connection spikes

### Caching Strategy

#### Application-Level Caching
**Redis Recommended** for:
- User sessions (reduce database load)
- Contact list (cache for 5 minutes)
- Analytics dashboard (cache for 15 minutes)
- API responses with low change frequency

**Cache Invalidation**:
- Time-based expiration (TTL)
- Event-based invalidation (on updates)
- Cache-aside pattern for flexibility

#### CDN Caching
**For Production**:
- Static assets (JS, CSS, images)
- Public API responses
- Media attachments (MMS images)

### Frontend Performance

#### Code Splitting
- Lazy load Analytics page (not needed immediately)
- Dynamic imports for heavy components
- Route-based code splitting with Next.js

#### Asset Optimization
- Next.js Image component for automatic optimization
- WebP format with fallback
- Lazy loading for images below fold
- Bundle size monitoring

#### Rendering Strategy
- Server-side rendering for initial page load
- Client-side fetching for real-time data
- Incremental Static Regeneration for analytics
- React Suspense for loading states

### API Performance

#### Response Time Targets
- Authentication: < 200ms
- Message send: < 500ms (includes external API)
- Contact list: < 100ms
- Message history: < 200ms
- Analytics: < 1000ms

#### Performance Monitoring
**Recommended Tools**:
- Next.js built-in analytics
- Vercel Analytics (if deployed on Vercel)
- Custom logging of slow queries
- APM tool (DataDog, New Relic) for production

### Scalability Bottlenecks

**Current Limitations** (Single Server):
- Database polling for scheduler (inefficient)
- No horizontal scaling
- Single point of failure
- Limited concurrent requests

**Scale to 10,000+ messages/day**:
- Add Redis for caching and queues
- Implement message queue (Bull/BullMQ)
- Separate worker processes for scheduler
- Database read replicas
- Connection pooling with PgBouncer

**Scale to 100,000+ messages/day**:
- Microservices architecture
- Kubernetes for orchestration
- Message broker (RabbitMQ, Kafka)
- Distributed caching (Redis Cluster)
- Multiple database instances with sharding
- Load balancers with multiple app instances
- Real-time updates via WebSockets

## 🚀 Deployment

### Vercel Deployment

#### Features
- Zero-config deployment
- Automatic HTTPS
- Edge network CDN
- Serverless functions for API routes
- Built-in cron jobs
- Environment variable management

#### Setup Process
1. Connect GitHub repository
2. Configure build settings (auto-detected for Next.js)
3. Add environment variables in dashboard
4. Deploy preview branch
5. Deploy to production
6. Configure custom domain (optional)

#### Cron Configuration
Create `vercel.json` in project root to configure scheduler:
- Path: `/api/scheduled`
- Schedule: Every minute (`* * * * *`)
- Production only

#### Limitations
- 10 second function timeout (Hobby plan)
- 50 second timeout (Pro plan)
- Cold starts for infrequent routes
- Serverless functions have stateless architecture

### Railway Deployment

#### Features
- One-click PostgreSQL setup
- Automatic SSL certificates
- Git-based deployments
- Built-in monitoring
- Cron job support

#### Setup Process
1. Create Railway account
2. New Project → Deploy from GitHub
3. Add PostgreSQL service (automatically linked)
4. Configure environment variables
5. Deploy on push to main branch
6. Setup custom domain

#### Database
- Managed PostgreSQL included
- Automatic backups
- Connection pooling available
- Database URL automatically injected

#### Pricing
- $5/month for hobby projects
- Pay for resource usage (RAM, CPU)
- Database included in base price

### Docker Deployment

#### Container Architecture
- Multi-stage build for optimization
- Node.js 18 Alpine base image
- Production dependencies only
- Prisma client generated during build

#### Deployment Options
- **Self-hosted**: VPS with Docker
- **AWS ECS**: Managed container service
- **Google Cloud Run**: Serverless containers
- **Digital Ocean App Platform**: Simplified container hosting

#### Orchestration
For multiple containers, use Docker Compose or Kubernetes:
- Docker Compose: Simple multi-container setup
- Kubernetes: Production-grade orchestration with auto-scaling
- Docker Swarm: Alternative orchestration tool

### Production Deployment Checklist

#### Pre-Deployment
- [ ] Update `BETTER_AUTH_URL` to production domain
- [ ] Generate new `BETTER_AUTH_SECRET` for production
- [ ] Configure production database with SSL
- [ ] Setup database backups (daily snapshots)
- [ ] Update Twilio webhook URLs to production
- [ ] Test all channels in staging environment
- [ ] Configure custom domain and DNS
- [ ] Setup SSL/TLS certificates

#### Post-Deployment
- [ ] Run database migrations
- [ ] Verify environment variables loaded correctly
- [ ] Test authentication flow
- [ ] Send test messages on all channels (SMS, WhatsApp, Email)
- [ ] Verify webhooks receiving messages
- [ ] Confirm scheduler is running (check cron logs)
- [ ] Setup monitoring and alerts
- [ ] Configure error tracking (Sentry, Rollbar)
- [ ] Enable rate limiting
- [ ] Test mobile responsiveness
- [ ] Load testing for expected traffic
- [ ] Document rollback procedure

#### Monitoring Setup
- [ ] Application performance monitoring (APM)
- [ ] Error tracking and alerting
- [ ] Database performance metrics
- [ ] External API uptime monitoring (Twilio, Resend)
- [ ] Log aggregation (CloudWatch, LogDNA)
- [ ] User analytics (optional)

### Environment-Specific Configuration

#### Development Environment
- Use ngrok for webhook testing
- Local PostgreSQL via Docker
- Debug logging enabled
- Twilio sandbox numbers
- Hot reload enabled

#### Staging Environment
- Production-like configuration
- Separate database instance
- Real Twilio numbers (test account)
- Monitoring without alerts
- Same deployment process as production

#### Production Environment
- Managed database with replication
- Production Twilio account
- Error monitoring with alerts
- Rate limiting enabled
- CDN for static assets
- Database connection pooling
- Scheduled backups

### Continuous Integration/Deployment

#### CI Pipeline Recommendations
1. **Lint and Type Check**: ESLint, TypeScript compiler
2. **Unit Tests**: Jest for business logic
3. **Integration Tests**: API endpoint testing
4. **Build**: Next.js production build
5. **Database Migrations**: Prisma migrate
6. **Deploy**: Platform-specific deployment

#### CD Strategy
- **Main Branch**: Auto-deploy to production
- **Develop Branch**: Auto-deploy to staging
- **Feature Branches**: Deploy preview environments
- **Rollback**: Keep last 3 versions for quick rollback

### Database Migration Strategy

#### Development
- Use `prisma db push` for quick schema changes
- No migration files needed
- Fast iteration

#### Production
- Always use `prisma migrate deploy`
- Generate migration files in development
- Test migrations in staging first
- Backup database before migrations
- Plan for zero-downtime migrations

#### Zero-Downtime Migration Pattern
1. Add new columns (nullable)
2. Deploy application code that writes to both old and new
3. Backfill data to new columns
4. Deploy code that reads from new columns
5. Remove old columns in separate migration

### Backup and Disaster Recovery

#### Database Backups
- **Frequency**: Daily automated backups
- **Retention**: 30 days for daily, 12 months for monthly
- **Storage**: Off-site backup location
- **Testing**: Quarterly restore testing

#### Application Backups
- Version control (Git) for all code
- Environment variables documented in secure vault
- Infrastructure as Code (Terraform, CloudFormation)

#### Disaster Recovery Plan
1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 1 hour (database backup frequency)
3. **Runbook**: Documented restoration steps
4. **Testing**: Annual disaster recovery drill

## 🐛 Troubleshooting

### Database Issues

#### Connection Failures

**Symptom**: `Error: P1001: Can't reach database server`

**Possible Causes**:
- PostgreSQL not running
- Wrong connection string
- Network/firewall blocking connection
- Database server crashed

**Resolution Steps**:
1. Verify PostgreSQL is running (Docker or local service)
2. Check connection string format and credentials
3. Test connection with `psql` or database client
4. Check firewall rules and security groups
5. Verify database server has available connections

#### Unique Constraint Violations

**Symptom**: `Error: P2002: Unique constraint failed`

**Cause**: Attempting to create duplicate phone or email

**Resolution**:
- Check if contact already exists before creating
- Use upsert pattern (findUnique or create)
- Display user-friendly error message
- Provide option to update existing contact

#### Slow Queries

**Symptom**: API responses taking > 2 seconds

**Diagnosis**:
- Enable Prisma query logging
- Use PostgreSQL EXPLAIN ANALYZE
- Check for missing indexes
- Look for N+1 query patterns

**Resolution**:
- Add appropriate indexes
- Use Prisma include for relations
- Implement pagination for large datasets
- Consider database query caching

### Twilio Webhook Issues

#### Messages Not Appearing in Inbox

**Checklist**:
1. ✅ ngrok tunnel is running (development)
2. ✅ ngrok URL hasn't changed (restart updates URL)
3. ✅ Webhook URL correctly configured in Twilio console
4. ✅ URL includes full path: `/api/webhooks/twilio`
5. ✅ HTTP method is POST, not GET
6. ✅ Webhook endpoint returns 200 status

**Debugging**:
- Check Twilio Console → Monitor → Logs → Errors
- View ngrok request inspector: `http://localhost:4040`
- Add logging to webhook endpoint
- Test webhook with curl or Postman

#### HTTP Retrieval Failure (Error 11200)

**Symptom**: Twilio shows "HTTP retrieval failure" in logs

**Causes**:
- ngrok tunnel stopped
- Webhook URL incorrect
- Endpoint taking > 15 seconds to respond
- Server returned non-200 status code

**Resolution**:
- Restart ngrok and update webhook URL in Twilio
- Verify endpoint is accessible (test with browser/curl)
- Optimize endpoint to respond quickly
- Return 200 even if processing fails (handle async)

#### Webhook Receiving but Not Saving

**Possible Issues**:
- Database connection failed in webhook handler
- Phone number format mismatch (E.164 required)
- Missing required fields from Twilio
- Exception thrown before saving to database

**Debugging**:
- Add comprehensive logging to webhook
- Wrap in try-catch and log errors
- Verify phone number normalization
- Check database constraints

### Authentication Issues

#### Secret Key Too Short

**Symptom**: `Error: BETTER_AUTH_SECRET must be at least 32 characters`

**Resolution**:
- Generate new secret: `openssl rand -base64 32`
- Update `.env.local` with generated secret
- Restart Next.js development server
- Never commit secret to version control

#### Session Expires Immediately

**Causes**:
- Cookie not being set (HTTPS/HTTP mismatch)
- BETTER_AUTH_URL incorrect
- Browser blocking cookies
- Session expired in database

**Resolution**:
- Verify BETTER_AUTH_URL matches actual URL
- Clear browser cookies for localhost/domain
- Check browser console for cookie errors
- In production, ensure HTTPS everywhere

#### Unauthorized After Login

**Symptom**: Logged in but API requests return 401

**Causes**:
- Session token not sent in requests
- Session expired
- Database session record deleted
- Token validation failing

**Resolution**:
- Check network tab for Authorization header
- Verify session exists in database
- Re-login to generate new session
- Check Better Auth configuration

### Message Sending Issues

#### SMS Sends but WhatsApp Fails

**Causes**:
- WhatsApp sandbox not joined
- Recipient not in approved list
- 24-hour messaging window expired
- WhatsApp Business API not approved

**Resolution**:
- Send "join [sandbox-keyword]" from recipient phone
- Verify WhatsApp API status in Twilio console
- For production, complete WhatsApp Business approval
- Check Twilio logs for specific error code

#### Contact Missing Phone or Email

**Symptom**: `Error: Contact missing required phone/email`

**Resolution**:
- Verify contact has phone for SMS/WhatsApp
- Verify contact has email for Email channel
- Update contact with missing information
- Show channel selector based on available contact info

#### Media Attachment Fails

**Causes**:
- Media URL not publicly accessible
- Unsupported file format
- File size too large (5MB limit for MMS)
- SSL certificate issues with media URL

**Resolution**:
- Test media URL in browser (should download)
- Use supported formats: JPEG, PNG, GIF, PDF
- Compress large images
- Use HTTPS URLs only

### Scheduler Issues

#### Scheduled Messages Not Sending

**Checklist**:
1. ✅ Scheduler process running (`npm run scheduler` in terminal)
2. ✅ Message has `scheduledAt` timestamp in the past
3. ✅ Message status is "scheduled" not "sent"
4. ✅ No errors in scheduler terminal output
5. ✅ Database connection working

**Manual Testing**:
- Trigger scheduler manually: `curl -X POST http://localhost:3000/api/scheduled`
- Check database for messages with status="scheduled"
- Verify scheduledAt is in correct timezone (UTC)
- Review scheduler logs for errors

#### Messages Sent Multiple Times

**Cause**: Multiple scheduler instances running concurrently

**Resolution**:
- Ensure only one scheduler process running
- In production, use managed cron (Vercel Cron, Railway Cron)
- Implement idempotency: Check message not already sent
- Add database transaction locks

#### Scheduler Missing Messages

**Causes**:
- Query not finding due messages (timezone issue)
- Database index missing on scheduledAt
- Scheduler crashed and restarted
- Messages scheduled for far future

**Resolution**:
- Verify scheduledAt values in database
- Check scheduler query logic
- Add database index on scheduledAt
- Implement scheduler heartbeat monitoring

### Build and Deployment Issues

#### Module Not Found

**Symptom**: `Module not found: Can't resolve '@/...'`

**Causes**:
- TypeScript path aliases not configured
- Missing dependencies in package.json
- Build cache corruption

**Resolution**:
- Verify `tsconfig.json` paths configuration
- Run `npm install` to ensure all dependencies
- Delete `.next` folder and rebuild
- Check import paths use correct aliases

#### Prisma Client Not Generated

**Symptom**: `Cannot find module '@prisma/client'`

**Resolution**:
- Run `npx prisma generate`
- Add `postinstall` script to package.json: `prisma generate`
- Verify schema.prisma exists and is valid
- In Docker builds, ensure `prisma generate` in Dockerfile

#### Environment Variables Not Loading

**Symptom**: Variables undefined at runtime

**Causes**:
- Wrong environment file (.env vs .env.local)
- Variables not prefixed with NEXT_PUBLIC_ (for client-side)
- Deployment platform not configured
- Cached build with old variables

**Resolution**:
- Use `.env.local` for local development
- Use deployment platform's environment variable settings
- Restart dev server after changing .env.local
- In Vercel/Railway, redeploy after updating variables

### Performance Issues

#### Slow Page Load

**Diagnosis**:
- Use browser DevTools Performance tab
- Check Network tab for slow requests
- Monitor database query times
- Check for large bundle sizes

**Common Causes**:
- Unoptimized images
- Too many API requests on page load
- Slow database queries without indexes
- Large JavaScript bundles

**Resolution**:
- Use Next.js Image component
- Implement pagination for large lists
- Add database indexes
- Code splitting for heavy components

#### High Memory Usage

**Symptom**: Server crashes with "Out of Memory"

**Causes**:
- Memory leaks in long-running processes
- Large dataset loaded into memory
- Too many database connections
- Insufficient server resources

**Resolution**:
- Implement pagination instead of loading all data
- Use database streaming for large queries
- Close database connections properly
- Increase server memory allocation
- Monitor with memory profiling tools

### Common Error Codes

| Error | Meaning | Resolution |
|-------|---------|------------|
| P1001 | Can't reach database | Check connection string and database status |
| P2002 | Unique constraint failed | Handle duplicate data gracefully |
| P2025 | Record not found | Check IDs and handle missing records |
| 11200 | Twilio HTTP failure | Fix webhook URL or response time |
| 21211 | Invalid Twilio phone | Use E.164 format (+1234567890) |
| 21408 | Permission denied | Check Twilio capabilities for number |
| 401 | Unauthorized | Login required or session expired |
| 429 | Rate limit exceeded | Implement backoff or increase limits |

### Debug Mode

#### Enable Verbose Logging

**Development**: Set environment variable `DEBUG=*` for comprehensive logging

**Prisma**: Enable query logging in `lib/db.ts`

**Next.js**: Run with `NODE_OPTIONS='--inspect' npm run dev` for debugging

**Twilio**: Check webhook request/response in ngrok inspector

#### Useful Debugging Tools

- **Prisma Studio**: Visual database browser
- **ngrok Inspector**: View webhook requests
- **React DevTools**: Inspect component state
- **Network Tab**: Monitor API requests
- **Console Logs**: Strategic logging in code


### Future Enhancements

**Potential Features to Add**:
- Real-time updates via WebSockets
- Message templates for quick replies
- Bulk messaging to multiple contacts
- Advanced analytics with custom date ranges
- Contact segmentation and tagging
- Team collaboration features
- Message history export
- Automated follow-up sequences
- Integration with CRM systems
- Mobile applications (iOS, Android)
- Voice call integration
- Chat bot capabilities
- Multi-language support
- Custom branding options

**Architectural Improvements**:
- Migrate to message queue system
- Implement event-driven architecture
- Add full-text search (Elasticsearch)
- Implement read replicas for scaling
- Add circuit breakers for external APIs
- Implement distributed tracing
- Add GraphQL API option
- Implement WebSocket for real-time
- Add automated testing suite

---
