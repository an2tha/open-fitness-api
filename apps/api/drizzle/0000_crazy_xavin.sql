CREATE TABLE "foods" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "foods_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"externalId" varchar(2056),
	"dataSource" varchar(2056) NOT NULL,
	"name" varchar(2056) NOT NULL,
	"brand" varchar(2056),
	"category" varchar(2056),
	"servingSize" varchar(2056),
	"servingUnit" varchar(2056),
	"updatedAt" timestamp DEFAULT now(),
	"calories" varchar(2056) DEFAULT '0',
	"protein" varchar(2056) DEFAULT '0',
	"fat" varchar(2056) DEFAULT '0',
	"carbohydrates" varchar(2056) DEFAULT '0',
	"fiber" varchar(2056) DEFAULT '0',
	"sugar" varchar(2056) DEFAULT '0',
	"sodium" varchar(2056) DEFAULT '0',
	"search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "name" || ' ' || COALESCE("brand", ''))) STORED
);
--> statement-breakpoint
CREATE TABLE "food_nutrients" (
	"foodId" integer NOT NULL,
	"nutrientId" integer NOT NULL,
	"value" varchar(2056) NOT NULL,
	CONSTRAINT "food_nutrients_foodId_nutrientId_pk" PRIMARY KEY("foodId","nutrientId")
);
--> statement-breakpoint
CREATE TABLE "nutrients" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "nutrients_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(2056) NOT NULL,
	"unit" varchar(2056) NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "name")) STORED
);
--> statement-breakpoint
CREATE TABLE "food_nutrients_normalized" (
	"foodId" integer NOT NULL,
	"nutrientId" integer NOT NULL,
	"value" varchar(2056) NOT NULL,
	CONSTRAINT "food_nutrients_normalized_foodId_nutrientId_pk" PRIMARY KEY("foodId","nutrientId")
);
--> statement-breakpoint
CREATE TABLE "nutrients_normalized" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "nutrients_normalized_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(2056) NOT NULL,
	"unit" varchar(2056) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrients_normalized_mapping" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "nutrients_normalized_mapping_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"originalNutrientId" integer NOT NULL,
	"normalizedNutrientId" integer NOT NULL,
	"originalName" varchar(2056) NOT NULL,
	"normalizedName" varchar(2056) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_relations" (
	"fromExerciseId" integer NOT NULL,
	"toExerciseId" integer NOT NULL,
	"relationType" varchar(2056) NOT NULL,
	CONSTRAINT "exercise_relations_fromExerciseId_toExerciseId_relationType_pk" PRIMARY KEY("fromExerciseId","toExerciseId","relationType")
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "exercises_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(2056) NOT NULL,
	"description" varchar(2056),
	"updatedAt" timestamp DEFAULT now(),
	"search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "name" || ' ' || COALESCE("description", ''))) STORED
);
--> statement-breakpoint
CREATE TABLE "exercise_relations_normalized" (
	"fromExerciseId" integer NOT NULL,
	"toExerciseId" integer NOT NULL,
	"relationType" varchar(2056) NOT NULL,
	CONSTRAINT "exercise_relations_normalized_fromExerciseId_toExerciseId_relationType_pk" PRIMARY KEY("fromExerciseId","toExerciseId","relationType")
);
--> statement-breakpoint
CREATE TABLE "exercises_normalized" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "exercises_normalized_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(2056) NOT NULL,
	"description" varchar(2056),
	CONSTRAINT "exercises_normalized_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "exercises_normalized_mapping" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "exercises_normalized_mapping_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"originalExerciseId" integer NOT NULL,
	"normalizedExerciseId" integer NOT NULL,
	"originalName" varchar(2056) NOT NULL,
	"normalizedName" varchar(2056) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_muscles" (
	"exerciseId" integer NOT NULL,
	"muscleId" integer NOT NULL,
	"role" varchar(2056) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "muscles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "muscles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(2056) NOT NULL,
	"group" varchar(2056)
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "equipment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(2056) NOT NULL,
	"category" varchar(2056)
);
--> statement-breakpoint
CREATE TABLE "exercise_equipment" (
	"exerciseId" integer NOT NULL,
	"equipmentId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_movement_patterns" (
	"exerciseId" integer NOT NULL,
	"movementPatternId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movement_patterns" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "movement_patterns_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(2056) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ingredients_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(2056) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prohibited_substances" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "prohibited_substances_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(2056) NOT NULL,
	"category" varchar(2056),
	"notes" varchar(2056)
);
--> statement-breakpoint
CREATE TABLE "supplement_ingredients" (
	"supplementId" integer NOT NULL,
	"ingredientId" integer NOT NULL,
	"amount" varchar(2056),
	CONSTRAINT "supplement_ingredients_supplementId_ingredientId_pk" PRIMARY KEY("supplementId","ingredientId")
);
--> statement-breakpoint
CREATE TABLE "supplements" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "supplements_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"externalId" varchar(2056),
	"dataSource" varchar(2056) NOT NULL,
	"name" varchar(2056) NOT NULL,
	"brand" varchar(2056),
	"category" varchar(2056),
	"servingSize" varchar(2056),
	"servingUnit" varchar(2056),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
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
CREATE UNIQUE INDEX "nutrients_name_unit_idx" ON "nutrients" USING btree ("name","unit");--> statement-breakpoint
CREATE INDEX "nutrients_search_idx" ON "nutrients" USING gin ("search_vector");--> statement-breakpoint
CREATE UNIQUE INDEX "nutrients_normalized_name_unit_idx" ON "nutrients_normalized" USING btree ("name","unit");--> statement-breakpoint
CREATE UNIQUE INDEX "nutrients_normalized_mapping_original_idx" ON "nutrients_normalized_mapping" USING btree ("originalNutrientId");--> statement-breakpoint
CREATE UNIQUE INDEX "exercises_name_idx" ON "exercises" USING btree ("name");--> statement-breakpoint
CREATE INDEX "exercises_search_idx" ON "exercises" USING gin ("search_vector");--> statement-breakpoint
CREATE UNIQUE INDEX "exercises_normalized_mapping_original_idx" ON "exercises_normalized_mapping" USING btree ("originalExerciseId");--> statement-breakpoint
CREATE INDEX "exercise_muscles_pk" ON "exercise_muscles" USING btree ("exerciseId","muscleId","role");--> statement-breakpoint
CREATE UNIQUE INDEX "muscles_name_idx" ON "muscles" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "equipment_name_idx" ON "equipment" USING btree ("name");--> statement-breakpoint
CREATE INDEX "exercise_equipment_pk" ON "exercise_equipment" USING btree ("exerciseId","equipmentId");--> statement-breakpoint
CREATE INDEX "exercise_movement_patterns_pk" ON "exercise_movement_patterns" USING btree ("exerciseId","movementPatternId");--> statement-breakpoint
CREATE UNIQUE INDEX "movement_patterns_name_idx" ON "movement_patterns" USING btree ("name");