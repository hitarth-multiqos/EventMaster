module.exports = {
    setLocale: (req, res, next) => {
        const lang = req.header('language');
        if (lang) {
            req.setLocale(lang);
        }
        next();
    }
};
