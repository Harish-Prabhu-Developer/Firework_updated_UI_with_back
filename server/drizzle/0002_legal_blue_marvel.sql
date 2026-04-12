CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"badge" varchar(255),
	"badge_icon" varchar(50),
	"image" text NOT NULL,
	"cta_text" varchar(100) DEFAULT 'Get My Estimate',
	"cta_link" varchar(255) DEFAULT '/products',
	"display_order" integer DEFAULT 0 NOT NULL,
	"status" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uoms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"code" varchar(20) NOT NULL,
	"description" text,
	"status" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uoms_code_unique" UNIQUE("code"),
	CONSTRAINT "uoms_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "uom_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "conversion_qty" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "display_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "show_limit" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "product_content" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_content" text;--> statement-breakpoint
CREATE INDEX "banners_display_order_idx" ON "banners" USING btree ("display_order");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_uom_id_uoms_id_fk" FOREIGN KEY ("uom_id") REFERENCES "public"."uoms"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "tags_display_order_idx" ON "tags" USING btree ("display_order");