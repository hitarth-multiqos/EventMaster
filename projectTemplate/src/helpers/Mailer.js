const nodemailer = require('nodemailer');
const {
    SENDER_EMAIL,
    SENDER_PASSWORD,
    EMAIL_SERVICE,
    EMAIL_PORT
} = require('../../config/key');
const constants = require('../../config/constants');


let mailConfig;

mailConfig = {
    host: EMAIL_SERVICE,
    port: EMAIL_PORT,
    auth: {
        user: SENDER_EMAIL,
        pass: SENDER_PASSWORD,
    },
    secure: false,
    debug: true,
    tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
    }
};

const sendEmail = async (email, emailBody, subject) => {
    try {

        const transporter = nodemailer.createTransport(mailConfig);

        transporter.verify(function (error, success) {
            if (error) {
                console.log('Error in transporter', error);
            } else {
                console.log("Server is ready to take our messages");
            }
        });

        let mailData = {
            from: {
                name: constants.EMAIL_FROM,
                address: SENDER_EMAIL,
            },
            to: email,
            subject: subject,
            html: emailBody,
        };
        transporter.sendMail(mailData);

        console.log('Email has been sent successfully to ' + ' ' + email);
        return true;

    } catch (err) {
        console.log('Error(sendEmail)', err);
        return false;
    }
};

const sendAdminEmail = async (email, emailBody, subject, userName) => {
    try {
        const transporter = nodemailer.createTransport(mailConfig);

        transporter.verify(function (error, success) {
            if (error) {
                console.log('Error in admin mailer transporter', error);
            } else {
                console.log("Server is ready to take our messages");
            }
        });

        let mailData = {
            from: {
                name: userName,
                address: SENDER_EMAIL,
            },
            to: email,
            subject: subject,
            html: emailBody,
        };
        transporter.sendMail(mailData);
        console.log('Email has been sent successfully to ' + ' ' + email);
        return true;

    } catch (err) {
        console.log('Error(sendAdminEmail)', err);
        return false;
    }
};


module.exports = { sendAdminEmail, sendEmail };