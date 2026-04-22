CREATE TABLE "plants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"monthly_limit_tco2" real NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "plants_name_unique" UNIQUE("name")
);
