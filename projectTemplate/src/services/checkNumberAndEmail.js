const User = require('../models/user.model')

module.exports = {
    checkEmailAndNumber: async (email, number) => {
        try {
            // check if email is already in use
            const userWithEmail = await User.findOne({ email: email, deletedAt: null , isGuest : false });
            if (userWithEmail) return { error: 'emailAlreadyExist' };

            // if email is available then return success
            return { success: true };
        } catch (err) {
            console.log('Error(checkEmailAndNumber)', err);
        }
    }
};
