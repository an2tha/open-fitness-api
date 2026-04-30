CREATE TABLE "foods" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "foods_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"externalId" varchar(255),
	"dataSource" varchar(100) NOT NULL,
	"name" varchar(512) NOT NULL,
	"brand" varchar(255),
	"category" varchar(255),
	"servingSize" numeric(10, 2),
	"servingUnit" varchar(50),
	"updatedAt" timestamp DEFAULT now()
);
