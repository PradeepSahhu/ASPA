## ASPA (Author Support Automation)

This is a monorepo for the ASPA Project, it contains both the Frontend and the Backend of the project. The project is built using React for the frontend and Node.js's Express for the backend.

## Railway Deployment

This repository is now set up for Railway as two separate services:

1. Backend service
2. Frontend service

Create two Railway services from the same GitHub repository and set each service's root directory:

- Backend service root directory: `Backend`
- Frontend service root directory: `Frontend`

Each folder contains its own `railway.json` and `Dockerfile`, so Railway can build and deploy them independently.

### Backend service settings

- Root directory: `Backend`
- Start command: use the Dockerfile default
- Required environment variables:
  - `PORT=3000`
  - `DATABASE_URL=<your postgres connection string>`
  - `REDIS_URL=<your redis connection string>`
  - `ACCESS_TOKEN_SECRET=<your secret>`
  - `CLIENT_URL=<your Railway frontend domain>`
  - `ALLOWED_ORIGINS=<your Railway frontend domain>`
  - `DEEPSEEK_API_KEY=<your api key>`

The backend already uses `CLIENT_URL` and `ALLOWED_ORIGINS` for CORS and Socket.IO origin checks.

### Frontend service settings

- Root directory: `Frontend`
- Start command: use the Dockerfile default
- Required environment variables:
  - `PORT=4173`
  - `VITE_API_URL=<your Railway backend domain>`

The frontend reads `VITE_API_URL` at build time, so set it to the public backend URL before deploying.

### Recommended Railway flow

1. Create the backend service first and deploy it.
2. Copy the backend public domain and set it as `VITE_API_URL` in the frontend service.
3. Deploy the frontend service.
4. Copy the frontend public domain and set it as `CLIENT_URL` and `ALLOWED_ORIGINS` in the backend service.
5. Redeploy the backend service so CORS and Socket.IO allow the frontend domain.

### Current root-level Railway files

The root-level `railway.json` and `Dockerfile.railway` represent the older single-service backend deployment. For a split Railway deployment, use the per-service setup under `Backend/` and `Frontend/`.

## Database

<img src="./Docs/Images/ER-diagram.png" alt="Database Schema" width="600"/>

### Prerequisites

- PostgreSQL database running (either locally via Postgres.app or through Docker)
- Environment variable `DATABASE_URL` configured in `.env`

### Initial Setup

The database schema has been defined using Prisma ORM. To initialize the database:

1. Ensure your PostgreSQL database is running
2. Create or update your `.env` file with the database connection string:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/socialmedia"
   ```
3. Run the initial migration to create all tables:
   ```bash
   cd Backend
   npx prisma migrate dev --name init
   ```
4. Generate the Prisma Client:
   ```bash
   npx prisma generate
   ```

### How `DATABASE_URL` Is Used

With Prisma 7 and the `@prisma/adapter-pg` driver adapter, `DATABASE_URL` is consumed by two separate systems at different stages:

| Where                                           | Reads `DATABASE_URL` for                | When           |
| ----------------------------------------------- | --------------------------------------- | -------------- |
| `schema.prisma` / `prisma.config.ts` datasource | Prisma CLI: migrate, generate, db push  | dev/build time |
| `index.js` → `PrismaPg({ connectionString })`   | Your app's live queries via the pg pool | runtime        |

## Database Models & API Documentation

The application uses the following Prisma models:

### Author

- **Fields**: id, name, email, password, phone, city, accountNumber, joinedDate, updatedDate
- **Relations**:
  - `books` - Books written by the author
  - `tickets` - Support tickets created by the author
- **Table**: `authors`

### Admin

- **Fields**: id, name, email, password, contactInfo, joinedDate, updatedDate
- **Relations**:
  - `assigned` - Tickets assigned to this admin
  - `ticketNotes` - Notes created by this admin
- **Table**: `admins`

### Book

- **Fields**: id, authorId, title, isbn, status, genre, publicationDate, mrp, authorRoyaltyPerCopy, totalCopiesSold, totalRoyaltyEarned, royaltyPaid, royaltyPending, lastRoyaltyPayoutDate, printPartner, availableOn, createdDate, updatedDate
- **Relations**:
  - `author` - The author of the book
  - `tickets` - Tickets related to this book
- **Table**: `books`

### Ticket

- **Fields**: id, authorId, category, bookId, header, detailDescription, status, assignedId, priorityScore, aiDraft, createdDate, updatedDate, resolvedDate
- **Relations**:
  - `author` - Author who created the ticket
  - `book` - Book associated with the ticket (optional)
  - `assignedAdmin` - Admin assigned to the ticket (optional)
  - `notes` - Notes added to this ticket
  - `messages` - Messages in this ticket thread
- **Table**: `tickets`

### TicketNote

- **Fields**: id, ticketId, adminId, message, visibility
- **Relations**:
  - `ticket` - Parent ticket
  - `admin` - Admin who created the note
- **Table**: `ticket_notes`

### TicketMessage

- **Fields**: id, ticketId, responseActor, message, createdAt
- **Relations**:
  - `ticket` - Parent ticket
- **Table**: `ticket_messages`
- **ResponseActor Enum**: AUTHOR, LLM, ADMIN

## Running Migrations

### Create a New Migration

When you modify the Prisma schema, create a new migration:

```bash
cd Backend
npx prisma migrate dev --name <migration_name>
```

Example:

```bash
npx prisma migrate dev --name add_user_status
```

### Apply Existing Migrations

To apply migrations to a deployed database:

```bash
npx prisma migrate deploy
```

### Reset Database (Development Only)

To reset the entire database and re-run all migrations:

```bash
npx prisma migrate reset
```

### View Migration Status

```bash
npx prisma migrate status
```

### Generate Prisma Client

After any schema changes, regenerate the Prisma Client:

```bash
npx prisma generate
```

## LLM Integration

I will be using the langchain library to integrate with the DeepSeek LLM API (OpenAI Spec). the langchain provides two types of agents.

1. langchain agents : for fine grained control over the agent's behavior and the no tools by default.

2. deep agents : for a more out of the box experience with a set of pre defined tools and a more general agent behavior.(planning etc)

[Link](https://docs.langchain.com/oss/javascript/langchain/quickstart#)
I will be using the deep agents for this project.

Redis and Vector DB using : https://console.upstash.com/redis/6353a65a-45de-4579-aa14-c876a41759fe
