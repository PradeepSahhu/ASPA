-- AlterTable
ALTER TABLE "admins" ALTER COLUMN "contact_info" DROP NOT NULL;

-- AlterTable
ALTER TABLE "authors" ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL,
ALTER COLUMN "account_number" DROP NOT NULL;
