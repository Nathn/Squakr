const Tweet = require('../models/Tweet');
const moment = require('moment');
moment.locale('fr')

// The default controller for this app
// The home page
exports.indexPage = async (req, res) => {
	try {
		if (req.user && req.user.lang == "en") {
			moment.locale('en')
		}
		var lang = '';
		if (req.user && req.user.contentlang == 'en') {
			lang = 'en'
		} else {
			lang = 'fr'
		}
		const squaks = await Tweet.find({
				lang: lang
			})
			.populate('author')
			.limit(500)
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
