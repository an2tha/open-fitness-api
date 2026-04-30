ALTER TABLE "exercise_muscles" DROP CONSTRAINT "exercise_muscles_exerciseId_muscleId_role_pk";--> statement-breakpoint
ALTER TABLE "exercise_equipment" DROP CONSTRAINT "exercise_equipment_exerciseId_equipmentId_pk";--> statement-breakpoint
ALTER TABLE "exercise_movement_patterns" DROP CONSTRAINT "exercise_movement_patterns_exerciseId_movementPatternId_pk";--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "name" SET DATA TYPE "undefined"."citext";--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "brand" SET DATA TYPE "undefined"."citext";--> statement-breakpoint
ALTER TABLE "nutrients" ALTER COLUMN "name" SET DATA TYPE "undefined"."citext";--> statement-breakpoint
ALTER TABLE "nutrients" ALTER COLUMN "unit" SET DATA TYPE "undefined"."citext";--> statement-breakpoint
ALTER TABLE "exercises" ALTER COLUMN "name" SET DATA TYPE "undefined"."citext";--> statement-breakpoint
ALTER TABLE "muscles" ALTER COLUMN "name" SET DATA TYPE "undefined"."citext";--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "name" SET DATA TYPE "undefined"."citext";--> statement-breakpoint
ALTER TABLE "movement_patterns" ALTER COLUMN "name" SET DATA TYPE "undefined"."citext";--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "name" || ' ' || COALESCE("brand", ''))) STORED;--> statement-breakpoint
ALTER TABLE "nutrients" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "name")) STORED;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "name" || ' ' || COALESCE("description", ''))) STORED;--> statement-breakpoint
ALTER TABLE "food_nutrients" ADD CONSTRAINT "food_nutrients_foodId_foods_id_fk" FOREIGN KEY ("foodId") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_nutrients" ADD CONSTRAINT "food_nutrients_nutrientId_nutrients_id_fk" FOREIGN KEY ("nutrientId") REFERENCES "public"."nutrients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_relations" ADD CONSTRAINT "exercise_relations_fromExerciseId_exercises_id_fk" FOREIGN KEY ("fromExerciseId") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_relations" ADD CONSTRAINT "exercise_relations_toExerciseId_exercises_id_fk" FOREIGN KEY ("toExerciseId") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_muscles" ADD CONSTRAINT "exercise_muscles_exerciseId_exercises_id_fk" FOREIGN KEY ("exerciseId") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_muscles" ADD CONSTRAINT "exercise_muscles_muscleId_muscles_id_fk" FOREIGN KEY ("muscleId") REFERENCES "public"."muscles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_equipment" ADD CONSTRAINT "exercise_equipment_exerciseId_exercises_id_fk" FOREIGN KEY ("exerciseId") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_equipment" ADD CONSTRAINT "exercise_equipment_equipmentId_equipment_id_fk" FOREIGN KEY ("equipmentId") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_movement_patterns" ADD CONSTRAINT "exercise_movement_patterns_exerciseId_exercises_id_fk" FOREIGN KEY ("exerciseId") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_movement_patterns" ADD CONSTRAINT "exercise_movement_patterns_movementPatternId_movement_patterns_id_fk" FOREIGN KEY ("movementPatternId") REFERENCES "public"."movement_patterns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "foods_search_idx" ON "foods" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "nutrients_search_idx" ON "nutrients" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "exercises_search_idx" ON "exercises" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "exercise_muscles_pk" ON "exercise_muscles" USING btree ("exerciseId","muscleId","role");--> statement-breakpoint
CREATE UNIQUE INDEX "muscles_name_idx" ON "muscles" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "equipment_name_idx" ON "equipment" USING btree ("name");--> statement-breakpoint
CREATE INDEX "exercise_equipment_pk" ON "exercise_equipment" USING btree ("exerciseId","equipmentId");--> statement-breakpoint
CREATE INDEX "exercise_movement_patterns_pk" ON "exercise_movement_patterns" USING btree ("exerciseId","movementPatternId");--> statement-breakpoint
CREATE UNIQUE INDEX "movement_patterns_name_idx" ON "movement_patterns" USING btree ("name");--> statement-breakpoint
ALTER TABLE "equipment" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "equipment" DROP COLUMN "isMachine";--> statement-breakpoint
ALTER TABLE "equipment" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "exercise_equipment" DROP COLUMN "notes";