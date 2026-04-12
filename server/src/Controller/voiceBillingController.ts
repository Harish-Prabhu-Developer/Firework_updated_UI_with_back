import { Request, Response } from 'express';
import { extractProductsFromVoice, extractProductsFromAudio } from '../utils/geminiVoice.js';
import fs from 'fs';
import { db } from '../db/index.js';
import { products, productStocks } from '../db/schema/index.js';
import { ilike, eq, and } from 'drizzle-orm';

export const processVoiceBilling = async (req: Request, res: Response) => {
    try {
        const { transcript } = req.body;

        if (!transcript) {
            return res.status(400).json({ success: false, msg: 'Transcript is required' });
        }

        console.log('\n🎙️ VOICE COMMAND RECEIVED:', transcript);

        // 1. Get structured JSON from Gemini
        let geminiResult;
        try {
            const raw = await extractProductsFromVoice(transcript);
            console.log("gemini return : ", raw);
            geminiResult = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (err: any) {
            const status = err?.status ?? err?.response?.status;
            if (status === 429) {
                console.warn('[Voice Billing] Gemini rate limit hit after retries.');
                return res.status(429).json({
                    success: false,
                    msg: '⚠️ AI quota exceeded. Please wait a minute and try again.',
                });
            }
            return res.status(500).json({ success: false, msg: 'Error generating AI JSON', error: err.message });
        }

        const items = geminiResult?.items || [];
        console.log('\n🟢 Items Detected by Gemini:', items);

        // 2. Validate against database and fetch stock
        const responseItems = [];

        console.log('\n🔍 Database Check');
        for (const item of items || []) {
            const { product_name, quantity, action } = item;
            
            if (!product_name) continue;

            const requestedQuantity = Number(quantity) || 1;
            const itemAction = action || 'ADD';

            // Simple ILIKE match
            const dbProducts = await db
                .select({
                    id: products.id,
                    name: products.name,
                    image: products.image,
                    sellingPrice: products.sellingPrice,
                    stock: productStocks.quantity,
                })
                .from(products)
                .leftJoin(productStocks, eq(products.id, productStocks.productId))
                .where(
                    and(
                        ilike(products.name, `%${product_name}%`),
                        eq(products.isActive, true)
                    )
                )
                .limit(1);

            if (dbProducts.length === 0) {
                console.log(`\n❌ ${product_name} -> Not found in database`);
                responseItems.push({
                    product: product_name,
                    requested: requestedQuantity,
                    action: itemAction,
                    stock: 0,
                    status: 'NOT_FOUND',
                });
                continue;
            }

            const dbProduct = dbProducts[0];
            const stock = dbProduct.stock || 0;
            let status = 'IN_STOCK';
            
            if (stock === 0) {
                status = 'OUT_OF_STOCK';
            } else if (stock < requestedQuantity) {
                status = 'LOW_STOCK';
            }

            console.log(`\n📦 ${dbProduct.name} (Matched: ${product_name}) | Action: ${itemAction}`);
            console.log(`Requested: ${requestedQuantity} | Stock: ${stock} | Status: ${status === 'IN_STOCK' ? '✅' : '⚠️'} ${status}`);

            responseItems.push({
                product: dbProduct.name,
                productId: dbProduct.id,
                image: dbProduct.image,
                unitPrice: dbProduct.sellingPrice, // include unit price for billing mapping
                requested: requestedQuantity,
                action: itemAction,
                stock: stock,
                status: status,
            });
        }

        return res.status(200).json({
            success: true,
            items: responseItems,
        });

    } catch (error: any) {
        console.error('Error processing voice billing:', error);
        return res.status(500).json({ success: false, msg: 'Internal server error', error: error.message });
    }
};

export const processAudioBilling = async (req: Request, res: Response) => {
    try {
        const audioFiles = req.files as Express.Multer.File[];

        if (!audioFiles || audioFiles.length === 0) {
            return res.status(400).json({ success: false, msg: 'No audio files received' });
        }

        console.log('\n🎙️ AUDIO BILLING RECEIVED:', audioFiles.length, 'files');

        // 1. Get structured JSON from Gemini using audio
        let geminiResult;
        try {
            geminiResult = await extractProductsFromAudio(audioFiles);
        } catch (err: any) {
            console.error('[Audio Billing] AI error:', err);
            return res.status(500).json({ success: false, msg: 'AI processing failed', error: err.message });
        } finally {
            // Cleanup: Delete temporary files
            audioFiles.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Error deleting temp audio file:', err);
                });
            });
        }

        const items = geminiResult?.items || [];
        const responseItems = [];

        // 2. Validate against database
        for (const item of items) {
            const { product_name, quantity, action } = item;
            if (!product_name) continue;

            const requestedQuantity = Number(quantity) || 1;
            const itemAction = action || 'ADD';

            const dbProducts = await db
                .select({
                    id: products.id,
                    name: products.name,
                    image: products.image,
                    sellingPrice: products.sellingPrice,
                    stock: productStocks.quantity,
                })
                .from(products)
                .leftJoin(productStocks, eq(products.id, productStocks.productId))
                .where(
                    and(
                        ilike(products.name, `%${product_name}%`),
                        eq(products.isActive, true)
                    )
                )
                .limit(1);

            if (dbProducts.length === 0) {
                responseItems.push({
                    product: product_name,
                    requested: requestedQuantity,
                    action: itemAction,
                    status: 'NOT_FOUND',
                });
                continue;
            }

            const dbProduct = dbProducts[0];
            const stock = dbProduct.stock || 0;
            let status = 'IN_STOCK';
            
            if (stock === 0) {
                status = 'OUT_OF_STOCK';
            } else if (stock < requestedQuantity) {
                status = 'LOW_STOCK';
            }

            responseItems.push({
                product: dbProduct.name,
                productId: dbProduct.id,
                image: dbProduct.image,
                unitPrice: dbProduct.sellingPrice,
                requested: requestedQuantity,
                action: itemAction,
                stock: stock,
                status: status,
            });
        }

        return res.status(200).json({
            success: true,
            items: responseItems,
        });

    } catch (error: any) {
        console.error('Error in processAudioBilling:', error);
        return res.status(500).json({ success: false, msg: 'Internal server error' });
    }
};
