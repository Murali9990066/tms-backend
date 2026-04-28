const ReportModel = require('./report.model');
const sendResponse = require('../../shared/utils/response.util');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// ─── Helpers ────────────────────────────────────────────────────

// Calculate total days in date range
const daysBetween = (dateFrom, dateTo) => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    return Math.max(1, Math.round((to - from) / (1000 * 60 * 60 * 24)) + 1);
};

// Build filters respecting role-based access
const buildFilters = (body, user) => {
    const { filters = {} } = body;
    const result = {
        vendorId: user.vendor_id,
        dateFrom: filters.dateFrom || null,
        dateTo: filters.dateTo || null,
        employeeIds: filters.employeeIds || [],
        projectIds: filters.projectIds || [],
    };

    // EMPLOYEE can only see own data
    if (user.role === 'EMPLOYEE') {
        result.employeeIds = [user.id];
    }

    return result;
};

// ─── Report Builders ────────────────────────────────────────────

const buildDetailed = (entries) => ({
    columns: [
        { key: 'date', label: 'Date' },
        { key: 'employeeName', label: 'Employee' },
        { key: 'employeeCode', label: 'Employee ID' },
        { key: 'projectName', label: 'Project' },
        { key: 'task', label: 'Task' },
        { key: 'hours', label: 'Hours' },
        { key: 'comment', label: 'Comment' },
        { key: 'timesheetStatus', label: 'Status' },
    ],
    rows: entries.map(e => ({
        date: e.date,
        employeeName: e.employeeName,
        employeeCode: e.employeeCode,
        projectName: e.projectName,
        task: e.task,
        hours: parseFloat(e.hours),
        comment: e.comment || '',
        timesheetStatus: e.timesheetStatus,
    })),
});

const buildWeeklySummary = (entries) => {
    const map = {};
    for (const e of entries) {
        const key = `${e.weekStart}_${e.employeeId}`;
        if (!map[key]) {
            map[key] = {
                weekStart: e.weekStart,
                weekEnd: e.weekEnd,
                employeeName: e.employeeName,
                employeeCode: e.employeeCode,
                totalHours: 0,
                projects: new Set(),
                status: e.timesheetStatus,
            };
        }
        map[key].totalHours += parseFloat(e.hours);
        map[key].projects.add(e.projectName);
    }

    return {
        columns: [
            { key: 'weekStart', label: 'Week Start' },
            { key: 'weekEnd', label: 'Week End' },
            { key: 'employeeName', label: 'Employee' },
            { key: 'employeeCode', label: 'Employee ID' },
            { key: 'projects', label: 'Projects' },
            { key: 'totalHours', label: 'Total Hours' },
            { key: 'status', label: 'Status' },
        ],
        rows: Object.values(map).map(r => ({
            weekStart: r.weekStart,
            weekEnd: r.weekEnd,
            employeeName: r.employeeName,
            employeeCode: r.employeeCode,
            projects: [...r.projects].join(', '),
            totalHours: parseFloat(r.totalHours.toFixed(2)),
            status: r.status,
        })),
    };
};

const buildTeam = (entries) => {
    const map = {};
    for (const e of entries) {
        const key = e.employeeId;
        if (!map[key]) {
            map[key] = {
                employeeName: e.employeeName,
                employeeCode: e.employeeCode,
                totalHours: 0,
                projects: new Set(),
            };
        }
        map[key].totalHours += parseFloat(e.hours);
        map[key].projects.add(e.projectName);
    }

    return {
        columns: [
            { key: 'employeeName', label: 'Employee' },
            { key: 'employeeCode', label: 'Employee ID' },
            { key: 'projects', label: 'Projects' },
            { key: 'totalHours', label: 'Total Hours' },
        ],
        rows: Object.values(map).map(r => ({
            employeeName: r.employeeName,
            employeeCode: r.employeeCode,
            projects: [...r.projects].join(', '),
            totalHours: parseFloat(r.totalHours.toFixed(2)),
        })),
    };
};

