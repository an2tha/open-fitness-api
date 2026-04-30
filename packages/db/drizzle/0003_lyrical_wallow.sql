CREATE TABLE "equipment" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "equipment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"category" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "exercise_equipment" (
	"exerciseId" integer NOT NULL,
	"equipmentId" integer NOT NULL,
	CONSTRAINT "exercise_equipment_exerciseId_equipmentId_pk" PRIMARY KEY("exerciseId","equipmentId")
);
--> statement-breakpoint
CREATE TABLE "exercise_movement_patterns" (
	"exerciseId" integer NOT NULL,
	"movementPatternId" integer NOT NULL,
	CONSTRAINT "exercise_movement_patterns_exerciseId_movementPatternId_pk" PRIMARY KEY("exerciseId","movementPatternId")
);
--> statement-breakpoint
CREATE TABLE "exercise_muscles" (
	"exerciseId" integer NOT NULL,
	"muscleId" integer NOT NULL,
	"role" varchar(50) NOT NULL,
	CONSTRAINT "exercise_muscles_exerciseId_muscleId_role_pk" PRIMARY KEY("exerciseId","muscleId","role")
);
--> statement-breakpoint
CREATE TABLE "exercise_relations" (
	"fromExerciseId" integer NOT NULL,
	"toExerciseId" integer NOT NULL,
	"relationType" varchar(100) NOT NULL,
	CONSTRAINT "exercise_relations_fromExerciseId_toExerciseId_relationType_pk" PRIMARY KEY("fromExerciseId","toExerciseId","relationType")
);
--> statement-breakpoint
CREATE TABLE "food_nutrients" (
	"foodId" integer NOT NULL,
	"nutrientId" integer NOT NULL,
	"value" varchar(50) NOT NULL,
	CONSTRAINT "food_nutrients_foodId_nutrientId_pk" PRIMARY KEY("foodId","nutrientId")
);
--> statement-breakpoint
CREATE TABLE "movement_patterns" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "movement_patterns_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "muscles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "muscles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"group" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "nutrients" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "nutrients_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"unit" varchar(50) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "servingSize" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "calories" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "calories" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "protein" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "protein" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "fat" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "fat" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "carbohydrates" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "carbohydrates" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "fiber" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "fiber" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "sugar" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "sugar" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "sodium" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "sodium" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "exercises" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "exercises" DROP COLUMN "equipment";--> statement-breakpoint
ALTER TABLE "exercises" DROP COLUMN "difficulty";--> statement-breakpoint
ALTER TABLE "exercises" DROP COLUMN "primary_muscles";--> statement-breakpoint
ALTER TABLE "exercises" DROP COLUMN "secondary_muscles";--> statement-breakpoint
ALTER TABLE "exercises" DROP COLUMN "instructions";--> statement-breakpoint
ALTER TABLE "exercises" DROP COLUMN "images";--> statement-breakpoint
ALTER TABLE "foods" DROP COLUMN "nutrients";