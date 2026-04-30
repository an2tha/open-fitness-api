CREATE TABLE "food_nutrients_normalized" (
	"foodId" integer NOT NULL,
	"nutrientId" integer NOT NULL,
	"value" varchar(2056) NOT NULL,
	CONSTRAINT "food_nutrients_normalized_foodId_nutrientId_pk" PRIMARY KEY("foodId","nutrientId")
);
