DROP INDEX "nutrients_normalized_mapping_original_idx";--> statement-breakpoint
DROP INDEX "muscles_name_idx";--> statement-breakpoint
CREATE INDEX "nutrients_normalized_mapping_original_idx" ON "nutrients_normalized_mapping" USING btree ("originalNutrientId");--> statement-breakpoint
CREATE INDEX "muscles_name_idx" ON "muscles" USING btree ("name");