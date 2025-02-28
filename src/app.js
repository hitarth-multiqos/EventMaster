require('dotenv').config('../.env');

const express = require('express');
const app = express();
const fs = require('fs');
const cors = require('cors');
const http = require('http');
const path = require('path');
const https = require('https');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const i18n = require('./i18n/i18n');
const { logger } = require('./helpers/loggerService');
const { PORT, IS_SSL, BASE_URL, ENVIRONMENT } = require('../config/key');
const constants = require('../config/constants');

if (ENVIRONMENT != 'PRODUCTION') {
    morgan.token('body', req => {
        return JSON.stringify(req.body)
    })
    app.use(morgan(':method :url :body'))
}
app.use(morgan('dev'));

// Cors 
app.use(cors({ origin: '*' }));

// Parse form-data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false, parameterLimit: 50000 }));


let server
let serverSSl
if (IS_SSL == 'true') {

    const options = {
        key: fs.readFileSync('/var/www/ssl/multiqos.com.key'),
        cert: fs.readFileSync('/var/www/ssl/X509.crt'),
        ca: fs.readFileSync('/var/www/ssl/ca-bundle.crt')
    };

    serverSSl = https.createServer(options, app);

    serverSSl.listen(PORT, () => {
        console.log('Server listening on port:', PORT)
    })

} else {
    console.log('No -----------IS_SSL')
    server = http.createServer(app)
    server.listen(PORT, () => {
        console.log('Server listening on port:', PORT)
    })
}

logger.debug('********************************************************************************************************************************************');
logger.debug(`🚀⭐️  PORT: ${PORT}`);
logger.debug(`🚀⭐️  BASEURL: ${BASE_URL}`);
logger.debug(`🚀⭐️  ENV: ${ENVIRONMENT}`);
logger.debug('********************************************************************************************************************************************');

// Language file
app.use(i18n);

app.get('/', (req, res) => {
    res.send('Testing from event master');
});

// Api routes
const commonRoute = require('./routes/common.route');
app.use(commonRoute);

// Public Directory
const publicDirectory = path.join(__dirname, '../');
app.use(express.static(publicDirectory))

// Security
const helmet = require('helmet');
app.use(helmet());

// Give 404 for rotue that not exists
app.use('*', (req, res, next) => {
    res.status(constants.WEB_STATUS_CODE.NOTFOUND).json({
        success: 'false',
        message: 'Page not found',
        error: {
            statusCode: constants.WEB_STATUS_CODE.NOTFOUND,
            message: 'You reached a route that is not defined on this server',
        },
    });
})