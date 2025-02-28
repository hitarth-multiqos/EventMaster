const fs = require('fs');
const path = require('path');
const moment = require('moment');
const constants = require('../../config/constants');
const CronJob = require('cron').CronJob;

// 0 */5 * * *
const job = new CronJob(
    '0 */5 * * *',
    async () => {
        console.log(job.taskRunning, 'job.taskRunning from removeOldData cron');
        if (job.taskRunning) {
            return
        }

        job.taskRunning = true;
        try {
            console.log('Running removeOldData cron job');
            deleteOldDataCron();

        } catch (error) {
            console.log('error in removeOldData Cron', error);
            // Handle error
        }
        job.taskRunning = false;
    },
    null,
    true,
    'Asia/Kolkata'
)

const deleteOldDataCron = async () => {
    try {

        console.log('Running removeOldData Cron');

        const videoThumbnailPreviewData = 'public/uploads/videoThumbnailPreview';

        const directories = [
            videoThumbnailPreviewData
        ];

        for (const directory of directories) {

            //If folder exists then clear files from that folder
            if (fs.existsSync(directory)) {

                fs.readdir(directory, (err, files) => {
                    if (err) throw err;

                    for (const file of files) {
                        console.log(file, `removed at ${moment().format('DD-MM-YYYY HH:mm:ss A')}`);

                        fs.unlink(path.join(directory, file), (err) => {
                            if (err) throw err;
                        });
                    }
                });
            } else {
                console.log('No Folder Found');
            }
        }
    } catch (error) {
        console.log('error in removeFilesCron ', error);
    }
};