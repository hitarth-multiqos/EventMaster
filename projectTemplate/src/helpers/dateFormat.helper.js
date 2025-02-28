const moment = require('moment');

exports.setCurrentTimestamp = () => moment().format('x');

exports.addTimeToCurrentTimestamp = (number, unit) => moment().add(number, unit).format('x');

exports.getDateAndTimeFromTimestamp = (timestamp, format, language = 'en') => {
    moment.locale(language);
    return moment(timestamp, 'x').format(format);
};

exports.getTimestamp = (time, format) => moment(time, format).format('x');

exports.startOfToday = (format) => moment().startOf('d').format(format);
exports.endOfToday = (format) => moment().endOf('d').format(format);

exports.getStartOfDate = (time, format) => moment(time, format).startOf('d').format(format);
exports.getEndOfDate = (time, format) => moment(time, format).endOf('d').format(format);

exports.getStartOf = (unit, format) => moment().startOf(unit).format(format);
exports.getEndOf = (unit, format) => moment().endOf(unit).format(format);

exports.getDiffBetweenToDates = (startDate, endDate, durationAs = 'seconds') => {
    let dateDiff = moment.duration(moment(endDate, 'x').diff(moment(startDate, 'x')), durationAs);
    return Math.round(dateDiff);
};

exports.getDiffBetweenToDatesAsHumanFormat = (startDate, endDate, format = 'DD-MM-YYYY HH:mm') => {
    try {
        const start = moment(startDate, format);
        const end = moment(endDate, format);

        const duration = moment.duration(end.diff(start));

        const days = Math.floor(duration.asDays()); // Full days
        const hours = Math.floor(duration.asHours() % 24); // Remaining hours
        const minutes = Math.floor(duration.asMinutes() % 60); // Remaining minutes

        let result = [];
        if (days >= 1) {
            result.push(`${days} day${days > 1 ? 's' : ''}`);
        }

        if (hours > 0) result.push(`${hours} hr${hours > 1 ? 's' : ''}`);
        if (minutes > 0) result.push(`${minutes} min${minutes > 1 ? 's' : ''}`);

        return result.join(', ');
    } catch (err) {
        console.log(`Error(getDiffBetweenToDatesAsHumanFormat)`, err);
        return null;
    }
};