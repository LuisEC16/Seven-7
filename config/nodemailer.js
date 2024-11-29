const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sevenservices261@gmail.com',
        pass: 'wrdw tfel houa jrkj'
    }
});

module.exports = transporter;
