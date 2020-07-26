const nweet = require('../models/nweet');
const moment = require('moment');
moment.locale('fr')

// The default controller for this app
// The home page
exports.indexPage = async (req, res) => {
	try {
		const nweets = await nweet.find({})
			.populate('author')
			.limit(50)
			.sort({
				created: 'desc'
			});
		res.render('index', {
			nweets,
			moment
		});

	} catch (e) {
		console.log(e);
		res.redirect('/error')
	}

}

// Getting the account page
