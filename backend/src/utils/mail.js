const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const composeVerifyMail = (user, url) => {
    try {
        let mailHtml = fs.readFileSync(path.join(process.cwd(), './src/public/verifyMail.html'), 'utf8');
        const replacements = {
            '{{FULLNAME}}': user.fullName,
            '{{USERNAME}}': user.gmail,
            '{{LINK}}': url
        };

        for (const [key, value] of Object.entries(replacements)) {
            mailHtml = mailHtml.replace(new RegExp(key, 'g'), value);
        }

        return { mailRecipient: user.gmail, subject: 'LOGIN VERIFICATION EMAIL', content: mailHtml };
    } catch (error) {
        console.log(error.message);
        throw new Error('Fail to generate Verify Mail');
    }
}

const sendEmail = async (mailRecipient, subject, content) => {
    const mailOptions = {
        from: `Eranin Requirement <${process.env.EMAIL_USER}>`,
        to: mailRecipient,
        subject: subject,
        html: content
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log(error.message);
        throw new Error('Fail to send mail');
    }
};


module.exports = { sendEmail, composeVerifyMail };