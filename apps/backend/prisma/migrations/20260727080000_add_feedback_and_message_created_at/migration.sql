-- AlterTable
-- schema.prisma had drifted ahead of the committed migrations (feedback and
-- createdAt were presumably added via `prisma db push` at some point without
-- ever generating a migration file). Using IF NOT EXISTS so this is safe to
-- apply against environments that already have these columns.
ALTER TABLE "Interview" ADD COLUMN IF NOT EXISTS "feedback" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
