import { db } from './index.js';
import { users, roles, modules, permissionActions, rolePermissions } from './schema/users.js';
import { settings } from './schema/settings.js';
import { tags } from './schema/category.js';
import { and, eq, notInArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { execSync } from 'node:child_process';
import "dotenv/config";

async function ensureSchema() {
    try {
        await db.select().from(roles).limit(1);
    } catch (error: any) {
        const code = error?.cause?.code || error?.code;
        if (code === '42P01') {
            console.log('Tables missing, running db:push...');
            execSync('pnpm db:push', { stdio: 'inherit' });
            console.log('Schema created');
            return;
        }
        throw error;
    }
}

async function seed() {
    console.log('🌱 Seeding database...');

    try {
        await ensureSchema();

        // 1. Create Super Admin Role
        let superAdminRole = await db.select().from(roles).where(eq(roles.name, 'Super Admin')).limit(1);
        if (superAdminRole.length === 0) {
            console.log('Creating Super Admin role...');
            const result = await db.insert(roles).values({
                name: 'Super Admin',
                description: 'System super administrator with full access',
                isActive: true
            }).returning();
            superAdminRole = result;
        }

        const roleId = superAdminRole[0].id;

        // 2. Create Permission Actions - MATCH FRONTEND ACTION NAMES
        const actions = [
            { id: 'read', name: 'Read' },
            { id: 'write', name: 'Write' },
            { id: 'create', name: 'Create' },
            { id: 'delete', name: 'Delete' },
            { id: 'import', name: 'Import' },
            { id: 'export', name: 'Export' }
        ];
        
        const actionIds: Record<string, string> = {};

        for (const action of actions) {
            let existingAction = await db.select().from(permissionActions).where(eq(permissionActions.action, action.id)).limit(1);
            if (existingAction.length === 0) {
                console.log(`Creating action: ${action.name} (${action.id})`);
                const result = await db.insert(permissionActions).values({ 
                    action: action.id,
                    name: action.name 
                }).returning();
                existingAction = result;
            }
            actionIds[action.id] = existingAction[0].id;
        }

        // 3. Create Modules - USE SAME SLUGS AS FRONTEND
        const moduleList = [
            { name: 'Dashboard', slug: 'dashboard' },
            { name: 'Users', slug: 'users' },
            { name: 'Roles', slug: 'roles' },
            { name: 'Customers', slug: 'customers' },
            { name: 'Category', slug: 'category' },
            { name: 'Products', slug: 'products' },
            { name: 'Bills', slug: 'bills' },
            { name: 'Orders', slug: 'orders' },
            { name: 'Barcode', slug: 'barcode' },
            { name: 'Media', slug: 'media' },
            { name: 'Uploads', slug: 'uploads' },
            { name: 'Video', slug: 'video' },
            { name: 'Tags', slug: 'tag' },
            { name: 'Settings', slug: 'settings' },
            { name: 'UOM', slug: 'uom' },
            { name: 'Banners', slug: 'banner' }
        ];

        // 4. Remove unused modules (like Brand, SubCategory)
        console.log('Cleaning up obsolete modules...');
        await db.delete(modules).where(notInArray(modules.slug, moduleList.map(m => m.slug)));

        const moduleIds: Record<string, string> = {};
        for (const m of moduleList) {
            let existingModule = await db.select().from(modules).where(eq(modules.slug, m.slug)).limit(1);
            if (existingModule.length === 0) {
                console.log(`Creating module: ${m.name} (${m.slug})`);
                const result = await db.insert(modules).values({ 
                    name: m.name, 
                    slug: m.slug 
                }).returning();
                existingModule = result;
            }
            moduleIds[m.slug] = existingModule[0].id;
        }

        // 4. Assign All Permissions to Super Admin Role
        console.log('Assigning permissions to Super Admin role...');
        for (const moduleSlug in moduleIds) {
            const moduleId = moduleIds[moduleSlug];
            for (const actionId in actionIds) {
                const permissionActionId = actionIds[actionId];
                
                // Check if already assigned
                const existingPerm = await db.select().from(rolePermissions).where(
                    and(
                        eq(rolePermissions.roleId, roleId),
                        eq(rolePermissions.moduleId, moduleId),
                        eq(rolePermissions.actionId, permissionActionId)
                    )
                ).limit(1);

                if (existingPerm.length === 0) {
                    await db.insert(rolePermissions).values({
                        roleId,
                        moduleId,
                        actionId: permissionActionId,
                        isAllowed: true,
                        allowAll: true
                    });
                }
            }
        }

        // 5. Create Super Admin User
        const adminEmail = 'admin@admin.com';
        const adminPhone = '9876543210';
        const adminPassword = 'admin@123'; 

        let superUser = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
        if (superUser.length === 0) {
            console.log('Creating Super Admin user...');
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await db.insert(users).values({
                name: 'Super Admin',
                email: adminEmail,
                phone: adminPhone,
                password: hashedPassword,
                roleId: roleId,
                isActive: true
            });
        }

        // 6. Create Default Shop Settings
        let shopSettings = await db.select().from(settings).limit(1);
        if (shopSettings.length === 0) {
            console.log('Seeding default shop settings...');
            await db.insert(settings).values({
                shopName: 'PRABHU CRACKERS',
                shopPhone: '9944336113',
                shopAddress: 'Main Road, Sivakasi, Tamil Nadu',
                shopGst: ''
            });
        }

        // 7. Create Default Tags
        const defaultTags = [
            { name: 'Best Selling', slug: 'best-selling', color: '#EF4444' },
            { name: 'New Arrival', slug: 'new-arrival', color: '#10B981' },
            { name: 'Hot Deal', slug: 'hot-deal', color: '#F59E0B' },
            { name: 'Top Rated', slug: 'top-rated', color: '#3B82F6' }
        ];

        console.log('Seeding default tags...');
        for (const tag of defaultTags) {
            let existingTag = await db.select().from(tags).where(eq(tags.slug, tag.slug)).limit(1);
            if (existingTag.length === 0) {
                console.log(`Creating tag: ${tag.name}`);
                await db.insert(tags).values({
                    name: tag.name,
                    slug: tag.slug,
                    color: tag.color,
                    isActive: true
                });
            }
        }

        console.log('✅ Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
