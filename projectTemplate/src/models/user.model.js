const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dateFormat = require('../helpers/dateFormat.helper');
const constants = require('../../config/constants');
const { JWT_AUTH_TOKEN_SECRET, JWT_EXPIRES_IN, } = require('../../config/key');

const userSchema = new mongoose.Schema({
    userUniqueId: {
        type: String,
        default: `#UID${dateFormat.setCurrentTimestamp()}`,
    },
    firstName: {
        type: String,
        index: true
    },
    lastName: {
        type: String,
        index: true
    },
    email: {
        type: String,
        required: true,
        index: true,
        trim: true,
        lowercase: true
    },
    status: {
        type: Number,
        default: constants.STATUS.ACTIVE,
        index: true
    },
    password: {
        type: String,
    },
    userType: {
        type: String,
        index: true
    },
    otp: {
        type: Number,
        index: false
    },
    otpExpiresAt: {
        type: Number,
    },
    isVerified: {
        type: Boolean,
        default: false,
        index: true
    },
    socialType: {
        type: String,
        enum: ["email", "google", "apple"],
        default: "email",
        index: true
    },
    isSocialUser: {
        type: Boolean,
        default: false,
        index: true
    },
    profileImage: {
        type: String,
        defautl: '',
    },
    userIdentifier: {
        type: String,
    },
    socialId: {
        type: String
    },
    dob: {
        type: Number,
    },
    city: {
        type: mongoose.Types.ObjectId,
        ref: 'city',
        index: true
    },
    bio: {
        type: String,
    },
    language: {
        type: String,
        default: constants.USER_DEFAULT_LANGUAGE,
    },
    mobileNumber: {
        type: String,
    },
    isGuest: {
        type: Boolean,
        default: false
    },
    dateOfJoining: {
        type: Number
    },
    createdAt: {
        type: Number,
        index: true
    },
    updatedAt: {
        type: Number,
        index: false
    },
    deletedAt: {
        type: Number,
        default: null,
        index: true
    }
});


//Checking if password is valid
userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

//Output data to JSON
userSchema.methods.toJSON = function () {
    let user = this;
    let userObject = user.toObject();
    return userObject;
};

//Checking for user credentials
userSchema.statics.findByCredentials = async function (email, password, userType) {

    const user = await User.findOne({
        email: email,
        deletedAt: null,
        userType: userType,
        status: { $ne: constants.STATUS.DELETED }
    });

    if (!user) {
        return 1
    }

    if (user?.isSocialUser) {
        return user.socialType == 'google' ? 3 : 4
    };

    if (user?.isGuest) {
        return 5;
    }

    if (!user.validPassword(password)) {
        return 2
    }
    return user;
}


//Generate auth token
userSchema.methods.generateAuthToken = async function () {
    let user = this;
    let token = jwt.sign({
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
        karmaPoints: user.karmaPoints,
        userType: user.userType,
        language: user.language
    }, JWT_AUTH_TOKEN_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });

    return token;
}


userSchema.pre('save', async function (next) {
    if (!this?.createdAt) {
        this.createdAt = dateFormat.setCurrentTimestamp();
    }
    this.updatedAt = dateFormat.setCurrentTimestamp();
    next();
});

userSchema.pre('findOneAndUpdate', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

userSchema.pre('updateOne', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

userSchema.pre('updateMany', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});


const User = mongoose.model('User', userSchema);
module.exports = User;