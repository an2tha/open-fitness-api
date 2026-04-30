CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "foods_name_trgm_idx" ON "foods" USING gist ("name" gist_trgm_ops);--> statement-breakpoint
CREATE INDEX "exercises_name_trgm_idx" ON "exercises" USING gist ("name" gist_trgm_ops);