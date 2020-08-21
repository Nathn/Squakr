const mongoose = require('mongoose');
const replySchema = new mongoose.Schema({
	reply: {
		type: String,
		required: true,
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
	}

});

module.exports = mongoose.model('Reply', replySchema);
