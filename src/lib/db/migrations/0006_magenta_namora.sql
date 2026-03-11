ALTER TABLE "feeds" ALTER COLUMN "last_fetched_at" SET DATA TYPE timestamp USING last_fetched_at::timestamp;--> statement-breakpoint
ALTER TABLE "feeds" ALTER COLUMN "last_fetched_at" DROP NOT NULL;