const buildProject = (entries) => {
    const map = {};
    for (const e of entries) {
        const key = e.projectId;
        if (!map[key]) {
            map[key] = {
                projectName: e.projectName,
                totalHours: 0,
                employees: new Set(),
                tasks: new Set(),
            };
        }
        map[key].totalHours += parseFloat(e.hours);
        map[key].employees.add(e.employeeName);
        map[key].tasks.add(e.task);
    }

    return {
        columns: [
            { key: 'projectName', label: 'Project' },
            { key: 'employees', label: 'Employees' },
            { key: 'tasks', label: 'Tasks' },
            { key: 'totalHours', label: 'Total Hours' },
        ],
        rows: Object.values(map).map(r => ({
            projectName: r.projectName,
            employees: [...r.employees].join(', '),
            tasks: [...r.tasks].join(', '),
            totalHours: parseFloat(r.totalHours.toFixed(2)),
        })),
    };
};

const buildPendingApprovals = (rows) => ({
    columns: [
        { key: 'employeeName', label: 'Employee' },
        { key: 'employeeCode', label: 'Employee ID' },
        { key: 'weekStart', label: 'Week Start' },
        { key: 'weekEnd', label: 'Week End' },
        { key: 'status', label: 'Status' },
        { key: 'submittedAt', label: 'Submitted At' },
    ],
    rows: rows.map(r => ({
        employeeName: r.employeeName,
        employeeCode: r.employeeCode,
        weekStart: r.weekStart,
        weekEnd: r.weekEnd,
        status: r.status,
        submittedAt: r.submittedAt,
    })),
});

const buildMissingTimesheets = (rows) => ({
    columns: [
        { key: 'employeeName', label: 'Employee' },
        { key: 'employeeCode', label: 'Employee ID' },
    ],
    rows: rows.map(r => ({
        employeeName: r.employeeName,
        employeeCode: r.employeeCode,
    })),
});

const buildUtilization = (entries, dateFrom, dateTo) => {
    const totalDays = daysBetween(dateFrom, dateTo);
    const maxHours = totalDays * 24;
    const map = {};

    for (const e of entries) {
        const key = e.employeeId;
        if (!map[key]) {
            map[key] = {
                employeeName: e.employeeName,
                employeeCode: e.employeeCode,
                loggedHours: 0,
            };
        }
        map[key].loggedHours += parseFloat(e.hours);
    }

    return {
        columns: [
            { key: 'employeeName', label: 'Employee' },
            { key: 'employeeCode', label: 'Employee ID' },
            { key: 'loggedHours', label: 'Logged Hours' },
            { key: 'maxHours', label: 'Max Hours (24/day)' },
            { key: 'utilization', label: 'Utilization %' },
        ],
        rows: Object.values(map).map(r => ({
            employeeName: r.employeeName,
            employeeCode: r.employeeCode,
            loggedHours: parseFloat(r.loggedHours.toFixed(2)),
            maxHours,
            utilization: `${((r.loggedHours / maxHours) * 100).toFixed(1)}%`,
        })),
    };
};

// ─── Generate Report Data ────────────────────────────────────────

const generateReportData = async (reportType, filters) => {
    switch (reportType) {
        case 'DETAILED': {
            const entries = await ReportModel.getEntries(filters);
            return buildDetailed(entries);
        }
        case 'WEEKLY_SUMMARY': {
            const entries = await ReportModel.getEntries(filters);
            return buildWeeklySummary(entries);
        }
        case 'TEAM': {
            const entries = await ReportModel.getEntries(filters);
            return buildTeam(entries);
        }
        case 'PROJECT': {
            const entries = await ReportModel.getEntries(filters);
            return buildProject(entries);
        }
        case 'PENDING_APPROVALS': {
            const rows = await ReportModel.getPendingApprovals(filters);
            return buildPendingApprovals(rows);
        }
        case 'MISSING_TIMESHEETS': {
            const rows = await ReportModel.getMissingTimesheets(filters);
            return buildMissingTimesheets(rows);
        }
        case 'UTILIZATION': {
            const entries = await ReportModel.getEntries(filters);
            return buildUtilization(entries, filters.dateFrom, filters.dateTo);
        }
        default:
            throw new Error(`Unknown reportType: ${reportType}`);
    }
};

