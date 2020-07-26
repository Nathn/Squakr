const Tweet = require('../models/Tweet');
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
		res.redirect('/?msg=Failed to tweet')
	}
}




// Delete a tweet controller
// Tweet deleting function
const confirmedOwner = (tweet, user) => {
	if (!tweet.author.equals(user._id)) {
		// You don't have permission to delete this.
		throw Error('You don\'t have permission to delete this')
	}
}


exports.deleteTweet = async (req, res) => {
	try {
		const tweet = await Tweet.findOne({
			_id: req.params.id
		});
		if (!req.user.username === 'tamal') {
			confirmedOwner(tweet, req.user);
		}

		const deleteTweet = await Tweet.deleteOne(tweet);
		res.redirect('back')
	} catch (e) {
		console.log(e);
		res.redirect('/?msg=Failed to delete')
	}


}

// Getting a single Tweet
exports.singleTweetPage = async (req, res) => {
	try {
		const tweet = await Tweet.findOne({
			_id: req.params.id
		}).populate('author');
		res.render('single', {
			tweet,
			moment
		});

	} catch (err) {
		console.log(err);
		res.redirect('/?msg=No tweets found')
	}

}
