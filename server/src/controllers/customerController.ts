import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { customers } from '../db/schema/invoices.js';
import { eq, inArray, desc, or, ilike } from 'drizzle-orm';
import {
    bodyToStringArray,
    paramToString,
    queryToOptionalString,
    queryToPositiveInt,
} from '../utils/request.js';

export const createCustomer = async (req: Request, res: Response) => {
    try {
        const { name, phone, email, address } = req.body;
        if (!name || !phone) return res.status(400).json({ success: false, msg: 'Name and phone required' });
        const existing = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
        if (existing[0]) return res.status(400).json({ success: false, msg: 'Customer with this phone already exists' });
        const [customer] = await db.insert(customers).values({ name, phone, email, address }).returning();
        res.status(201).json({ success: true, data: customer });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        const { name, phone, email, address } = req.body;
        if (!id) return res.status(400).json({ success: false, msg: 'Customer ID required' });

        const [customer] = await db.update(customers).set({ name, phone, email, address, updatedAt: new Date() }).where(eq(customers.id, id)).returning();
        if (!customer) return res.status(404).json({ success: false, msg: 'Customer not found' });
        res.json({ success: true, data: customer });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getAllCustomers = async (req: Request, res: Response) => {
    try {
        const pageNum = queryToPositiveInt(req.query.page, 1);
        const limitNum = queryToPositiveInt(req.query.limit, 50);
        const search = queryToOptionalString(req.query.search);
        const all = search
            ? await db
                .select()
                .from(customers)
                .where(
                    or(
                        ilike(customers.name, `%${search}%`),
                        ilike(customers.phone, `%${search}%`),
                        ilike(customers.email, `%${search}%`)
                    )
                )
                .orderBy(desc(customers.createdAt))
            : await db.select().from(customers).orderBy(desc(customers.createdAt));
        const paginated = all.slice((pageNum - 1) * limitNum, pageNum * limitNum);
        res.json({ success: true, data: paginated, pagination: { page: pageNum, limit: limitNum, total: all.length, totalPages: Math.ceil(all.length / limitNum) } });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getCustomerById = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Customer ID required' });

        const [customer] = await db.select().from(customers).where(eq(customers.id, id));
        if (!customer) return res.status(404).json({ success: false, msg: 'Customer not found' });
        res.json({ success: true, data: customer });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Customer ID required' });

        const result = await db.delete(customers).where(eq(customers.id, id));
        if (!result.rowCount) return res.status(404).json({ success: false, msg: 'Customer not found' });
        res.json({ success: true, msg: 'Customer deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const bulkDeleteCustomers = async (req: Request, res: Response) => {
    try {
        const ids = bodyToStringArray(req.body.ids);
        if (ids.length === 0) return res.status(400).json({ success: false, msg: 'IDs required' });
        const result = await db.delete(customers).where(inArray(customers.id, ids));
        res.json({ success: true, msg: `${result.rowCount} customers deleted` });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};
