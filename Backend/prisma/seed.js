import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import prisma from "../src/utility/database/index.js";

const sampleDataPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "bookleaf-sample-data.json",
);

const STATUS_MAP = {
  "Published & Live": "PUBLISHED",
  "In Production - Cover Design": "COVER_DESIGN",
  "In Production - Typesetting": "TYPESETTING",
  "Manuscript Received": "MANUSCRIPT_RECEIVED",
  Editing: "EDITING",
  Proofreading: "PROOFREADING",
  "ISBN Assignment": "ISBN_ASSIGNMENT",
  Printing: "PRINTING",
  "Distribution Setup": "DISTRIBUTION_SETUP",
  "On Hold": "ON_HOLD",
  Cancelled: "CANCELLED",
  Archived: "ARCHIVED",
};

const DEFAULT_AUTHOR_PASSWORD = "author123";

function parseDate(value) {
  return value ? new Date(value) : null;
}

function normalizeBookStatus(status) {
  return STATUS_MAP[status] || "DRAFT";
}

async function main() {
  const rawData = await readFile(sampleDataPath, "utf8");
  const { authors } = JSON.parse(rawData);

  await prisma.admin.upsert({
    where: { email: "admin@bookleaf.com" },
    update: {
      name: "Seed Admin",
      password: "admin123",
      contactInfo: "+91-9999999999",
    },
    create: {
      id: "seed-admin-1",
      name: "Seed Admin",
      email: "admin@bookleaf.com",
      password: "admin123",
      contactInfo: "+91-9999999999",
      joinedDate: new Date(),
    },
  });

  for (const author of authors) {
    await prisma.author.upsert({
      where: { email: author.email },
      update: {
        id: author.author_id,
        name: author.name,
        password: DEFAULT_AUTHOR_PASSWORD,
        phone: author.phone,
        city: author.city,
        joinedDate: parseDate(author.joined_date) || new Date(),
      },
      create: {
        id: author.author_id,
        name: author.name,
        email: author.email,
        password: DEFAULT_AUTHOR_PASSWORD,
        phone: author.phone,
        city: author.city,
        joinedDate: parseDate(author.joined_date) || new Date(),
      },
    });

    for (const book of author.books) {
      await prisma.book.upsert({
        where: { id: book.book_id },
        update: {
          authorId: author.author_id,
          title: book.title,
          isbn: book.isbn,
          status: normalizeBookStatus(book.status),
          genre: book.genre,
          publicationDate: parseDate(book.publication_date),
          mrp: book.mrp ?? 0,
          authorRoyaltyPerCopy: book.author_royalty_per_copy,
          totalCopiesSold: book.total_copies_sold ?? 0,
          totalRoyaltyEarned: book.total_royalty_earned ?? 0,
          royaltyPaid: book.royalty_paid ?? 0,
          royaltyPending: book.royalty_pending ?? 0,
          lastRoyaltyPayoutDate: parseDate(book.last_royalty_payout_date),
          printPartner: book.print_partner,
          availableOn: book.available_on || [],
        },
        create: {
          id: book.book_id,
          authorId: author.author_id,
          title: book.title,
          isbn: book.isbn,
          status: normalizeBookStatus(book.status),
          genre: book.genre,
          publicationDate: parseDate(book.publication_date),
          mrp: book.mrp ?? 0,
          authorRoyaltyPerCopy: book.author_royalty_per_copy,
          totalCopiesSold: book.total_copies_sold ?? 0,
          totalRoyaltyEarned: book.total_royalty_earned ?? 0,
          royaltyPaid: book.royalty_paid ?? 0,
          royaltyPending: book.royalty_pending ?? 0,
          lastRoyaltyPayoutDate: parseDate(book.last_royalty_payout_date),
          printPartner: book.print_partner,
          availableOn: book.available_on || [],
        },
      });
    }
  }

  console.log("Seed complete");
  console.log("Admin login: admin@bookleaf.com / admin123");
  console.log(`Seeded ${authors.length} authors and their books`);
  console.log("All seeded authors use password: author123");
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
