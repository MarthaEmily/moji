ALTER TABLE "habits" ADD COLUMN "base_amount" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "last_bump_streak" integer DEFAULT 0 NOT NULL;