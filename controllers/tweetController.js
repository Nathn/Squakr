const Tweet = require('../models/Tweet');
const User = require('../models/User');
const Reply = require('../models/Reply');
const moment = require('moment');
moment.locale('fr')

// Home page to list all tweets
exports.postTweet = async (req, res) => {
	try {
		req.body.author = req.user._id;
		const tweet = new Tweet(req.body);
		await tweet.save();
		res.redirect('back');
		// res.json(req.body)


	} catch (e) {
		console.log(e);
		res.redirect('/?msg=squak_failed')
	}
}

exports.postReply = async (req, res) => {
	try {
		req.body.author = req.user._id;
		req.body.squak = req.params.id;
		const reply = new Reply(req.body);
		Tweet.findByIdAndUpdate({
				_id: req.params.id
			}, {
				$inc: {
					replies: 1
				}
			},
			function (err, result) {
				if (err) {
					console.log(err);
				} else {
					console.log(result);
				}
			});
		await reply.save();
		res.redirect('back');


	} catch (e) {
		console.log(e);
		res.redirect('/?msg=squak_failed')
	}
}

exports.gotoReply = async (req, res) => {
	try {
		id = req.params.id;
		res.redirect('/squak/' + id);
	} catch (e) {
		console.log(e);
		res.redirect('/?msg=redirect_failed')
	}
}




// Delete a tweet controller
// Tweet deleting function
const confirmedOwner = (tweet, user) => {
	if (!tweet.author.equals(user._id)) {
		// You don't have permission to delete this.
		throw Error('Vous n\'avez pas assez de permissions pour supprimer ça.')
	}
}


exports.deleteTweet = async (req, res) => {
	try {
		const tweet = await Tweet.findOne({
			_id: req.params.id
		});
		const reply = await Reply.findOne({
			_id: req.params.id
		});
		if (!req.user.moderator) {
			confirmedOwner(tweet, req.user);
		}
		if (reply) {
			Tweet.findByIdAndUpdate({
					_id: reply.squak
				}, {
					$inc: {
						replies: -1
					}
				},
				function (err, result) {
					if (err) {
						console.log(err);
					} else {
						console.log(result);
					}
				});
		}
		const deleteTweet = await Tweet.deleteOne(tweet);
		const deleteReply = await Reply.deleteOne(reply);
		res.redirect('back')
	} catch (e) {
		console.log(e);
		res.redirect('/?msg=delete_failed')
	}


}

// Getting a single Tweet
exports.singleTweetPage = async (req, res) => {
	try {
		const tweet = await Tweet.findOne({
			_id: req.params.id
		}).populate('author');

		const replies = await Reply.find({
			squak: req.params.id
		}).populate('author');

		res.render('single', {
			tweet,
			moment,
			replies
		});

	} catch (err) {
		console.log(err);
		res.redirect('/?msg=no_squaks_found')
	}

}
