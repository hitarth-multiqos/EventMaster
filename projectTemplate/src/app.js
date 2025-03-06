require('dotenv').config('../.env');
require('./connection/db');

const express = require('express');
const app = express();
const fs = require('fs');
const cors = require('cors');
const http = require('http');
const https = require('https');
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const i18n = require('./i18n/i18n');

const { logger } = require('./helpers/loggerService');
const { PORT, IS_SSL, BASE_URL, DB_AUTH_URL, ENVIRONMENT } = require('../config/key');

if (ENVIRONMENT != 'PRODUCTION') {
    morgan.token('body', req => {
        return JSON.stringify(req.body)
    })
    app.use(morgan(':method :url :body'))
}
app.use(morgan('dev'));

// Cors 
app.use(cors({ origin: '*' }));

app.use(bodyParser.json());
// Parse form-data
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false, parameterLimit: 50000 }));

let server
if (IS_SSL == 'true') {

    const options = {
        key: fs.readFileSync('/var/www/ssl/multiqos.com.key'),
        cert: fs.readFileSync('/var/www/ssl/X509.crt'),
        ca: fs.readFileSync('/var/www/ssl/ca-bundle.crt')
    };

    server = https.createServer(options, app);

} else {
    console.log('No -----------IS_SSL')
    server = http.createServer(app)
}

server.listen(PORT, () => {
    console.log('Server listening on port:', PORT);
});

logger.debug('********************************************************************************************************************************************');
logger.debug(`🚀⭐️  PORT: ${PORT}`);
logger.debug(`🚀⭐️  BASEURL: ${BASE_URL}`);
logger.debug(`🚀⭐️  MONGODB URL: ${DB_AUTH_URL}`);
logger.debug(`🚀⭐️  ENV: ${ENVIRONMENT}`);
logger.debug('********************************************************************************************************************************************');

// Language file
app.use(i18n);

app.set('views', path.join(__dirname, './views/emails'))
app.set('view engine', 'ejs');


// Set language and device type in headers globally
app.use((req, res, next) => {
    const language = !req.header('language') ? constants.USER_DEFAULT_LANGUAGE : [constants.LANGUAGE.EN].includes(req.header('language')) ? req.header('language') : constants.USER_DEFAULT_LANGUAGE;
    req.headers['language'] = language;
    const devicetype = !req.header('devicetype') ? constants.DEVICE_TYPE.WEB : [constants.DEVICE_TYPE.WEB, constants.DEVICE_TYPE.APP].includes(req.header('devicetype')) ? req.header('devicetype') : constants.DEVICE_TYPE.WEB;
    req.headers['devicetype'] = devicetype;
    console.log('devicetype', devicetype);
    console.log('language', language);
    next();
})

app.get('/', (req, res) => {
    res.send('Testing from event master');
});

// Api routes
const commonRoute = require('./routes/common.route');
app.use(commonRoute);


// Run default scripts
require('./scripts/defaultScripts').run();

// Public Directory
const publicDirectory = path.join(__dirname, '../');
app.use(express.static(publicDirectory))

// Cronjobs
require('../src/cronjob/index.cron');

// Security
const helmet = require('helmet');
const constants = require('../config/constants');

app.use(helmet());


// Give 404 for rotue that not exists
app.use('*', (req, res, next) => {
    res.status(constants.WEB_STATUS_CODE.NOT_FOUND).json({
        success: 'false',
        message: 'Page not found',
        error: {
            statusCode: constants.WEB_STATUS_CODE.NOT_FOUND,
            message: 'You reached a route that is not defined on this server',
        },
    });
})

module.exports = { app, server };