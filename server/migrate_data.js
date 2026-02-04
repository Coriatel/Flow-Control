const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');
const path = require('path');

// Configuration
const SQLITE_DB_PATH = path.join(__dirname, 'prisma/dev.db');
const POSTGRES_URL = process.env.DATABASE_URL; // Should be loaded from .env

if (!POSTGRES_URL) {
    console.error("DATABASE_URL not found in env. Run with 'source .env && node migrate_data.js' or dotenv.");
    process.exit(1);
}

const TABLE_MAPPINGS = {
    'User': 'app_users',
    '_prisma_migrations': null, // Skip migrations
    'sqlite_sequence': null,
    'directus_migrations': null, 
    'directus_folders': null, 
    'directus_relations': null, 
    'directus_files': null, 
    'directus_fields': null, 
    'directus_operations': null, 
    'directus_notifications': null, 
    'directus_translations': null, 
    'directus_shares': null, 
    'directus_versions': null, 
    'directus_revisions': null, 
    'directus_users': null, 
    'directus_extensions': null, 
    'directus_sessions': null, 
    'directus_policies': null, 
    'directus_permissions': null, 
    'directus_access': null, 
    'directus_collections': null, 
    'directus_dashboards': null, 
    'directus_flows': null, 
    'directus_panels': null, 
    'directus_presets': null, 
    'directus_roles': null, 
    'directus_comments': null, 
    'directus_activity': null, 
    'directus_settings': null
};

// Main Async Function
(async () => {
    console.log("🚀 Starting Migration (v2 - Date Fix)...");
    console.log(`📂 SQLite: ${SQLITE_DB_PATH}`);
    console.log(`🐘 Postgres: ${POSTGRES_URL}`);

    // Connect SQLite
    const db = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.error("SQLite Connection Error:", err.message);
            process.exit(1);
        }
    });

    // Connect Postgres
    const client = new Client({
        connectionString: POSTGRES_URL,
    });
    await client.connect();

    // Disable Foreign Keys
    console.log("🔧 Disabling Constraints...");
    await client.query("SET session_replication_role = 'replica';");

    try {
        // Get SQLite Tables
        const tables = await new Promise((resolve, reject) => {
            db.all("SELECT name FROM sqlite_master WHERE type='table';", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(r => r.name));
            });
        });

        console.log(`📋 Found ${tables.length} tables in SQLite`);

        for (const tableName of tables) {
            const targetName = TABLE_MAPPINGS[tableName] !== undefined ? TABLE_MAPPINGS[tableName] : tableName;
            
            if (targetName === null) {
                // Silent skip for known skips
                continue;
            }

            console.log(`\n🔄 Migrating ${tableName} -> ${targetName}...`);

            // 1. Get Target Schema (Boolean & Date Columns)
            const colRes = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = 'inventory'
            `, [targetName]);

            let pgColumns = colRes.rows;
            
            if (pgColumns.length === 0) {
                 // Try looking up with quotes if needed, but we assume exact match from Prisma
                 console.warn(`⚠️  Target table '${targetName}' not found in 'inventory' schema. Skipping.`);
                 continue;
            }
            
            const booleanCols = new Set(
                pgColumns.filter(c => c.data_type === 'boolean').map(c => c.column_name)
            );
            const dateCols = new Set(
                pgColumns.filter(c => 
                    c.data_type.startsWith('timestamp') || 
                    c.data_type === 'date'
                ).map(c => c.column_name)
            );

            // 2. Fetch Data
            const rows = await new Promise((resolve, reject) => {
                db.all(`SELECT * FROM "${tableName}"`, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            console.log(`   Found ${rows.length} rows.`);
            if (rows.length === 0) continue;

            // 3. Transform & Insert
            const BATCH_SIZE = 50;
            let successCount = 0;
            
            for (let i = 0; i < rows.length; i += BATCH_SIZE) {
                const batch = rows.slice(i, i + BATCH_SIZE);
                
                for (const row of batch) {
                    const keys = Object.keys(row);
                    const values = keys.map(k => {
                        let val = row[k];
                        
                        // Boolean Fix
                        if (booleanCols.has(k)) {
                            return val === 1; 
                        }
                        
                        // Date Fix (Number -> Date)
                        if (dateCols.has(k)) {
                            if (typeof val === 'number') {
                                return new Date(val); // Convert ms timestamp to JS Date
                            }
                            if (typeof val === 'string' && !isNaN(val)) {
                                 // Try parsing as int if string looks like number
                                 const num = parseInt(val);
                                 if (num > 1000000000000) return new Date(num);
                            }
                        }
                        
                        return val;
                    });

                    const cols = keys.map(k => `"${k}"`).join(', ');
                    const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
                    
                    const query = `INSERT INTO "inventory"."${targetName}" (${cols}) VALUES (${placeholders})`;
                    
                    try {
                        await client.query(query, values);
                        successCount++;
                    } catch (e) {
                        console.error(`❌ Failed to insert row in ${targetName}:`, e.message);
                        // console.error("Row:", row);
                    }
                }
            }
            console.log(`   ✅ Migrated ${successCount}/${rows.length} rows.`);
        }

    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        console.log("🔧 Re-enabling Constraints...");
        await client.query("SET session_replication_role = 'origin';");
        await client.end();
        db.close();
        console.log("👋 Done.");
    }

})();
