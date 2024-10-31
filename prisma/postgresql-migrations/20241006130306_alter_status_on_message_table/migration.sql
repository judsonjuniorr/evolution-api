-- AlterTable
ALTER TABLE "messages"
ALTER COLUMN "status"
SET
    DATA TYPE VARCHAR(30);

UPDATE "messages" SET "status" = 'PENDING';