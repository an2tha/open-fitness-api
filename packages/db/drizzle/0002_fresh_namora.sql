CREATE TABLE "exercises" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "exercises_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"description" varchar(2048),
	"category" varchar(100),
	"equipment" varchar(255),
	"difficulty" varchar(50),
	"primary_muscles" jsonb,
	"secondary_muscles" jsonb,
	"instructions" jsonb,
	"images" jsonb,
	"updatedAt" timestamp DEFAULT now()
);
