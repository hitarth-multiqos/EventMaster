const helper = require('../helpers/helper');
const dateFormat = require('../helpers/dateFormat.helper');

const eventTransformer = (data) => {

    data = JSON.parse(JSON.stringify(data));

    let obj = {
        eventId: data?._id ? data._id : '',
        userId: data?.userId ? data.userId : '',
        title: data?.title ? data.title : '',
        description: data?.description ? data.description : '',
        eventType: data?.eventType ? data.eventType : '',
        language: data?.language ? data.language : [],
        startTime: data?.startTime ? data.startTime?.toString() : '',
        endTime: data?.endTime ? data.endTime?.toString() : '',
        eventDuration: data?.eventDuration ? dateFormat.getDiffBetweenToDatesAsHumanFormat(obj.eventStartTime, obj.eventEndTime) : '',
        price: data?.price ? data?.price : 0,
        currency: data?.currency ? data?.currency : '',
        images: data?.images ? data?.images : [],
        video: data?.video ? data?.video : '',
        status: data?.status ? data.status : 0,
        totalTickets: data?.totalTickets ? data.totalTickets : 0,
        venue: data?.venue ? data.venue : '',
        city: data?.city ? data.city : '',
        link: data?.link ? data.link : '',
        createdAt: data?.createdAt ? data.createdAt : 0,
        updatedAt: data?.updatedAt ? data.updatedAt : 0,
    };

    let eventImages = data?.images.map(x => helper.imageURL(x, 'eventsImage'));

    obj.images = [...eventImages];
    obj.video = data?.video ? helper.imageURL(data.video, 'eventsVideo') : '';
    obj.thumbnail = data?.thumbnail ? helper.imageURL(data.thumbnail, 'eventThumbnails') : '';

    obj.media = [];
    if (eventImages.length) {
        for (let i = 0; i < eventImages.length; i++) {
            let eachEventImage = eventImages[i];
            obj.media.push({ type: 'image', imageUrl: eachEventImage || '', videoUrl: '' })
        }
    }

    obj?.video && obj.media.push({ type: 'video', imageUrl: obj?.thumbnail || '', videoUrl: obj?.video || '' });

    delete obj?.images;
    delete obj?.video;

    return obj;
};

const listEventTransformer = (arrayData) => {
    let responseData = [];

    if (arrayData.length) {
        responseData = arrayData.map(x => eventTransformer(x));
    }
    return responseData;
};


const eventViewTransformer = (arrayData) => {
    let responseData = null;
    if (arrayData) {
        responseData = eventTransformer(arrayData);
    }
    return responseData;
};

const endUserEventTransformer = (data) => {

    data = JSON.parse(JSON.stringify(data));
    let currentTimestamp = dateFormat.setCurrentTimestamp();

    let obj = {
        eventId: data?._id ? data._id : '',
        userId: data?.userId ? data.userId : '',
        title: data?.title ? data.title : '',
        description: data?.description ? data.description : '',
        eventType: data?.eventType ? data.eventType : '',
        language: data?.language ? data.language : [],
        startTime: data?.startTime ? data.startTime.toString() : '',
        endTime: data?.endTime ? data.endTime.toString() : '',
        eventDuration: data?.startTime && data?.endTime ? dateFormat.getDiffBetweenToDatesAsHumanFormat(data.startTime, data.endTime,'x') : '',
        price: data?.price ? data?.price : 0,
        currency: data?.currency ? data?.currency : '',
        images: data?.images ? data?.images : [],
        video: data?.video ? data?.video : '',
        status: data?.status ? data.status : 0,
        totalTickets: data?.totalTickets ? data.totalTickets : 0,
        venue: data?.venue ? data.venue : '',
        city: data?.city ? data.city : {},
        link: data?.link ? data.link : '',
        isOngoing: data?.isOngoing ? data.isOngoing : false,
        user: data?.userId ? data.userId : {},
        slug: data?.slug || '',
    };

    let eventImages = data?.images ? data?.images.map(x => helper.imageURL(x, 'eventsImage')) : [];

    obj.images = eventImages?.length ? [...eventImages] : [];
    obj.video = data?.video ? helper.imageURL(data.video, 'eventsVideo') : '';
    obj.thumbnail = data?.thumbnail ? helper.imageURL(data.thumbnail, 'eventThumbnails') : '';
    obj.user.profileImage = obj?.user?.profileImage ? helper.imageURL(obj.user.profileImage, 'user') : '';

    obj.allTicketsSoldOut = data?.totalTickets <= 0 ? true : false;

    obj.media = [];
    if (eventImages.length) {
        for (let i = 0; i < eventImages.length; i++) {
            let eachEventImage = eventImages[i];
            obj.media.push({ type: 'image', imageUrl: eachEventImage || '', videoUrl: '' })
        }
    }

    obj?.video && obj.media.push({ type: 'video', imageUrl: obj?.thumbnail || '', videoUrl: obj?.video || '' });
    obj.userId = obj?.user?._id ? obj?.user._id : '';
    obj.isFree = obj?.price > 0 ? false : true;

    if (obj?.startTime && +obj.startTime > +dateFormat.setCurrentTimestamp()) {
        obj.isUpcoming = true;
    } else {
        obj.isUpcoming = false;
    }

    obj.canBeBooked = true;
    if (obj?.startTime && obj.startTime < currentTimestamp) {
        obj.canBeBooked = false;
    }

    delete obj?.images;
    delete obj?.video;

    return obj;
};


const eventEndUserViewTransformer = (arrayData, language = 'en') => {
    let responseData = null;
    if (arrayData) {
        responseData = endUserEventTransformer(arrayData, language);
    }
    return responseData;
};

const endUserListEventTransform = (arrayData) => {
    let responseData = [];

    if (arrayData.length) {
        responseData = arrayData.map(x => endUserEventTransformer(x));
    }
    return responseData;
};


module.exports = {
    eventViewTransformer,
    listEventTransformer,
    eventEndUserViewTransformer,
    endUserListEventTransform,
};