import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import pool from './config/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import postRoutes from './routes/postRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import evaluateRoutes from './routes/evaluateRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const parseBoolean = (value) => ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
const configuredOrigins = [
    process.env.CLIENT_ORIGIN,
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN
]
    .filter(Boolean)
    .join(',');

const allowedOrigins = (configuredOrigins === '*' ? '' : configuredOrigins)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
const allowAllOrigins = process.env.ALLOW_ALL_ORIGINS
    ? parseBoolean(process.env.ALLOW_ALL_ORIGINS)
    : true;

const wildcardToRegex = (pattern) => new RegExp(`^${pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')}$`);

const isAllowedOrigin = (origin) => {
    if (allowAllOrigins) return true;
    if (!origin) return true;
    if (allowedOrigins.length === 0) return true;
    return allowedOrigins.some((allowedOrigin) => {
        if (allowedOrigin === '*') return true;
        if (allowedOrigin.includes('*')) {
            return wildcardToRegex(allowedOrigin).test(origin);
        }
        return allowedOrigin === origin;
    });
};

const corsOptions = {
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    return next();
});
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.options('*', cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static directory for uploads
app.use('/uploads', express.static('uploads'));

// Global User Socket Map to track Realtime Notifications
const userSockets = new Map();

// Inject io instance and global socket tracker directly into API routes
app.use((req, res, next) => {
    req.io = io;
    req.userSockets = userSockets;
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', evaluateRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/portfolio', portfolioRoutes);

const ensurePortfolioSchema = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS portfolios (
            portfolio_id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL UNIQUE,
            bio TEXT,
            skills TEXT,
            profile_image VARCHAR(255),
            resume VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS portfolio_projects (
            project_id INT PRIMARY KEY AUTO_INCREMENT,
            portfolio_id INT NOT NULL,
            title VARCHAR(150) NOT NULL,
            description TEXT NOT NULL,
            image VARCHAR(255),
            github_url VARCHAR(255),
            live_demo_url VARCHAR(255),
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id) ON DELETE CASCADE
        )
    `);
};

// Socket.io Real-time Chat Logic
io.on('connection', (socket) => {
    console.log(`User connected to socket: ${socket.id}`);

    socket.on('joinRoom', (roomID) => {
        socket.join(roomID);
        console.log(`Socket ${socket.id} joined room ${roomID}`);
    });

    socket.on('sendMessage', async (data) => {
        // data expects: { roomID, sender_id, receiver_id, group_id, content }
        const { roomID, sender_id, receiver_id, group_id, content } = data;

        try {
            // Save to database
            const [result] = await pool.execute(
                'INSERT INTO messages (sender_id, receiver_id, group_id, content) VALUES (?, ?, ?, ?)',
                [sender_id, receiver_id || null, group_id || null, content]
            );

            // Fetch sender's username to attach to the broadcast
            const [users] = await pool.execute('SELECT username FROM users WHERE user_id = ?', [sender_id]);
            const sender_name = users.length > 0 ? users[0].username : 'Unknown';

            // Construct payload
            const messagePayload = {
                id: result.insertId,
                sender_id,
                receiver_id,
                group_id,
                content,
                sender_name,
                created_at: new Date()
            };

            // Broadcast to everyone in the room (including sender)
            io.to(roomID).emit('receiveMessage', messagePayload);
        } catch (err) {
            console.error('Error saving or emitting message via socket:', err);
        }
    });

    socket.on('register', (userId) => {
        if (userId) {
            userSockets.set(userId.toString(), socket.id);
            console.log(`User ${userId} registered with socket ${socket.id}`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected from socket: ${socket.id}`);
        // Memory cleanup
        for (const [key, value] of userSockets.entries()) {
            if (value === socket.id) {
                userSockets.delete(key);
                break;
            }
        }
    });
});

// Base Route
app.get('/', (req, res) => {
    res.send('UNI-CONNECT API is running');
});

app.get('/api/health', async (req, res, next) => {
    try {
        await pool.query('SELECT 1');
        res.json({ ok: true, database: 'connected' });
    } catch (error) {
        next(error);
    }
});

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await ensurePortfolioSchema();

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
