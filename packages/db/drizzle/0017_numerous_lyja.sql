DROP INDEX "nutrients_normalized_name_unit_idx";--> statement-breakpoint
DROP INDEX "exercises_name_idx";--> statement-breakpoint
DROP INDEX "exercises_normalized_mapping_original_idx";--> statement-breakpoint
DROP INDEX "equipment_name_idx";--> statement-breakpoint
CREATE INDEX "nutrients_normalized_name_unit_idx" ON "nutrients_normalized" USING btree ("name","unit");--> statement-breakpoint
CREATE INDEX "exercises_name_idx" ON "exercises" USING btree ("name");--> statement-breakpoint
CREATE INDEX "exercises_normalized_mapping_original_idx" ON "exercises_normalized_mapping" USING btree ("originalExerciseId");--> statement-breakpoint
CREATE INDEX "equipment_name_idx" ON "equipment" USING btree ("name");