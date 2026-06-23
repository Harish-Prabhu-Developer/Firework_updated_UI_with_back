import { db } from '../config/database.js';
import { roles, modules, permissionActions, users, rolePermissions } from './schema/users.js';
import { settings } from './schema/settings.js';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';

async function seed() {
    console.log('🌱 Seeding database...');

    // Create sequence for auto-generated product codes (CK100, CK101, ...)
    await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS product_code_seq MINVALUE 100 START 100;`);
    console.log('✅ Product code sequence created');

    await db.execute(sql`
      CREATE OR REPLACE FUNCTION assign_product_code()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.product_code IS NULL OR NEW.product_code = '' THEN
          NEW.product_code := 'CK' || nextval('product_code_seq')::text;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await db.execute(sql`
      DROP TRIGGER IF EXISTS trg_assign_product_code ON products;
      CREATE TRIGGER trg_assign_product_code
      BEFORE INSERT ON products
      FOR EACH ROW
      EXECUTE FUNCTION assign_product_code();
    `);
    console.log('✅ Product code trigger created');

    // Create modules
    const moduleList = [
        { name: 'Dashboard', slug: 'dashboard' },
        { name: 'Categories', slug: 'categories' },
        { name: 'Products', slug: 'products' },
        { name: 'Videos', slug: 'videos' },
        { name: 'Media Library', slug: 'media-library' },

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
        phone: '8438009220',
        password: hashedPassword,
        roleId: adminRole.id,
        isActive: true,
    }).onConflictDoNothing();

    console.log('✅ Admin user created (email: admin@crackerskingdom.com, password: admin123)');

    // Create default settings
    await db.insert(settings).values({
        shopName: 'Crackers Kingdom',
        shopPhone: '9944336113',
        shopAddress: 'Main Road, Sivakasi, Tamil Nadu',
        shopGst: '',
    }).onConflictDoNothing();

    console.log('✅ Default settings created');
    console.log('🎉 Seeding completed!');
}

seed().catch(console.error);