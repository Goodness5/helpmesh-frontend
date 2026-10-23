-- AlterTable
ALTER TABLE "User" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "helpedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pronouns" TEXT;
