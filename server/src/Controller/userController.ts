// src/controllers/userController.ts
import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { roles, rolePermissions, modules, permissionActions, users } from '../db/schema/users.js';
import { eq, and, desc, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/* =========================
   ROLE CRUD
========================= */

// Get all roles
export const getRoles = async (req: Request, res: Response) => {
    try {
        const allRoles = (await db.select().from(roles));
        res.status(200).json({ success: true, data: allRoles });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

// Add new role
export const addRole = async (req: Request, res: Response) => {
    try {
        const { name, description, isActive } = req.body;
        if (!name) return res.status(400).json({ success: false, msg: "Role name is required" });

        const insertedRole = await db.insert(roles).values({ 
            name, 
            description, 
            isActive: isActive !== undefined ? isActive : true 
        }).returning();
        
        res.status(201).json({ success: true, msg: "Role created successfully", data: insertedRole[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

// Update role
export const updateRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;
        
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedRole = await db.update(roles)
            .set(updateData)
            .where(eq(roles.id, id as string))
            .returning();

        if (updatedRole.length === 0) return res.status(404).json({ success: false, msg: "Role not found" });
        
        res.status(200).json({ success: true, msg: "Role updated successfully", data: updatedRole[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

// Delete role
export const deleteRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedRole = await db.delete(roles).where(eq(roles.id, id as string)).returning();
        
        if (deletedRole.length === 0) return res.status(404).json({ success: false, msg: "Role not found" });
        
        res.status(200).json({ success: true, msg: "Role deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

/* =========================
   ROLE PERMISSIONS CRUD
========================= */

// Get permissions for a specific role - UPDATED to return action names
export const getRolePermissions = async (req: Request, res: Response) => {
    try {
        const { roleId } = req.params;

        // Fetch all permissions for this role with action details
        const permissions = await db
            .select({
                id: rolePermissions.id,
                roleId: rolePermissions.roleId,
                moduleId: rolePermissions.moduleId,
                actionId: rolePermissions.actionId,
                actionName: permissionActions.action, // This gives us 'read', 'write', etc.
                isAllowed: rolePermissions.isAllowed,
                allowAll: rolePermissions.allowAll,
                createdAt: rolePermissions.createdAt,
            })
            .from(rolePermissions)
            .leftJoin(permissionActions, eq(rolePermissions.actionId, permissionActions.id))
            .where(eq(rolePermissions.roleId, roleId as string));
        
        // Transform the response to use actionName as actionId for frontend
        const transformedPermissions = permissions.map(p => ({
            ...p,
            actionId: p.actionName // Replace UUID with action name string
        }));
        
        res.status(200).json({ success: true, data: transformedPermissions });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

// Update/Save permissions for a role (Matrix save) - UPDATED to handle action names
export const updateRolePermissions = async (req: Request, res: Response) => {
    try {
        const { roleId, permissions } = req.body; 
        // permissions expected as array of { moduleId, actionId (string: 'read', 'write'), isAllowed, allowAll }

        if (!roleId || !Array.isArray(permissions)) {
            return res.status(400).json({ success: false, msg: "Invalid request data" });
        }

        const results = [];

        for (const perm of permissions) {
            const { moduleId, actionId, isAllowed, allowAll } = perm;

            // Get the actual permission action ID from the action name
            const actionRecord = await db
                .select()
                .from(permissionActions)
                .where(eq(permissionActions.action, actionId))
                .limit(1);

            if (actionRecord.length === 0) {
                console.warn(`Action ${actionId} not found, skipping`);
                continue;
            }

            const permissionActionId = actionRecord[0].id;

            // Check if permission already exists
            const existing = await db.select().from(rolePermissions).where(
                and(
                    eq(rolePermissions.roleId, roleId),
                    eq(rolePermissions.moduleId, moduleId),
                    eq(rolePermissions.actionId, permissionActionId)
                )
            );

            if (existing.length > 0) {
                // Update
                const updated = await db.update(rolePermissions)
                    .set({ isAllowed, allowAll })
                    .where(eq(rolePermissions.id, existing[0].id))
                    .returning();
                
                // Transform response
                const [updatedPerm] = updated;
                results.push({
                    ...updatedPerm,
                    actionId: actionId // Send back the action name
                });
            } else {
                // Insert
                const inserted = await db.insert(rolePermissions).values({
                    roleId,
                    moduleId,
                    actionId: permissionActionId,
                    isAllowed,
                    allowAll
                }).returning();
                
                // Transform response
                const [insertedPerm] = inserted;
                results.push({
                    ...insertedPerm,
                    actionId: actionId // Send back the action name
                });
            }
        }

        res.status(200).json({ success: true, msg: "Permissions updated successfully", data: results });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

// Utility: Get all modules and actions (to build the matrix on UI)
export const getPermissionMetadata = async (req: Request, res: Response) => {
    try {
        const allModules = await db.select().from(modules);
        const allActions = await db.select().from(permissionActions);
        
        // Transform actions to include both id and action name
        const transformedActions = allActions.map(a => ({
            id: a.action, // Use 'read', 'write' as id
            name: a.name,
            uuid: a.id // Keep original UUID if needed
        }));
        
        res.status(200).json({ 
            success: true, 
            data: { 
                modules: allModules, 
                actions: transformedActions 
            } 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

/* =========================
   USER ACCOUNT MANAGEMENT
========================= */

// Get all users with their role names
export const getUsers = async (req: Request, res: Response) => {
    try {
        const allUsers = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                phone: users.phone,
                roleId: users.roleId,
                roleName: roles.name,
                isActive: users.isActive,
                createdAt: users.createdAt,
            })
            .from(users)
            .leftJoin(roles, eq(users.roleId, roles.id))
            .orderBy(desc(users.createdAt));

        res.status(200).json({ success: true, data: allUsers });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, msg: error.message || 'Internal server error' });
    }
};

// Add new user account
export const addUser = async (req: Request, res: Response) => {
    try {
        const { name, email, phone, password, roleId, isActive } = req.body;

        if (!name || !email || !password || !roleId) {
            return res.status(400).json({ success: false, msg: "Name, Email, Password and Role are required" });
        }

        // Check if email already exists
        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, msg: "User with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await db.insert(users).values({
            name,
            email,
            phone,
            password: hashedPassword,
            roleId,
            isActive: isActive !== undefined ? isActive : true
        }).returning();

        const { password: _, ...userWithoutPassword } = newUser[0];
        res.status(201).json({ success: true, msg: "User created successfully", data: userWithoutPassword });
    } catch (error: any) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, msg: error.message || 'Internal server error' });
    }
};

// Update user details
export const updateUserAccount = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, phone, roleId, isActive, password } = req.body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (roleId !== undefined) updateData.roleId = roleId;
        if (isActive !== undefined) updateData.isActive = isActive;

        // If password is provided, hash it
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await db.update(users)
            .set(updateData)
            .where(eq(users.id, id as string))
            .returning();

        if (updatedUser.length === 0) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }

        // Return updated user without password
        const { password: _, ...userWithoutPassword } = updatedUser[0];
        res.status(200).json({ 
            success: true, 
            msg: "User updated successfully", 
            data: userWithoutPassword 
        });
    } catch (error: any) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, msg: error.message || 'Internal server error' });
    }
};

// DELETE USER ACCOUNT
export const deleteUserAccount = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedUser = await db.delete(users).where(eq(users.id, id as string)).returning();

        if (deletedUser.length === 0) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }

        res.status(200).json({ success: true, msg: "User deleted successfully" });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, msg: error.message || 'Internal server error' });
    }
};

// End of file
