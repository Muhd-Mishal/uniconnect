import pool from './config/db.js';

async function fixDatabase() {
    try {
        console.log('Applying database patching...');

        // Check and add is_verified
        try {
            await pool.query("ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE;");
            console.log('Added is_verified column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('is_verified already exists.');
            else throw e;
        }

        // Check and add verification_token
        try {
            await pool.query("ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);");
            console.log('Added verification_token column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('verification_token already exists.');
            else throw e;
        }

        // Check and add reset_token
        try {
            await pool.query("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);");
            console.log('Added reset_token column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('reset_token already exists.');
            else throw e;
        }

        // Check and add reset_token_expiry
        try {
            await pool.query("ALTER TABLE users ADD COLUMN reset_token_expiry BIGINT;");
            console.log('Added reset_token_expiry column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('reset_token_expiry already exists.');
            else throw e;
        }

        console.log('Database patch completed successfully.');
    } catch (err) {
        console.error('Error patching database:', err);
    } finally {
        process.exit(0);
    }
}

fixDatabase();
