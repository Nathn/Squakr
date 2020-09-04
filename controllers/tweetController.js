const Tweet = require('../models/Tweet');
const User = require('../models/User');
const Reply = require('../models/Reply');
const moment = require('moment');
const cloudinary = require('cloudinary').v2;
const fileupload = require('express-fileupload');

function html(str) {
	var replacedText, replacePattern1, replacePattern2, replacePattern3, replacePattern4, replacePattern5;

	//URLs starting with http://, https://, or ftp://
	replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
	replacedText = str.replace(replacePattern1, `<a href="$1" target="_blank" style="text-decoration: none; color: #32567d;">$1</a>`);

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
	backURL = req.header('Referer') || '/';
	try {
		if (req.imageurl) {
			req.body.image = req.imageurl
		} else if (!req.body.tweet) {
			return res.redirect(backURL + '?err=102')
		} else if (!req.body.tweet.replace(/\s/g, '').length) {
			return res.redirect(backURL + '?err=102')
		}
		req.body.author = req.user._id;
		if (req.body.tweet) req.body.content = html(req.body.tweet.replace(/\</g, "&lt;").replace(/\>/g, "&gt;"))
		const tweet = new Tweet(req.body);
		await tweet.save();
		res.redirect('back');
		// res.json(req.body)


	} catch (e) {
		console.log(e);
		res.redirect('/?err=104')
	}
}
exports.uploadImage = async (req, res, next) => {
	try {
		if (req.files) {
			const image = req.files.image;
			if (image) {
				await cloudinary.uploader.upload(image.tempFilePath, async function (err, result) {
					var success = true
					const imageurl = result.secure_url.toString()
					req.imageurl = imageurl
				})
			}
			next();
		} else {
			next();
		}
	} catch (e) {
		console.log(e);
		res.redirect('/?err=103')
	}
}

exports.postReply = async (req, res) => {
	try {
		if (req.imageurl) {
			req.body.image = req.imageurl
		} else if (!req.body.reply) {
			return res.redirect(backURL + '?err=102')
		} else if (!req.body.reply.replace(/\s/g, '').length) {
			return res.redirect(backURL + '?err=102')
		}

		req.body.author = req.user._id;
		req.body.squak = req.params.id;
		if (req.body.reply != "") req.body.content = html(req.body.reply.replace(/\</g, "&lt;").replace(/\>/g, "&gt;"))
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
		res.redirect('/?err=104')
	}
}




// Delete a tweet controller
// Tweet deleting function
const confirmedOwner = (squak, user, backURL) => {
	if (!squak.author._id.equals(user._id)) {
		throw Error('Vous n\'avez pas assez de permissions pour supprimer ça.')
		if (!backURL.endsWith('err=402')) return res.redirect(`${backURL}?err=402`)
		return res.redirect(`${backURL}`)
	}
}


exports.deleteTweet = async (req, res) => {
	try {
		backURL = req.header('Referer') || '/';

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
		res.redirect(`${backURL}?err=402`)
	}


}

exports.pinTweet = async (req, res) => {
	try {
		backURL = req.header('Referer') || '/';

		const squak = await Tweet.findOne({
			_id: req.params.id
		}).populate('author');

		if (squak) {
			if (squak.author.username != req.user.username) {
				return res.redirect(`${backURL}?err=402`)
			}
		} else {
			return res.redirect(`${backURL}?err=100`)
		}
		console.log(squak.author.pinned)
		console.log(squak._id)
		if (squak.author.pinned) {
			if (squak.author.pinned.toString() == squak._id.toString()) {
				User.findByIdAndUpdate({
						_id: squak.author._id
					}, {
						$set: {
							pinned: undefined
						}
					},
					function (err, result) {
						if (err) {
							console.log(err);
						} else {
							console.log(result);
						}
					});
			} else {
				User.findByIdAndUpdate({
						_id: squak.author._id
					}, {
						$set: {
							pinned: squak._id.toString()
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
		} else {
			User.findByIdAndUpdate({
					_id: squak.author._id
				}, {
					$set: {
						pinned: squak._id.toString()
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
		res.redirect('back')
	} catch (e) {
		console.log(e);
		res.redirect(`${backURL}?err=402`)
	}


}

// Getting a single Tweet
exports.singleTweetPage = async (req, res) => {
	try {
		backURL = req.header('Referer') || '/';
		const squak = await Tweet.findOne({
			_id: req.params.id
		}).populate('author');

		const replies = await Reply.find({
			squak: req.params.id
		}).populate('author');

		if (!squak) {
			res.redirect(`${backURL}?err=100`)
		}

		res.render('single', {
			squak,
			moment,
			replies
		});

	} catch (err) {
		console.log(err);
		res.redirect(`${backURL}?err=100`)
	}

}

exports.singleReplyPage = async (req, res) => {
	try {
		backURL = req.header('Referer') || '/';
		const squak = await Reply.findOne({
			_id: req.params.id
		}).populate('author');

		const replies = await Reply.find({
			squak: req.params.id
		}).populate('author');

		if (squak) {
			if (Tweet.find({
					_id: squak.squak._id
				})) {
				const parent = await Tweet.find({
					_id: squak.squak._id
				}).populate('author')
			} else {
				const parent = 0
			};
		} else {
			res.redirect(`${backURL}?err=100`)
		};


		res.render('singlereply', {
			squak,
			moment,
			replies,
			parent
		});


	} catch (err) {
		console.log(err);
		res.redirect(`${backURL}?err=100`)
	}

}
