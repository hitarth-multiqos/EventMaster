require('dotenv').config();

let key = (process.env.ENVIRONMENT)?.toUpperCase();

module.exports = {
	PORT: key == 'PRODUCTION' ? process.env.PORT_PROD : key == 'DEV' ? process.env.PORT_DEV : process.env.PORT_LOCAL,
	IMAGE_LINK: key == 'PRODUCTION' ? process.env.IMAGE_LINK_PROD : key == 'DEV' ? process.env.IMAGE_LINK_DEV : process.env.IMAGE_LINK_LOCAL,
	BASE_URL: key == 'PRODUCTION' ? process.env.BASE_URL_PROD : key == 'DEV' ? process.env.BASE_URL_DEV : process.env.BASE_URL_LOCAL,
	IS_SSL: process.env.IS_SSL,
	ENVIRONMENT: process.env.ENVIRONMENT,
}
