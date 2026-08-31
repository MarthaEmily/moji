CREATE TABLE "workout_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"day" date NOT NULL,
	"base_minutes" integer NOT NULL,
	"shifted_minutes" integer NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workout_days_user_day_unique" UNIQUE("user_id","day")
);
--> statement-breakpoint
ALTER TABLE "workout_days" ADD CONSTRAINT "workout_days_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workout_days_user_idx" ON "workout_days" USING btree ("user_id");