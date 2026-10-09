ALTER TABLE "upload_queue" ADD COLUMN "ig_container_id" text;--> statement-breakpoint
ALTER TABLE "upload_queue" ADD COLUMN "ig_media_id" text;--> statement-breakpoint
ALTER TABLE "upload_queue" ADD COLUMN "attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "upload_queue" ADD COLUMN "last_error" text;