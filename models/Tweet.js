const mongoose = require('mongoose');
const tweetSchema = new mongoose.Schema({
	tweet: {
		type: String,
		required: true,
		trim: true
	},
	created: {
		type: Date,
		default: Date.now
	},
	author: {
		type: mongoose.Schema.ObjectId,
		ref: 'User'
	},
	image: {
		type: String,
		trim: true
	},
	lang: {
		type: String,
		default: 'fr'
	}

});

module.exports = mongoose.model('Tweet', tweetSchema);
