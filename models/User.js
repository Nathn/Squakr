const mongoose = require('mongoose');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');
const md5 = require('md5');

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
	verified: {
		type: Boolean,
		default: false
	},
	moderator: {
		type: Boolean,
		default: false
	},
	confirmed: {
		type: Boolean,
		default: false
	}

});

userSchema.plugin(passportLocalMongoose, {
	usernameField: 'email'
});
userSchema.plugin(mongodbErrorHandler);


module.exports = mongoose.model('User', userSchema);
