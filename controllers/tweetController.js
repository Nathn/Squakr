const Tweet = require('../models/Tweet');
const User = require('../models/User');
const Reply = require('../models/Reply');
const moment = require('moment');

function html(str) {
	var replacedText, replacePattern1, replacePattern2, replacePattern3, replacePattern4, replacePattern5;

	//URLs starting with http://, https://, or ftp://
	replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
	replacedText = str.replace(replacePattern1, '<a href="$1" target="_blank" style="text-decoration: none; color: #32567d;">$1</a>');

	//URLs starting with "www." (without // before it, or it'd re-link the ones done above).
	replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
	replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank" style="text-decoration: none; color: #32567d;">$2</a>');

	replacePattern3 = /\*\*([^]+)\*\*/gim;
	replacedText = replacedText.replace(replacePattern3, '<b>$1</b>')

	replacePattern4 = /\*([^*]+)\*/gim;
	replacedText = replacedText.replace(replacePattern4, '<i>$1</i>')

	replacePattern5 = /\`([^`]+)\`/gim;
	replacedText = replacedText.replace(replacePattern5, '<code>$1</code>')

	const content = replacedText.replace(/\B\@([\w\-]+)/gim, function (match, name) {
		post = `<a href="/${name}" style="text-decoration: none; color: #007bff;">${match}</a>`;
		return post;
	})
	return content
}


// Home page to list all tweets
exports.postTweet = async (req, res) => {
	try {
		req.body.author = req.user._id;
		req.body.lang = req.user.contentlang;
		req.body.content = html(req.body.tweet.replace(/\</g, "&lt;").replace(/\>/g, "&gt;"))
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
		req.body.content = html(req.body.reply)
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
const confirmedOwner = (squak, user, backURL) => {
	if (!squak.author.equals(user._id)) {
		throw Error('Vous n\'avez pas assez de permissions pour supprimer ça.')
		if (!backURL.endsWith('err=402')) return res.redirect(`${backURL}?err=402`)
		return res.redirect(`${backURL}`)
	}
}


exports.deleteTweet = async (req, res) => {
	try {
		backURL = req.header('Referer') || '/';
		if (!req.query.query && !backURL.endsWith('err=402')) return res.redirect(`${backURL}?err=402`)

		const squak = await Tweet.findOne({
			_id: req.params.id
		});
		const reply = await Reply.findOne({
			_id: req.params.id
		});
		if (!req.user.moderator && squak) {
			confirmedOwner(squak, req.user, backURL);
		}
		if (!req.user.moderator && reply) {
			confirmedOwner(reply, req.user, backURL);
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
		if (squak) console.log(squak.tweet + " deleted")
		const deleteSquak = await Tweet.deleteOne(squak);
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
		const squak = await Tweet.findOne({
			_id: req.params.id
		}).populate('author');


		const replies = await Reply.find({
			squak: req.params.id
		}).populate('author');

		res.render('single', {
			squak,
			moment,
			replies
		});

	} catch (err) {
		console.log(err);
		res.redirect('/?msg=no_squaks_found')
	}

}
