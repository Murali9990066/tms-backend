const bcrypt = require('bcryptjs');
const pool = require('./db');

const seedSuperAdmin = async () => {
    try {
        const [rows] = await pool.query(
            `SELECT id FROM \`user\` WHERE role = 'SUPER_ADMIN' LIMIT 1`
        );

        if (rows.length > 0) {
            console.log('✔ Super Admin already exists — skipping seed');
            return;
        }

        const tempPassword = 'SuperAdmin@TMS123';
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const [userResult] = await pool.query(
            `INSERT INTO \`user\` (vendor_id, display_employee_id, name, email, role, timezone)
       VALUES (NULL, ?, ?, ?, 'SUPER_ADMIN', 'Asia/Kolkata')`,
            ['SUPER-ADMIN-001', 'TMS Super Admin', 'superadmin@tms.com']
        );

        await pool.query(
            `INSERT INTO auth (user_id, password) VALUES (?, ?)`,
            [userResult.insertId, hashedPassword]
        );

        console.log('─────────────────────────────────────');
        console.log('✅ Super Admin created successfully');
        console.log(`Email   : superadmin@tms.com`);
        console.log(`Password: ${tempPassword}`);
        console.log('Please change your password after first login');
        console.log('─────────────────────────────────────');

    } catch (err) {
        console.error('Error seeding super admin:', err);
        throw err;
    }
};

const seedTasks = async () => {
    try {
        const [rows] = await pool.query(`SELECT id FROM task_master LIMIT 1`);

        if (rows.length > 0) {
            console.log('✔ Tasks already seeded — skipping');
            return;
        }

        const tasks = [
            'Development',
            'Testing',
            'Support',
            'Architecture',
            'Leave',
            'Holiday',
        ];

        for (const task of tasks) {
            await pool.query(
                `INSERT INTO task_master (name) VALUES (?)`,
                [task]
            );
        }

        console.log('✅ Default tasks seeded successfully');

    } catch (err) {
        console.error('Error seeding tasks:', err);
        throw err;
    }
};

module.exports = { seedSuperAdmin, seedTasks };