// ─── Export Helpers ──────────────────────────────────────────────

const exportToExcel = async (res, columns, rows, reportType) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(reportType);

    // Header row
    sheet.columns = columns.map(col => ({
        header: col.label,
        key: col.key,
        width: 20,
    }));

    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Data rows
    rows.forEach(row => sheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
};

const exportToPdf = (res, columns, rows, reportType) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}_${Date.now()}.pdf`);
    doc.pipe(res);

    // Title
    doc.fontSize(14).font('Helvetica-Bold').text(`${reportType} Report`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1);

    // Table setup
    const colWidth = Math.floor((doc.page.width - 60) / columns.length);
    const rowHeight = 20;
    let x = 30;
    let y = doc.y;

    // Draw header
    doc.font('Helvetica-Bold').fontSize(8);
    columns.forEach(col => {
        doc.rect(x, y, colWidth, rowHeight).fillAndStroke('#4F81BD', '#ffffff');
        doc.fillColor('#ffffff').text(col.label, x + 3, y + 5, { width: colWidth - 6, ellipsis: true });
        x += colWidth;
    });
    y += rowHeight;

    // Draw rows
    doc.font('Helvetica').fontSize(7);
    rows.forEach((row, i) => {
        x = 30;
        const bgColor = i % 2 === 0 ? '#f5f5f5' : '#ffffff';
        columns.forEach(col => {
            doc.rect(x, y, colWidth, rowHeight).fillAndStroke(bgColor, '#cccccc');
            doc.fillColor('#000000').text(String(row[col.key] ?? ''), x + 3, y + 5, { width: colWidth - 6, ellipsis: true });
            x += colWidth;
        });
        y += rowHeight;

        // New page if needed
        if (y > doc.page.height - 50) {
            doc.addPage();
            y = 30;
        }
    });

    doc.end();
};

// ─── Controllers ────────────────────────────────────────────────

const ReportController = {

    // POST /report/generate
    generateReport: async (req, res) => {
        try {
            const { reportType } = req.body;

            if (!reportType) {
                return sendResponse(res, 400, 'reportType is required');
            }

            const validTypes = ['DETAILED', 'WEEKLY_SUMMARY', 'TEAM', 'PROJECT', 'PENDING_APPROVALS', 'MISSING_TIMESHEETS', 'UTILIZATION'];
            if (!validTypes.includes(reportType)) {
                return sendResponse(res, 400, `Invalid reportType. Allowed: ${validTypes.join(', ')}`);
            }

            const filters = buildFilters(req.body, req.user);
            const { columns, rows } = await generateReportData(reportType, filters);

            return sendResponse(res, 200, 'Report generated successfully', { columns, rows });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // GET /report/export?reportType=WEEKLY_SUMMARY&format=excel&dateFrom=&dateTo=&employeeIds=&projectIds=
    exportReport: async (req, res) => {
        try {
            const { reportType, format, dateFrom, dateTo, employeeIds, projectIds } = req.query;

            if (!reportType) return sendResponse(res, 400, 'reportType is required');
            if (!format || !['pdf', 'excel'].includes(format)) return sendResponse(res, 400, 'format must be pdf or excel');

            const validTypes = ['DETAILED', 'WEEKLY_SUMMARY', 'TEAM', 'PROJECT', 'PENDING_APPROVALS', 'MISSING_TIMESHEETS', 'UTILIZATION'];
            if (!validTypes.includes(reportType)) {
                return sendResponse(res, 400, `Invalid reportType. Allowed: ${validTypes.join(', ')}`);
            }

            // Parse filters from query string
            const filters = buildFilters({
                filters: {
                    dateFrom: dateFrom || null,
                    dateTo: dateTo || null,
                    employeeIds: employeeIds ? employeeIds.split(',').map(Number) : [],
                    projectIds: projectIds ? projectIds.split(',').map(Number) : [],
                }
            }, req.user);

            const { columns, rows } = await generateReportData(reportType, filters);

            if (format === 'excel') {
                return await exportToExcel(res, columns, rows, reportType);
            } else {
                return exportToPdf(res, columns, rows, reportType);
            }

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

};

module.exports = ReportController;