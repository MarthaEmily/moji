CREATE TABLE "goal_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"measured_on" date NOT NULL,
	"value" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "goal_measurements_goal_date_unique" UNIQUE("goal_id","measured_on")
);
--> statement-breakpoint
CREATE TABLE "goal_stage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stage_id" uuid NOT NULL,
	"goal_id" uuid NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"log_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "goal_stage_logs_stage_date_unique" UNIQUE("stage_id","log_date")
);
--> statement-breakpoint
CREATE TABLE "goal_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"order_index" integer NOT NULL,
	"name" text NOT NULL,
	"focus" text DEFAULT '' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"daily_target" integer DEFAULT 1 NOT NULL,
	"daily_unit" varchar(24) DEFAULT '次' NOT NULL,
	"milestone_value" numeric,
	"icon" varchar(32) DEFAULT 'sparkles' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "goal_stages_goal_order_unique" UNIQUE("goal_id","order_index")
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"title" text NOT NULL,
	"kind" varchar(16) DEFAULT 'other' NOT NULL,
	"start_value" numeric,
	"target_value" numeric,
	"value_unit" varchar(24),
	"direction" varchar(8) DEFAULT 'up' NOT NULL,
	"start_date" date NOT NULL,
	"deadline" date NOT NULL,
	"status" varchar(12) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goal_measurements" ADD CONSTRAINT "goal_measurements_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_measurements" ADD CONSTRAINT "goal_measurements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_stage_logs" ADD CONSTRAINT "goal_stage_logs_stage_id_goal_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."goal_stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_stage_logs" ADD CONSTRAINT "goal_stage_logs_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_stage_logs" ADD CONSTRAINT "goal_stage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_stages" ADD CONSTRAINT "goal_stages_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_stages" ADD CONSTRAINT "goal_stages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goal_measurements_goal_idx" ON "goal_measurements" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "goal_measurements_user_idx" ON "goal_measurements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "goal_stage_logs_goal_idx" ON "goal_stage_logs" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "goal_stage_logs_user_idx" ON "goal_stage_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "goal_stages_goal_idx" ON "goal_stages" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "goal_stages_user_idx" ON "goal_stages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "goals_user_idx" ON "goals" USING btree ("user_id");