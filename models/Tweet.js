const mongoose = require('mongoose');
const tweetSchema = new mongoose.Schema({
	tweet: {
		type: String,
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
	video: {
		type: String,
		trim: true
	},
	likes: {
		type: Number,
		default: 0
	},
	replies: {
		type: Number,
		default: 0
	},
	content: {
		type: String,
		trim: true
	}

});

module.exports = mongoose.model('Tweet', tweetSchema);
