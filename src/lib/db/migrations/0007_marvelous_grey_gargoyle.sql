CREATE TABLE "goal_stage_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stage_id" uuid NOT NULL,
	"goal_id" uuid NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"order_index" integer NOT NULL,
	"name" text NOT NULL,
	"daily_target" integer DEFAULT 1 NOT NULL,
	"daily_unit" varchar(24) DEFAULT '次' NOT NULL,
	"icon" varchar(32) DEFAULT 'sparkles' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "goal_stage_tasks_stage_order_unique" UNIQUE("stage_id","order_index")
);
--> statement-breakpoint
CREATE TABLE "goal_task_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"stage_id" uuid NOT NULL,
	"goal_id" uuid NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"log_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "goal_task_logs_task_date_unique" UNIQUE("task_id","log_date")
);
--> statement-breakpoint
ALTER TABLE "goal_stage_tasks" ADD CONSTRAINT "goal_stage_tasks_stage_id_goal_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."goal_stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_stage_tasks" ADD CONSTRAINT "goal_stage_tasks_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_stage_tasks" ADD CONSTRAINT "goal_stage_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_task_logs" ADD CONSTRAINT "goal_task_logs_task_id_goal_stage_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."goal_stage_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_task_logs" ADD CONSTRAINT "goal_task_logs_stage_id_goal_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."goal_stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_task_logs" ADD CONSTRAINT "goal_task_logs_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_task_logs" ADD CONSTRAINT "goal_task_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goal_stage_tasks_stage_idx" ON "goal_stage_tasks" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "goal_stage_tasks_user_idx" ON "goal_stage_tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "goal_task_logs_stage_idx" ON "goal_task_logs" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "goal_task_logs_user_idx" ON "goal_task_logs" USING btree ("user_id");