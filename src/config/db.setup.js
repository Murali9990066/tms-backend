const pool = require('./db');

const createTables = async () => {
  try {

    // 1. VENDOR
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendor (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_code VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        upload_mandatory BOOLEAN NOT NULL DEFAULT true,
        allocation_enforced BOOLEAN NOT NULL DEFAULT false,
        locking_enabled BOOLEAN NOT NULL DEFAULT false,
        escalation_enabled BOOLEAN NOT NULL DEFAULT false,
        allow_proxy_submission BOOLEAN NOT NULL DEFAULT false,
        manual_entry_days INT DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log('✔ vendor table ready');

    // 2. USER
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`user\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vendor_id INT DEFAULT NULL,
        display_employee_id VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        role ENUM('SUPER_ADMIN', 'ADMIN', 'PM', 'EMPLOYEE') NOT NULL,
        timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
        reporting_manager_id INT DEFAULT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_first_login BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_vendor_email (vendor_id, email),
        FOREIGN KEY (vendor_id) REFERENCES vendor(id) ON DELETE CASCADE,
        FOREIGN KEY (reporting_manager_id) REFERENCES \`user\`(id) ON DELETE SET NULL
      );
    `);
    console.log('✔ user table ready');

    // 3. AUTH
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auth (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        reset_token VARCHAR(255) DEFAULT NULL,
        reset_token_expiry TIMESTAMP DEFAULT NULL,
        last_login TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES \`user\`(id) ON DELETE CASCADE
      );
    `);
    console.log('✔ auth table ready');

    // 4. PROJECT
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vendor_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        project_type VARCHAR(100) NOT NULL,
        client_name VARCHAR(255) DEFAULT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendor(id) ON DELETE CASCADE
      );
    `);
    console.log('✔ project table ready');

    // 5. TASK_MASTER
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_master (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        is_active_globally BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✔ task_master table ready');

    // 6. VENDOR_TASK
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendor_task (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vendor_id INT NOT NULL,
        task_id INT NOT NULL,
        is_visible BOOLEAN NOT NULL DEFAULT true,
        UNIQUE KEY unique_vendor_task (vendor_id, task_id),
        FOREIGN KEY (vendor_id) REFERENCES vendor(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES task_master(id) ON DELETE CASCADE
      );
    `);
    console.log('✔ vendor_task table ready');

    // 7. PROJECT_ALLOCATION
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_allocation (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        user_id INT NOT NULL,
        start_date DATE DEFAULT NULL,
        end_date DATE DEFAULT NULL,
        UNIQUE KEY unique_project_user (project_id, user_id),
        FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES \`user\`(id) ON DELETE CASCADE
      );
    `);
    console.log('✔ project_allocation table ready');

    // 8. TIMESHEET
    await pool.query(`
      CREATE TABLE IF NOT EXISTS timesheet (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        week_start DATE NOT NULL,
        week_end DATE NOT NULL,
        status ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
        filled_by INT DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_week (user_id, week_start),
        FOREIGN KEY (user_id) REFERENCES \`user\`(id) ON DELETE CASCADE,
        FOREIGN KEY (filled_by) REFERENCES \`user\`(id) ON DELETE SET NULL
      );
    `);
    console.log('✔ timesheet table ready');

    // 9. TIMESHEET_ENTRY
    await pool.query(`
      CREATE TABLE IF NOT EXISTS timesheet_entry (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vendor_id INT NOT NULL,
        timesheet_id INT NOT NULL,
        entry_date DATE NOT NULL,
        project_id INT NOT NULL,
        task_id INT NOT NULL,
        hours DECIMAL(5,2) NOT NULL DEFAULT 0,
        comment VARCHAR(500) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendor(id) ON DELETE CASCADE,
        FOREIGN KEY (timesheet_id) REFERENCES timesheet(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES task_master(id) ON DELETE CASCADE
      );
    `);
    console.log('✔ timesheet_entry table ready');

    // TIMESHEET_ENTRY INDEXES
    await pool.query(`CREATE INDEX idx_entry_vendor ON timesheet_entry(vendor_id)`).catch(() => { });
    await pool.query(`CREATE INDEX idx_entry_timesheet ON timesheet_entry(timesheet_id)`).catch(() => { });
    await pool.query(`CREATE INDEX idx_entry_date ON timesheet_entry(entry_date)`).catch(() => { });
    await pool.query(`CREATE INDEX idx_entry_project ON timesheet_entry(project_id)`).catch(() => { });
    console.log('✔ timesheet_entry indexes ready');

    // 10. DOCUMENT
    await pool.query(`
      CREATE TABLE IF NOT EXISTS document (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timesheet_id INT NOT NULL,
        uploaded_by INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(10) NOT NULL,
        storage_path VARCHAR(500) NOT NULL,
        uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (timesheet_id) REFERENCES timesheet(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES \`user\`(id) ON DELETE CASCADE
      );
    `);
    console.log('✔ document table ready');

    // 11. APPROVAL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS approval (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timesheet_id INT NOT NULL,
        reviewed_by INT NOT NULL,
        action ENUM('APPROVED', 'REJECTED') NOT NULL,
        comments VARCHAR(500) DEFAULT NULL,
        document_verified BOOLEAN NOT NULL DEFAULT false,
        actioned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (timesheet_id) REFERENCES timesheet(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES \`user\`(id) ON DELETE CASCADE
      );
    `);
    console.log('✔ approval table ready');

    // 12. AUDIT_LOG
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vendor_id INT NOT NULL,
        entity_id INT NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        changed_by INT NOT NULL,
        field_name VARCHAR(100) NOT NULL,
        old_value TEXT DEFAULT NULL,
        new_value TEXT DEFAULT NULL,
        changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendor(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES \`user\`(id) ON DELETE CASCADE
      );
    `);
    console.log('✔ audit_log table ready');

    // 13. NOTIFICATION
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vendor_id INT NOT NULL,
        recipient_id INT NOT NULL,
        entity_id INT NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        type VARCHAR(100) NOT NULL,
        status ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
        sent_at TIMESTAMP DEFAULT NULL,
        FOREIGN KEY (vendor_id) REFERENCES vendor(id) ON DELETE CASCADE,
        FOREIGN KEY (recipient_id) REFERENCES \`user\`(id) ON DELETE CASCADE
      );
    `);
    console.log('✔ notification table ready');

    console.log('✅ All tables created successfully');

  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  }
};

module.exports = createTables;