const mongoose = require('mongoose');
const replySchema = new mongoose.Schema({
	shortid: {
		type: String,
		trim: true,
		required: true,
		unique: true,
	},
	reply: {
		type: String,
		trim: true
	},
	created: {
		type: Date,
		default: Date.now
	},
	squak: {
		type: mongoose.Schema.ObjectId,
		ref: 'Tweet'
	},
	author: {
		type: mongoose.Schema.ObjectId,
		ref: 'User'
	},
	likes: {
		type: Number,
		default: 0
	},
	content: {
		type: String,
		trim: true
	},
	replies: {
		type: Number,
		default: 0
	},
	reports: {
		type: Number,
		default: 0
	},
	image: {
		type: String,
		trim: true
	},
	video: {
		type: String,
		trim: true
	}

});

module.exports = mongoose.model('Reply', replySchema);
