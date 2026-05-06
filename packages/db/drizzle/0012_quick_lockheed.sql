CREATE TABLE "api_keys" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "api_keys_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"key_prefix" varchar(16) NOT NULL,
	"key_hash" varchar(128) NOT NULL,
	"name" varchar(256) NOT NULL,
	"owner" varchar(256) NOT NULL,
	"scopes" jsonb DEFAULT 'null'::jsonb,
	"rate_limit_max" integer,
	"rate_limit_window_secs" integer,
	"request_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"revoked" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
ALTER TABLE "supplements" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "name" || ' ' || COALESCE("brand", ''))) STORED;--> statement-breakpoint
CREATE INDEX "api_keys_hash_idx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "api_keys_prefix_idx" ON "api_keys" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "api_keys_owner_idx" ON "api_keys" USING btree ("owner");--> statement-breakpoint
CREATE INDEX "foods_name_trgm_idx" ON "foods" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "nutrients_name_trgm_idx" ON "nutrients" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "exercises_name_trgm_idx" ON "exercises" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "supplements_search_idx" ON "supplements" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "supplements_name_trgm_idx" ON "supplements" USING gin ("name" gin_trgm_ops);