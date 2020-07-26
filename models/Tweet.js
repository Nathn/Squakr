const mongoose = require('mongoose');
const nweetSchema = new mongoose.Schema({
	nweet: {
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
	}
});

module.exports = mongoose.model('nweet', nweetSchema);
