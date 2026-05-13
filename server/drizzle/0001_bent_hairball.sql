ALTER TABLE "settings" ALTER COLUMN "shop_gst" SET DEFAULT 'xxxxxxxxxxx';--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "shop_email" varchar(255) DEFAULT 'crackerskingdom26@gmail.com';--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "minimum_order" integer DEFAULT 3000 NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "whatsapp_num" varchar(20) DEFAULT '919944336113' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "social_medias" jsonb DEFAULT '{"instagram":"https://www.instagram.com/","facebook":"https://www.facebook.com/"}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "sales_status" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "order_receipt_qr_status" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "invoice_qr_status" boolean DEFAULT true NOT NULL;