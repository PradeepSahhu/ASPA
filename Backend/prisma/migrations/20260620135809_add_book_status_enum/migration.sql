/*
  Warnings:

  - The `status` column on the `books` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('DRAFT', 'MANUSCRIPT_RECEIVED', 'EDITING', 'COVER_DESIGN', 'TYPESETTING', 'PROOFREADING', 'ISBN_ASSIGNMENT', 'PRINTING', 'DISTRIBUTION_SETUP', 'PUBLISHED', 'ON_HOLD', 'CANCELLED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "books" DROP COLUMN "status",
ADD COLUMN     "status" "BookStatus" NOT NULL DEFAULT 'DRAFT';
