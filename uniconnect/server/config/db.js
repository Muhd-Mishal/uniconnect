import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const parseBoolean = (value) => ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());

const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.DB_URL || '';
const parsedUrl = connectionUrl ? new URL(connectionUrl) : null;

const host = process.env.DB_HOST || parsedUrl?.hostname || 'localhost';
const port = Number(process.env.DB_PORT || parsedUrl?.port || 3306);
const user = process.env.DB_USER || decodeURIComponent(parsedUrl?.username || 'root');
const password = process.env.DB_PASSWORD || decodeURIComponent(parsedUrl?.password || '');
const database = process.env.DB_NAME || parsedUrl?.pathname?.replace(/^\//, '') || 'uniconnect';

const isLocalDatabase = ['localhost', '127.0.0.1'].includes(host);
const shouldUseSsl = parseBoolean(process.env.DB_SSL) || (!isLocalDatabase && Boolean(connectionUrl));

const pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

export default pool;
