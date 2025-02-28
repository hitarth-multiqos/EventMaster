const fs = require('fs');
const path = require('path');
const moment = require('moment');
const CronJob = require('cron').CronJob;
const Events = require('../models/event.model');

// 30 23 * * *
const job = new CronJob(
    '30 23 * * *',
    async () => {
        console.log(job.taskRunning, 'job.taskRunning from remove deleted events files cron');
        if (job.taskRunning) {
            return
        }

        job.taskRunning = true
        try {
            console.log('Running remove deleted events files cron job');
            // removeDeletedEventsDataCron();
            deleteEventImages();
            deleteEventVideo();
            // deleteEventThumbnail();

        } catch (error) {
            console.log('error in remove deleted events files cron', error);
            // Handle error
        }
        job.taskRunning = false
    },
    null,
    true,
    'Asia/Kolkata'
)


const deleteEventFiles = async (filePath) => {
    try {
        let pathToFile = path.join(__dirname, filePath);
        if (fs.existsSync(pathToFile)) {
            fs.unlinkSync(pathToFile);
            console.log(path.basename(pathToFile), `removed at ${moment().format('DD-MM-YYYY HH:mm:ss A')}`);
        } else {
            console.log('File not found on this path', pathToFile);
        }
    } catch (err) {
        console.log('Error:(deleteEventFiles): ', err);
    }
}

const deleteEventImages = async () => {
    try {
        console.log('<------------------    Running remove deleted events images Cron    ------------------>');

        const eventImagesFolder = '../../public/uploads/eventsImage';

        let query = [
            { $match: { 'images.0': { $exists: true } } },
            {
                $unwind: {
                    path: '$images',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: '$images',
                    totalCount: { $sum: 1 },
                    deletedStatus: { $push: '$deletedAt' }
                }
            },
            { $sort: { totalCount: -1 } },
            { $match: { deletedStatus: { $ne: null } } }
        ];

        let imagesToBeDeleted = await Events.aggregate(query);

        imagesToBeDeleted = imagesToBeDeleted.map(x => {
            (x?._id) && deleteEventFiles(`${eventImagesFolder}/${x._id}`)
        })
    } catch (err) {
        console.log('Error(deleteEventImages)', err);
        throw err;
    }
}

const deleteEventVideo = async () => {
    try {
        console.log('<------------------    Running remove deleted events video Cron    ------------------>');

        const eventsVideoFolder = '../../public/uploads/eventsVideo';
        const eventsThumbnailFolder = '../../public/uploads/eventThumbnails';

        let query = [
            { $match: { video: { $ne: '' } } },
            {
                $group: {
                    _id: '$video',
                    totalCount: { $sum: 1 },
                    deletedStatus: { $push: '$deletedAt' }
                }
            },
            { $sort: { totalCount: -1 } },
            { $match: { deletedStatus: { $ne: null } } }
        ];

        let videoToBeDeleted = await Events.aggregate(query);

        videoToBeDeleted = videoToBeDeleted.map(x => {
            if (x?._id) {
                deleteEventFiles(`${eventsVideoFolder}/${x._id}`)
                deleteEventFiles(`${eventsThumbnailFolder}/${x._id.replace('.mp4', '.png')}`)
            }
        })
    } catch (err) {
        console.log('Error(deleteEventVideo)', err);
        throw err;
    }
}


const deleteEventThumbnail = async () => {
    try {
        console.log('<------------------    Running remove deleted events thumbnail Cron    ------------------>');

        const eventsThumbnailFolder = '../../public/uploads/eventThumbnails';

        let query = [
            {
                '$match': {
                    'deletedAt': {
                        '$ne': null
                    },
                    'thumbnail': {
                        '$exists': true
                    }
                }
            }, {
                '$project': {
                    'thumbnail': 1
                }
            }, {
                '$group': {
                    '_id': '$thumbnail',
                    'count': {
                        '$sum': 1
                    }
                }
            }, {
                '$match': {
                    'count': 1
                }
            }
        ]

        let thumbnailToBeDeleted = await Events.aggregate(query);

        thumbnailToBeDeleted = thumbnailToBeDeleted.map(x => {
            (x?._id) && deleteEventFiles(`${eventsThumbnailFolder}/${x._id}`)
        });

    } catch (err) {
        console.log('Error(deleteEventThumbnail)', err);
        throw err;
    }
}