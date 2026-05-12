import { db } from '../config/database.js';
import { roles, modules, permissionActions, users, rolePermissions } from './schema/users.js';
import { settings } from './schema/settings.js';
import bcrypt from 'bcryptjs';

async function seed() {
    console.log('🌱 Seeding database...');

    // Create modules
    const moduleList = [
        { name: 'Dashboard', slug: 'dashboard' },
        { name: 'Categories', slug: 'categories' },
        { name: 'Products', slug: 'products' },
        { name: 'Tags', slug: 'tags' },
        { name: 'UOM', slug: 'uoms' },
        { name: 'Videos', slug: 'videos' },
        { name: 'Media Library', slug: 'media-library' },
        { name: 'Banners', slug: 'banners' },
        { name: 'Customers', slug: 'customers' },
        { name: 'Orders', slug: 'orders' },
        { name: 'Invoices', slug: 'invoices' },
        { name: 'Users', slug: 'users' },
        { name: 'Roles', slug: 'roles' },
        { name: 'Permissions', slug: 'permissions' },
        { name: 'Settings', slug: 'settings' },
    ];

    for (const mod of moduleList) {
        await db.insert(modules).values(mod).onConflictDoNothing();
    }
    const allModules = await db.select().from(modules);
    console.log('✅ Modules seeded');

    // Create permission actions
    const actionsList = [
        { action: 'View', name: 'Read' },
        { action: 'Create', name: 'Create' },
        { action: 'Update', name: 'Update' },
        { action: 'Delete', name: 'Delete' },
        { action: 'Bulk Delete', name: 'Bulk Delete' },
        { action: 'Export', name: 'Export' },
        { action: 'Import', name: 'Import' },
    ];

    for (const action of actionsList) {
        await db.insert(permissionActions).values(action).onConflictDoNothing();
    }
    const allActions = await db.select().from(permissionActions);
    console.log('✅ Permission actions seeded');

    // Create admin role
    const [adminRole] = await db.insert(roles).values({
        name: 'Admin',
        description: 'Super Administrator',
        isActive: true,
    }).returning();

    console.log('✅ Admin role created');

    // Assign all permissions to Admin role
    console.log('🔐 Granting all permissions to Super Admin role...');
    for (const mod of allModules) {
        for (const action of allActions) {
            await db.insert(rolePermissions).values({
                roleId: adminRole.id,
                moduleId: mod.id,
                actionId: action.id,
                isAllowed: true,
                allowAll: true,
            }).onConflictDoNothing();
        }
    }
    console.log('✅ Permissions granted');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.insert(users).values({
        name: 'Super Admin',
        email: 'admin@crackerskingdom.com',
        phone: '9999999999',
        password: hashedPassword,
        roleId: adminRole.id,
        isActive: true,
    }).onConflictDoNothing();

    console.log('✅ Admin user created (email: admin@crackerskingdom.com, password: admin123)');

    // Create default settings
    await db.insert(settings).values({
        shopName: 'PRABHU CRACKERS',
        shopPhone: '9944336113',
        shopAddress: 'Main Road, Sivakasi, Tamil Nadu',
        shopGst: '',
    }).onConflictDoNothing();

    console.log('✅ Default settings created');
    console.log('🎉 Seeding completed!');
}

seed().catch(console.error);