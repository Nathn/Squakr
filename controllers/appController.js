const Tweet = require('../models/Tweet');
const moment = require('moment');
moment.locale('fr')

// The default controller for this app
// The home page
exports.indexPage = async (req, res) => {
	try {
		const squaks = await Tweet.find({
				lang: 'fr'
			})
			.populate('author')
			.limit(50)
			.sort({
				created: 'desc'
			});
		res.render('index', {
			squaks,
			moment
		});

	} catch (e) {
		console.log(e);
		res.redirect('/error')
	}

}

// Getting the account page
