DROP INDEX "nutrients_name_unit_idx";--> statement-breakpoint
CREATE INDEX "nutrients_name_unit_idx" ON "nutrients" USING btree ("name","unit");