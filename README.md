## ASPA

This is a monorepo for the ASPA Project, it contains both the Frontend and the Backend of the project. The project is built using React for the frontend and Node.js's Express for the backend.

## Database Setup

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
