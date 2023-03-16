const mongoose = require('mongoose');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		trim: true,
		required: true,
		unique: true,
		lowercase: true
	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		validate: [validator.isEmail, 'Invalid email']
	},
	resetPasswordToken: String,
	name: String,
	avatar: String,
	banner: String,
	bio: {
		type: String,
		trim: true
	},
	website: String,
	created: {
		type: Date,
		default: Date.now
	},
	hearts: [{
		type: mongoose.Schema.ObjectId,
		ref: 'Tweet'
	}],
	likes: {
		type: Number,
		default: 0
	},
	verified: {
		type: Boolean,
		default: false
	},
	moderator: {
		type: Boolean,
		default: false
	},
	developer: {
		type: Boolean,
		default: false
	},
	confirmed: {
		type: Boolean,
		default: false
	},
	suggestions: {
		type: Boolean,
		default: true
	},
	devmode: {
		type: Boolean,
		default: false
	},
	darkmode: {
		type: Boolean,
		default: false
	},
	lang: {
		type: String,
		default: 'fr'
	},
	following: [{
		type: mongoose.Schema.ObjectId,
		ref: 'User'
	}],
	followers: [{
		type: mongoose.Schema.ObjectId,
		ref: 'User'
	}],
	pinned: {
		type: mongoose.Schema.ObjectId,
		ref: 'Tweet'
	},
	notifications: [{
		txt: {
			type: String
		},
		txten: {
			type: String
		},
		url: {
			type: String
		},
		author: {
			type: mongoose.Schema.ObjectId,
			ref: 'User'
		},
		date: {
			type: Date,
			default: Date.now
		}
	}],
	readnotifications: [{
		txt: {
			type: String
		},
		txten: {
			type: String
		},
		url: {
			type: String
		},
		author: {
			type: mongoose.Schema.ObjectId,
			ref: 'User'
		},
		date: {
			type: Date,
			default: Date.now
		}
	}]
});

userSchema.plugin(passportLocalMongoose, {
	usernameField: 'email'
});
userSchema.plugin(mongodbErrorHandler);


module.exports = mongoose.model('User', userSchema);
