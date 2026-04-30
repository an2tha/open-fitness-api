ALTER TABLE "supplements" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "name" || ' ' || COALESCE("brand", ''))) STORED;--> statement-breakpoint
CREATE INDEX "nutrients_name_trgm_idx" ON "nutrients" USING gist ("name" gist_trgm_ops);--> statement-breakpoint
CREATE INDEX "supplements_search_idx" ON "supplements" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "supplements_name_trgm_idx" ON "supplements" USING gist ("name" gist_trgm_ops);