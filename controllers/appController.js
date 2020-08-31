const Tweet = require('../models/Tweet');
const User = require('../models/User');
const Reply = require('../models/Reply');
const moment = require('moment');
moment.locale('fr')

// The default controller for this app
// The home page
exports.indexPage = async (req, res) => {
	try {
		if (req.user && req.user.lang == "en") {
			moment.locale('en')
		} else {
			moment.locale('fr')
		}

		if (req.user) {
			if (!req.user.following.map(obj => obj.toString()).includes(req.user._id.toString())) {
				await User.findByIdAndUpdate(
					req.user._id, {
						'$addToSet': {
							following: req.user._id
						}
					}, {
						new: true
					}
				);
			}

			var following = req.user.following.map(obj => obj.toString());

			var squaks = await Tweet.find({
					author: following
				})
				.populate('author')
				.limit(500)
				.sort({
					created: 'desc'
				});

			var likedsquaks = await Tweet.find({
					author: following
				})
				.populate('author')
				.limit(500)
				.sort({
					created: 'desc'
				});

			var profiles = await User.find({
					_id: {
						"$nin": following
					}
				})
				.limit(3)
				.sort({
					likes: -1,
					verified: -1
				});
		} else {
			var squaks = await Tweet.find()
				.populate('author')
				.limit(500)
				.sort({
					created: 'desc'
				});
		}
		res.render('index', {
			squaks,
			profiles,
			moment
		});

	} catch (e) {
		console.log(e);
		res.redirect('/error')
	}

}
