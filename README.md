## ASPA (Authors Support Platform and Automation)

This is a monorepo for the ASPA Project, it contains both the Frontend and the Backend of the project. The project is built using React for the frontend and Node.js's Express for the backend.

This is going to be pure technical README.md, here i will write about the technical details of the project, how to run it locally and

## System Architecture

<img src="./Docs/Images/system-architecture.png" alt="ASPA System Architecture" width="900"/>

The Deployed URL : https://aspa-pradeepsahu.up.railway.app

## Local Setup (Specific Steps)

### Option A: Run with Docker Compose (recommended)

Run all commands from the repository root (the folder that contains `docker-compose.yml`).

1. Create backend env file:

```bash
cp Backend/.env.example Backend/.env
```

2. Update required values in `Backend/.env`:

- `PORT=3000`
- `DATABASE_URL` (for local compose, can be left as-is from compose override)
- `REDIS_URL` (for local compose, can be left as-is from compose override)
- `ACCESS_TOKEN_SECRET`
- `DEEPSEEK_API_KEY`

3. Start all services:

```bash
docker compose up --build
```

4. Open the app:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

5. Stop services:

```bash
docker compose down
```

Notes for Docker startup:

- Backend container runs `npm run start:railway`, which automatically runs `prisma migrate deploy` and `prisma db seed` before starting the server.
- This means migrations + seed run on backend container start/restart.
- If `docker compose up` fails, make sure you are in the repo root, not `Backend/`.

### Option B: Run locally without Docker

Prerequisites:

- Node.js 20+
- Local Postgres and Redis running

1. Backend:

```bash
cd Backend
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

2. Worker (new terminal):

```bash
cd Backend
npm run worker
```

3. Frontend (new terminal):

```bash
cd Frontend
npm install
npm run dev
```

4. Open frontend:

- `http://localhost:5173`

Default frontend API target is `http://localhost:3000` if `VITE_API_URL` is not set.

## Railway Deployment

This repository is now set up for Railway as two separate services:

1. Backend service
2. Frontend service
3. Background Worker
4. Postgres Database
5. Redis Database

Create two Railway services from the same GitHub repository and set each service's root directory:

- Backend service root directory: `Backend`
- Frontend service root directory: `Frontend`
- Background Worker root directory: `BackgroundWorker`

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

### Railway Deployment Screenshot

<img src="./Docs/Images/railway-deployed.png" alt="Railway Deployment" width="900"/>

### Current root-level Railway files

The root-level `railway.json` and `Dockerfile.railway` represent the older single-service backend deployment. For a split Railway deployment, use the per-service setup under `Backend/` and `Frontend/`.

## Database

<img src="./Docs/Images/ER-diagram.png" alt="Database Schema" width="600"/>

### Hosted Database

<img src="./Docs/Images/hosted-database.png" alt="Hosted Database Setup" width="600"/>

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

This project uses LangChain with the DeepSeek API (OpenAI-compatible) for ticket analysis, categorization, prioritization, and draft generation.

Reference:
[LangChain Quickstart](https://docs.langchain.com/oss/javascript/langchain/quickstart#)

### LLM Tools and Structure

LLM code lives under `Backend/src/llm` and is organized as follows:

- `lllm.js`
  - Core LLM invocation layer used by controllers and worker jobs.

- `Prompts/`
  - Prompt templates and prompt builders.
  - Includes:
    - `classificationAndPriorityScore.prompt.js`
    - `Database.prompt.js`
    - `generalInquiry.prompt.js`
    - `generateDraft.prompt.js`
    - `masterResponseRules.prompt.js`
    - `ticketUserPrompt.builder.js`

- `Tools/`
  - Task-specific tool modules used by the LLM flow.
  - Includes:
    - `AnalyzeTicketPriority.tool.js`
    - `Database.tool.js`
    - `UpdateTicketCategory.tool.js`
    - `UpdateTicketPriority.tool.js`
    - `finalAnswer.tool.js`

- `Registry/`
  - Tool registration and discovery.
  - Includes:
    - `toolRegistry.js`

- `Executor/`
  - Central execution layer that runs selected tools.
  - Includes:
    - `toolExecutor.js`

- `Resources/`
  - Shared supporting resources used by the LLM layer.

The Deployed URL : https://aspa-pradeepsahu.up.railway.app

### Future Enhancements

- A more powerful LLM for the Admin with more tools so that admins can use the LLMs for more information and insights about the tickets and the authors. It will also provide a single source of information leading to better decision making and faster resolution of tickets.

### Questions:-

1. Why i use the Knowledge Base in the Prompts and not build a RAG System?

- The amount of data in the Knowledge Base is very small 2.5 pages of text, so it is not worth building a RAG system for this small amount of data. The LLM can easily handle this small amount of data in the prompt itself.

- Also RAGs are best when the data is frequently updated and the LLM needs to be able to access the latest data. In the knowledge base the data is more from a business side and will mostly will remain more or less the same.

2. What if we want to use dynamic Data in the future?

- I have a resource folder set which i didn't push to the repo, which will contain the way for the LLM to access the resources (dynamic data) in the future. The LLM will be able to access the resources and use them in the prompts. The resources will be updated as and when required.

3. Why don't i use the memory (long term memory) of the LLM? in the Chat Conversation?

- Currently the LLM have user table and books table access, so it knows who is the user and about all this books etc. As per my assumption the chat conversation is usually not very long for the long term memory to be useful. (But can we do it?- Definitely Yes)
