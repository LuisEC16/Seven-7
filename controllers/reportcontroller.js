const { db } = require('../config/database');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');

const renderReportsPage = (req, res) => {
    res.render('admin/reports', { error: req.flash('error'), message: req.flash('message') });
};

const generateReport = async (req, res, next) => {
    const { reportType, startDate, endDate } = req.body;

    let query;
    if (reportType === 'payments') {
        query = `
            SELECT c.ID_Comprobante, c.Fecha, c.Total, c.Numero_Telefonico, c.pago, c.Estado, u.Nombre_Apellido AS Usuario
            FROM comprobante c
            JOIN usuarios u ON c.Usuario_ID = u.ID
            WHERE c.Fecha BETWEEN ? AND ?
            ORDER BY c.Fecha
        `;
    } else if (reportType === 'users') {
        query = `
            SELECT ID, Nombre_Apellido, Email, Direccion, Fecha
            FROM usuarios
            WHERE Fecha BETWEEN ? AND ?
            ORDER BY Fecha
        `;
    }

    db.query(query, [startDate, endDate], async (err, results) => {
        if (err) {
            req.flash('error', 'Error al generar el reporte');
            return res.redirect('/admin/reports');
        }

        let html;
        if (reportType === 'payments') {
            // Agrupar resultados por estado
            const realizadas = results.filter(row => row.Estado === 'Finalizada');
            const rechazadas = results.filter(row => row.Estado === 'Rechazada');
            const enProceso = results.filter(row => row.Estado === 'En proceso');

            // Calcular el total de "realizadas"
            const totalRealizadas = realizadas.reduce((acc, row) => acc + parseFloat(row.Total), 0);

            // Renderizar la plantilla HTML para el PDF
            const templatePath = path.join(__dirname, '..', 'views', 'report-template.ejs');
            const logoPath = path.join(__dirname, '..', 'public', 'logoreporte.png');
            const logoBase64 = fs.readFileSync(logoPath, 'base64');
            html = await ejs.renderFile(templatePath, {
                reportType,
                startDate,
                endDate,
                realizadas,
                rechazadas,
                enProceso,
                totalRealizadas,
                logoBase64
            });
        } else if (reportType === 'users') {
            // Renderizar la plantilla HTML para el PDF
            const templatePath = path.join(__dirname, '..', 'views', 'users-report-template.ejs');
            const logoPath = path.join(__dirname, '..', 'public', 'logoreporte.png');
            const logoBase64 = fs.readFileSync(logoPath, 'base64');
            html = await ejs.renderFile(templatePath, {
                reportType,
                startDate,
                endDate,
                users: results,
                logoBase64
            });
        }

        // Configurar Puppeteer para generar el PDF
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'domcontentloaded' });
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
            timeout: 60000,
        });

        await browser.close();

        res.setHeader('Content-disposition', `attachment; filename=${reportType}-report.pdf`);
        res.setHeader('Content-type', 'application/pdf');
        res.send(pdf);
    });
};

module.exports = {
    renderReportsPage,
    generateReport
};
