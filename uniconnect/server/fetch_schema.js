import pool from './config/db.js';
import fs from 'fs';

async function fetchSchema() {
    try {
        console.log('Connecting to database...');
        const [tables] = await pool.query('SHOW TABLES');
        let md = '# Database Schema\n\n';

        for (const row of tables) {
            const tableName = Object.values(row)[0];
            const [columns] = await pool.query(`DESCRIBE ${tableName}`);

            md += `## \`${tableName}\`\n\n`;
            md += `| Field | Type | Null | Key | Default | Extra |\n`;
            md += `|---|---|---|---|---|---|\n`;

            for (const col of columns) {
                md += `| ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default || 'NULL'} | ${col.Extra} |\n`;
            }
            md += '\n';
        }

        fs.writeFileSync('schema_output.md', md);
        console.log('Schema successfully written to schema_output.md');
    } catch (error) {
        console.error('Error fetching schema:', error);
    } finally {
        process.exit(0);
    }
}

fetchSchema();
