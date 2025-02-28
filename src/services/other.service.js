const { toUpperCase } = require("../helpers/helper");

exports.generatePackageJSON = (projectTitle) => `{
    "name": "${projectTitle}",
    "version": "1.0.0",
    "main": "src/app.js",
    "scripts": {
    "dev": "node src/app.js",
    "deps": "node dependencies.js"
    },
    "keywords": [],
    "author": "",
    "license": "ISC",
    "description": ""
    }`;

exports.generateENV = (projectTitle) => `ENVIRONMENT = local
IS_SSL = false

#LOCAL ENVIRONMENT
DB_AUTH_URL_LOCAL = "mongodb://localhost:27017/${projectTitle}"
PORT_LOCAL = 3000
JWT_AUTH_TOKEN_SECRET_LOCAL = ""
JWT_EXPIRES_IN_LOCAL = "1d"
BASE_URL_LOCAL = 'http://localhost:3000'
IMAGE_LINK_LOCAL = 'http://localhost:3000/public/uploads/'
WEB_URL_LOCAL = ''
SENDER_EMAIL_LOCAL = ''
SENDER_PASSWORD_LOCAL = ''
EMAIL_SERVICE_LOCAL = ''
EMAIL_PORT_LOCAL = ""`

exports.generateREADME = (projectTitle) => `# ${toUpperCase(projectTitle)}
This is a Node.js project.

1. Install dependencies:
npm run deps

2. Run project:
npm run dev
`
exports.generateDependencies = () => "const {exec} = require('child_process');\nexec('npm i @ffmpeg-installer/ffmpeg @ffprobe-installer/ffprobe bcryptjs body-parser cors cron dotenv ejs express ffmpeg fluent-ffmpeg helmet i18n joi joi-objectid jsonwebtoken moment mongoose morgan multer nodemailer sharp winston')"