CREATE TABLE "emission_factors" (
	"id" text PRIMARY KEY NOT NULL,
	"fuel_type_id" text NOT NULL,
	"factor_kgco2_per_unit" real NOT NULL,
	"unit" text NOT NULL,
	"effective_from" timestamp NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emission_record_history" (
	"id" text PRIMARY KEY NOT NULL,
	"emission_record_id" text NOT NULL,
	"action" text NOT NULL,
	"previous_status" text,
	"new_status" text NOT NULL,
	"changed_by" text,
	"metadata" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emission_records" (
	"id" text PRIMARY KEY NOT NULL,
	"fuel_type_id" text NOT NULL,
	"quantity" real NOT NULL,
	"unit" text NOT NULL,
	"factor_snapshot" real NOT NULL,
	"tco2_calculated" real NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"recorded_date" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fuel_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "fuel_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "emission_factors" ADD CONSTRAINT "emission_factors_fuel_type_id_fuel_types_id_fk" FOREIGN KEY ("fuel_type_id") REFERENCES "public"."fuel_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emission_record_history" ADD CONSTRAINT "emission_record_history_emission_record_id_emission_records_id_fk" FOREIGN KEY ("emission_record_id") REFERENCES "public"."emission_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emission_records" ADD CONSTRAINT "emission_records_fuel_type_id_fuel_types_id_fk" FOREIGN KEY ("fuel_type_id") REFERENCES "public"."fuel_types"("id") ON DELETE no action ON UPDATE no action;