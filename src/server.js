require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'local'}` });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const createTables = require('./config/db.setup');
const { seedSuperAdmin, seedTasks } = require('./config/seed');

// routes
const authRoutes = require('./microservices/authMicroservice/auth.routes');
const vendorRoutes = require('./microservices/vendorMicroservice/vendor.routes');
const userRoutes = require('./microservices/userMicroservice/user.routes');
const projectRoutes = require('./microservices/projectMicroservice/project.routes');
const timesheetRoutes = require('./microservices/timesheetMicroservice/timesheet.routes');
const documentRoutes = require('./microservices/documentMicroservice/document.routes');
const notificationRoutes = require('./microservices/notificationMicroservice/notification.routes');
const reportRoutes = require('./microservices/reportMicroservice/report.routes');

const app = express();
const PORT = process.env.PORT || 3000;

const authenticate = require('./microservices/authMicroservice/auth.middleware');

// middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// public routes — no token required
app.use('/auth', authRoutes);

// global auth middleware — all routes below require token
app.use(authenticate);

// protected routes
app.use('/vendor', vendorRoutes);
app.use('/user', userRoutes);
app.use('/project', projectRoutes);
app.use('/timesheet', timesheetRoutes);
app.use('/document', documentRoutes);
app.use('/notification', notificationRoutes);
app.use('/report', reportRoutes);

// health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'TMS server is running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// start server
const start = async () => {
    try {
        await createTables();
        await seedSuperAdmin();
        await seedTasks();
        await seedTasks();
        app.listen(PORT, () => {
            console.log(`TMS server running on port ${PORT} in ${process.env.NODE_ENV || 'local'} mode`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

start();