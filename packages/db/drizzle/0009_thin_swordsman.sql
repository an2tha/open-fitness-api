CREATE TABLE "prohibited_substances" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "prohibited_substances_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(2056) NOT NULL,
	"category" varchar(2056),
	"notes" varchar(2056)
);
--> statement-breakpoint
ALTER TABLE "nutrients_normalized" DROP CONSTRAINT "nutrients_normalized_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "nutrients_normalized_name_unit_idx" ON "nutrients_normalized" USING btree ("name","unit");