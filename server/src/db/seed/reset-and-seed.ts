// src/db/seed/reset-and-seed.ts
import { db } from '../index.js';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { users, roles, modules, permissionActions, rolePermissions } from '../schema/users.js';
import { eq } from 'drizzle-orm';
import "dotenv/config";

async function resetAndSeed() {
    console.log('🔄 Resetting database and re-seeding...');

    try {
        // Step 1: Drop all tables
        console.log('🗑️  Dropping all tables...');
        await db.execute(sql`SET session_replication_role = 'replica';`);
        
        const tablesToDrop = [
            'user_sessions',
            'role_permissions',
            'permission_actions',
            'modules',
            'users',
            'roles'
        ];

        for (const table of tablesToDrop) {
            await db.execute(sql`DROP TABLE IF EXISTS ${sql.identifier(table)} CASCADE;`);
        }
        
        await db.execute(sql`SET session_replication_role = 'origin';`);
        console.log('✅ Tables dropped successfully!');

        // Step 2: Run migrations (if you have them)
        console.log('🏗️  Running migrations...');
        // Uncomment if you use migrations
        // await migrate(db, { migrationsFolder: './drizzle' });
        console.log('✅ Migrations completed!');

        // Step 3: Seed fresh data
        console.log('🌱 Seeding fresh data...');
        
        // Create Super Admin Role
        const [superAdminRole] = await db.insert(roles).values({ 
            name: 'Super Admin' 
        }).returning();
        
        const [adminRole] = await db.insert(roles).values({ 
            name: 'Admin' 
        }).returning();
        
        const [managerRole] = await db.insert(roles).values({ 
            name: 'Manager' 
        }).returning();
        
        const [editorRole] = await db.insert(roles).values({ 
            name: 'Editor' 
        }).returning();
        
        const [viewerRole] = await db.insert(roles).values({ 
            name: 'Viewer' 
        }).returning();

        console.log('✅ Roles created');

        // Create Permission Actions
        const actionList = [
            { id: 'read', name: 'Read' },
            { id: 'write', name: 'Write' },
            { id: 'create', name: 'Create' },
            { id: 'delete', name: 'Delete' },
            { id: 'import', name: 'Import' },
            { id: 'export', name: 'Export' }
        ];

        const actionIds: Record<string, string> = {};
        for (const action of actionList) {
            const [result] = await db.insert(permissionActions).values({
                action: action.id,
                name: action.name
            }).returning();
            actionIds[action.id] = result.id;
        }

        console.log('✅ Permission actions created');

        // Create Modules
        const moduleList = [
            { name: 'Dashboard', slug: 'dashboard' },
            { name: 'Users', slug: 'users' },
            { name: 'Roles', slug: 'roles' },
            { name: 'Customers', slug: 'customers' },
            { name: 'Category', slug: 'category' },
            { name: 'Products', slug: 'products' },
            { name: 'Orders', slug: 'orders' },
            { name: 'Barcode', slug: 'barcode' },
            { name: 'Media', slug: 'media' },
            { name: 'Uploads', slug: 'uploads' },
            { name: 'Video', slug: 'video' },
            { name: 'Settings', slug: 'settings' }
        ];

        const moduleIds: Record<string, string> = {};
        for (const module of moduleList) {
            const [result] = await db.insert(modules).values({
                name: module.name,
                slug: module.slug
            }).returning();
            moduleIds[module.slug] = result.id;
        }

        console.log('✅ Modules created');

        // Assign Permissions to Super Admin (All permissions)
        console.log('Assigning Super Admin permissions...');
        for (const moduleSlug in moduleIds) {
            const moduleId = moduleIds[moduleSlug];
            for (const actionId in actionIds) {
                const permissionActionId = actionIds[actionId];
                await db.insert(rolePermissions).values({
                    roleId: superAdminRole.id,
                    moduleId,
                    actionId: permissionActionId,
                    isAllowed: true,
                    allowAll: true
                });
            }
        }

        // Assign permissions to Admin (All permissions except delete)
        console.log('Assigning Admin permissions...');
        for (const moduleSlug in moduleIds) {
            const moduleId = moduleIds[moduleSlug];
            for (const actionId in actionIds) {
                if (actionId !== 'delete') {
                    const permissionActionId = actionIds[actionId];
                    await db.insert(rolePermissions).values({
                        roleId: adminRole.id,
                        moduleId,
                        actionId: permissionActionId,
                        isAllowed: true,
                        allowAll: false
                    });
                }
            }
        }

        // Assign permissions to Manager (Read, Write, Create on specific modules)
        console.log('Assigning Manager permissions...');
        const managerModules = ['dashboard', 'products', 'orders', 'customers', 'category'];
        for (const moduleSlug of managerModules) {
            const moduleId = moduleIds[moduleSlug];
            const managerActions = ['read', 'write', 'create', 'export'];
            for (const actionId of managerActions) {
                const permissionActionId = actionIds[actionId];
                await db.insert(rolePermissions).values({
                    roleId: managerRole.id,
                    moduleId,
                    actionId: permissionActionId,
                    isAllowed: true,
                    allowAll: false
                });
            }
        }

        // Assign permissions to Editor (Read, Write on products, category)
        console.log('Assigning Editor permissions...');
        const editorModules = ['products', 'category'];
        for (const moduleSlug of editorModules) {
            const moduleId = moduleIds[moduleSlug];
            const editorActions = ['read', 'write', 'create'];
            for (const actionId of editorActions) {
                const permissionActionId = actionIds[actionId];
                await db.insert(rolePermissions).values({
                    roleId: editorRole.id,
                    moduleId,
                    actionId: permissionActionId,
                    isAllowed: true,
                    allowAll: false
                });
            }
        }

        // Assign permissions to Viewer (Read only on most modules)
        console.log('Assigning Viewer permissions...');
        const viewerModules = ['dashboard', 'products', 'orders', 'customers', 'category', 'users'];
        for (const moduleSlug of viewerModules) {
            const moduleId = moduleIds[moduleSlug];
            const permissionActionId = actionIds['read'];
            await db.insert(rolePermissions).values({
                roleId: viewerRole.id,
                moduleId,
                actionId: permissionActionId,
                isAllowed: true,
                allowAll: false
            });
        }

        console.log('✅ Role permissions assigned');

        // Create Users
        const hashedPassword = await bcrypt.hash('admin@123', 10);
        
        // Super Admin
        await db.insert(users).values({
            name: 'Super Admin',
            email: 'admin@admin.com',
            phone: '9876543210',
            password: hashedPassword,
            roleId: superAdminRole.id,
            isActive: true
        });

        // Admin
        await db.insert(users).values({
            name: 'John Admin',
            email: 'john@admin.com',
            phone: '1234567891',
            password: hashedPassword,
            roleId: adminRole.id,
            isActive: true
        });

        // Manager
        await db.insert(users).values({
            name: 'Sarah Manager',
            email: 'sarah@manager.com',
            phone: '1234567892',
            password: hashedPassword,
            roleId: managerRole.id,
            isActive: true
        });

        // Editor
        await db.insert(users).values({
            name: 'Mike Editor',
            email: 'mike@editor.com',
            phone: '1234567893',
            password: hashedPassword,
            roleId: editorRole.id,
            isActive: true
        });

        // Viewer
        await db.insert(users).values({
            name: 'Lisa Viewer',
            email: 'lisa@viewer.com',
            phone: '1234567894',
            password: hashedPassword,
            roleId: viewerRole.id,
            isActive: true
        });

        console.log('✅ Users created');
        console.log('🎉 Database reset and seeded successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('Super Admin: admin@admin.com / admin@123');
        console.log('Admin: john@admin.com / admin@123');
        console.log('Manager: sarah@manager.com / admin@123');
        console.log('Editor: mike@editor.com / admin@123');
        console.log('Viewer: lisa@viewer.com / admin@123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Reset and seed failed:', error);
        process.exit(1);
    }
}

resetAndSeed();
