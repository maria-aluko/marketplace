-- CreateEnum
CREATE TYPE "listing_type" AS ENUM ('SERVICE', 'RENTAL');

-- CreateEnum
CREATE TYPE "rental_category" AS ENUM ('TENT', 'CHAIRS_TABLES', 'COOKING_EQUIPMENT', 'GENERATOR', 'LIGHTING', 'OTHER_RENTAL');

-- CreateEnum
CREATE TYPE "delivery_option" AS ENUM ('PICKUP_ONLY', 'DELIVERY_ONLY', 'BOTH');

-- CreateEnum
CREATE TYPE "subscription_tier" AS ENUM ('FREE', 'PRO', 'PRO_PLUS');

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "subscription_tier" "subscription_tier" NOT NULL DEFAULT 'FREE';

-- CreateTable
CREATE TABLE "listings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendor_id" UUID NOT NULL,
    "listing_type" "listing_type" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "vendor_category",
    "price_from" INTEGER,
    "price_to" INTEGER,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_rental_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" UUID NOT NULL,
    "rental_category" "rental_category" NOT NULL,
    "quantity_available" INTEGER NOT NULL,
    "price_per_day" INTEGER NOT NULL,
    "deposit_amount" INTEGER,
    "delivery_option" "delivery_option" NOT NULL,
    "condition" TEXT,

    CONSTRAINT "listing_rental_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listings_vendor_id_listing_type_idx" ON "listings"("vendor_id", "listing_type");

-- CreateIndex
CREATE INDEX "listings_listing_type_category_idx" ON "listings"("listing_type", "category");

-- CreateIndex
CREATE UNIQUE INDEX "listing_rental_details_listing_id_key" ON "listing_rental_details"("listing_id");

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_rental_details" ADD CONSTRAINT "listing_rental_details_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
