CREATE TABLE "client_social_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"provider" text DEFAULT 'instagram' NOT NULL,
	"ig_user_id" text,
	"page_id" text,
	"ig_username" text,
	"encrypted_token" text,
	"token_iv" text,
	"token_tag" text,
	"token_expires_at" timestamp with time zone,
	"connected_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_social_accounts_client_id_unique" UNIQUE("client_id")
);
