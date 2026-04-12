import { Request, Response } from "express";
import { db } from "../db/index.js";
import { invoices, orders, customers, products, categories, productStocks } from "../db/schema/index.js";
import { eq, sql, desc, and, gte } from "drizzle-orm";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = and();
    if (startDate && endDate) {
      dateFilter = and(
        sql`${invoices.createdAt} >= ${new Date(startDate as string)}`,
        sql`${invoices.createdAt} <= ${new Date(endDate as string)}`
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Basic Stats
    const totalSalesPromise = db.select({ 
      value: sql<string>`SUM(CAST(${invoices.totalAmount} AS NUMERIC))` 
    })
    .from(invoices)
    .where(startDate && endDate ? dateFilter : undefined);

    const totalOrdersTodayPromise = db.select({
      count: sql<number>`count(*)`
    }).from(orders).where(gte(orders.createdAt, today));

    const totalProductsPromise = db.select({
      count: sql<number>`count(*)`
    }).from(products);

    const lowStockCountPromise = db.select({
      count: sql<number>`count(*)`
    }).from(productStocks).where(sql`${productStocks.quantity} <= 10`);

    const customerCountPromise = db.select({
      count: sql<number>`count(*)`
    }).from(customers);

    const [salesRow, ordersTodayRow, productsRow, lowStockRow, customersRow] = await Promise.all([
      totalSalesPromise,
      totalOrdersTodayPromise,
      totalProductsPromise,
      lowStockCountPromise,
      customerCountPromise
    ]);

    // 2. Chart Data (Monthly Sales)
    const monthlySales = await db.select({
      month: sql<string>`TO_CHAR(${invoices.createdAt}, 'Mon')`,
      amount: sql<number>`SUM(CAST(${invoices.totalAmount} AS NUMERIC))`
    })
    .from(invoices)
    .where(startDate && endDate ? dateFilter : undefined)
    .groupBy(sql`TO_CHAR(${invoices.createdAt}, 'Mon')`)
    .limit(12);

    // 3. Top Selling Products
    const topProducts = await db.query.products.findMany({
        limit: 5,
        orderBy: [desc(products.createdAt)], 
        with: {
            stock: true
        }
    });

    // 4. Recent Sales
    const recentSales = await db.query.invoices.findMany({
      limit: 5,
      where: startDate && endDate ? dateFilter : undefined,
      orderBy: [desc(invoices.createdAt)],
      with: {
        customer: true
      }
    });

    // 5. Category Distribution
    const categoryStats = await db.select({
      name: categories.name,
      count: sql<number>`count(${products.id})`
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalSales: salesRow[0]?.value || "0",
          ordersToday: ordersTodayRow[0]?.count || 0,
          totalProducts: productsRow[0]?.count || 0,
          lowStockCount: lowStockRow[0]?.count || 0,
          customerCount: customersRow[0]?.count || 0,
        },
        monthlySales,
        topProducts,
        recentSales,
        categoryStats,
      }
    });
  } catch (error: any) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
