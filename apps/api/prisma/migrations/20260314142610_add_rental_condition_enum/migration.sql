-- CreateEnum
CREATE TYPE "rental_condition" AS ENUM ('NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR');

-- AlterTable: convert condition from text to enum
-- Existing text values are dropped (column was optional/rarely used free-text)
ALTER TABLE "listing_rental_details" DROP COLUMN "condition";
ALTER TABLE "listing_rental_details" ADD COLUMN "condition" "rental_condition";
