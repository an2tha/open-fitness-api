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
CREATE UNIQUE INDEX "exercises_normalized_mapping_original_idx" ON "exercises_normalized_mapping" USING btree ("originalExerciseId");