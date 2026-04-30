ALTER TABLE "foods" ADD COLUMN "calories" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "protein" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "fat" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "carbohydrates" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "fiber" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "sugar" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "sodium" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "nutrients" jsonb;