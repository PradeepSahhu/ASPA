-- AlterTable
ALTER TABLE "books" ALTER COLUMN "isbn" DROP NOT NULL,
ALTER COLUMN "author_royalty_per_copy" DROP NOT NULL,
ALTER COLUMN "total_copies_sold" DROP NOT NULL,
ALTER COLUMN "total_royalty_earned" DROP NOT NULL,
ALTER COLUMN "royalty_paid" DROP NOT NULL,
ALTER COLUMN "royalty_pending" DROP NOT NULL;
