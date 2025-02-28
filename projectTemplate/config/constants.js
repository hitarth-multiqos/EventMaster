module.exports = {

    WEB_STATUS_CODE: {
        OK: 200,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        SERVER_ERROR: 500,
        MAINTENANCE: 503
    },

    META_STATUS: {
        DATA: 1,                            // When there is success response from api
        NO_DATA: 0                          // When there is no data found in api  // Not when there is no response data in api response
    },

    PAGE: 1,
    LIMIT: 10,

    STATUS: {
        ACTIVE: 1,
        INACTIVE: 2,
        DELETED: 3
    },

    USER_TYPE: {
        ORGANIZER: 'organizer',
        END_USER: 'user'
    },

    DEVICE_TYPE: {
        APP: "app",
        WEB: "web",
    },

    USER_ROLE: {
        ORGANIZER: 'organiser',
        END_USER: 'end-user',
    },

    EVENT_STATUS: {
        IN_REVIEW: 'in-review',
        ACTIVE: 'active',
        REJECTED: 'rejected',
        INACTIVE: 'inactive'
    },

    DISCOUNT_TYPE: {
        FLAT: 'flat',
        PERCENT: 'percent',
    },

    EVENTS_IMAGE_UPLOAD_PATH_LOCAL: 'public/uploads/eventsImage',
    EVENTS_VIDEO_UPLOAD_PATH_LOCAL: 'public/uploads/eventsVideo',
    USER_PROFILE_IMAGE_UPLOAD_PATH_LOCAL: 'public/uploads/user',
    EVENT_THUMBNAIL_PREVIEW_UPLOAD_PATH_LOCAL: 'public/uploads/videoThumbnailPreview',

    OTP_EXPIRE_TIME: 15,
    USER_DEFAULT_LANGUAGE: 'en',

    EVENT_TYPE: {
        ONLINE: 'online',
        OFFLINE: 'offline'
    },

    LANGUAGE: {
        EN: 'en'
    },

    EMAIL_FROM:'Event Management'
}   