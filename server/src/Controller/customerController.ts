import { Request, Response } from "express";
import { db } from "../db/index.js";
import { customers } from "../db/schema/invoices.js";
import { eq, desc, sql, like, and, or } from "drizzle-orm";

export const getAllCustomers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const offset = (page - 1) * limit;

        // Build where clauses
        const whereClauses: any[] = [];
        if (search) {
            whereClauses.push(
                or(
                    like(customers.name, `%${search}%`),
                    like(customers.phone, `%${search}%`),
                    like(customers.email, `%${search}%`)
                )
            );
        }

        const finalWhere = whereClauses.length > 0 ? and(...whereClauses) : undefined;

        // Get total count
        const countQuerySnapshot = await db.select({ count: sql<number>`count(*)` })
            .from(customers)
            .where(finalWhere);
        const total = countQuerySnapshot[0].count;

        const allCustomers = await db.query.customers.findMany({
            where: finalWhere,
            limit,
            offset,
            orderBy: [desc(customers.createdAt)],
        });

        res.json({
            success: true,
            data: allCustomers,
            pagination: {
                total: Number(total),
                page,
                limit,
                totalPages: Math.ceil(Number(total) / limit)
            }
        });
    } catch (error: any) {
        console.error("Get All Customers Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCustomerById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const customer = await db.query.customers.findFirst({
            where: eq(customers.id, String(id)),
        });
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }
        res.json({ success: true, data: customer });
    } catch (error: any) {
        console.error("Get Customer By ID Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createCustomer = async (req: Request, res: Response) => {
    try {
        const { name, phone, email, address } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ success: false, message: "Name and phone are required" });
        }
        const [newCustomer] = await db.insert(customers).values({
            name,
            phone,
            email,
            address,
        }).returning();
        res.status(201).json({ success: true, data: newCustomer });
    } catch (error: any) {
        console.error("Create Customer Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { name, phone, email, address } = req.body;
        const updated = await db.update(customers)
            .set({ name, phone, email, address, updatedAt: new Date() })
            .where(eq(customers.id, String(id)))
            .returning();
        if (updated.length === 0) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }
        res.json({ success: true, data: updated[0] });
    } catch (error: any) {
        console.error("Update Customer Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const deleted = await db.delete(customers)
            .where(eq(customers.id, String(id)))
            .returning();
        if (deleted.length === 0) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }
        res.json({ success: true, message: "Customer deleted successfully" });
    } catch (error: any) {
        console.error("Delete Customer Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
