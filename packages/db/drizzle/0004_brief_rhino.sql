CREATE TABLE "nutrients_normalized" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "nutrients_normalized_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(2056) NOT NULL,
	"unit" varchar(2056) NOT NULL,
	CONSTRAINT "nutrients_normalized_name_unique" UNIQUE("name")
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
CREATE TABLE "ingredients" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ingredients_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(2056) NOT NULL
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
ALTER TABLE "equipment" ALTER COLUMN "name" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "category" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "exercise_muscles" ALTER COLUMN "role" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "exercise_relations" ALTER COLUMN "relationType" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "exercises" ALTER COLUMN "name" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "exercises" ALTER COLUMN "description" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "food_nutrients" ALTER COLUMN "value" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "externalId" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "dataSource" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "name" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "brand" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "category" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "servingSize" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "servingUnit" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "calories" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "calories" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "protein" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "protein" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "fat" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "fat" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "carbohydrates" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "carbohydrates" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "fiber" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "fiber" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "sugar" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "sugar" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "sodium" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "sodium" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "movement_patterns" ALTER COLUMN "name" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "muscles" ALTER COLUMN "name" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "muscles" ALTER COLUMN "group" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "nutrients" ALTER COLUMN "name" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "nutrients" ALTER COLUMN "unit" SET DATA TYPE varchar(2056);--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "description" varchar(2056);--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "isMachine" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "updatedAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "exercise_equipment" ADD COLUMN "notes" varchar(2056);--> statement-breakpoint
CREATE UNIQUE INDEX "nutrients_normalized_mapping_original_idx" ON "nutrients_normalized_mapping" USING btree ("originalNutrientId");