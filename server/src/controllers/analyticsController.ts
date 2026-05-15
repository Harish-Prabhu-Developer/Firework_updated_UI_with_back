import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { invoices } from '../db/schema/invoices.js';
import { sql } from 'drizzle-orm';

export const getDashboardAnalytics = async (req: Request, res: Response) => {
    try {
        // 1. Monthly Revenue (Line Chart Data) - Last 6 months
        const monthlyRevenue = await db.select({
            label: sql<string>`TO_CHAR(${invoices.createdAt}, 'Mon')`,
            value: sql<number>`SUM(${invoices.totalAmount})`
        })
        .from(invoices)
        .where(sql`${invoices.createdAt} >= NOW() - INTERVAL '6 months'`)
        .groupBy(sql`TO_CHAR(${invoices.createdAt}, 'Mon'), DATE_TRUNC('month', ${invoices.createdAt})`)
        .orderBy(sql`DATE_TRUNC('month', ${invoices.createdAt})`);

        // 2. Payment Method Distribution (Pie Chart Data)
        const paymentDistribution = await db.select({
            name: invoices.paymentMethod,
            population: sql<number>`COUNT(*)`
        })
        .from(invoices)
        .groupBy(invoices.paymentMethod);

        // Map population to number for chart compatibility
        const formattedPaymentData = paymentDistribution.map(item => ({
            name: item.name.toUpperCase(),
            population: Number(item.population),
            color: item.name === 'cash' ? '#10b981' : item.name === 'upi' ? '#3b82f6' : '#f59e0b',
            legendFontColor: '#7F7F7F',
            legendFontSize: 12
        }));

        res.json({
            success: true,
            data: {
                monthlyRevenue: {
                    labels: monthlyRevenue.map(m => m.label),
                    data: monthlyRevenue.map(m => Number(m.value))
                },
                paymentDistribution: formattedPaymentData
            }
        });
    } catch (error: any) {
        console.error('Analytics Error:', error);
        res.status(500).json({ success: false, msg: error.message });
    }
};
