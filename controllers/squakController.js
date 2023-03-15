const Tweet = require('../models/Tweet');
const User = require('../models/User');
const Reply = require('../models/Reply');
const moment = require('moment');
const cloudinary = require('cloudinary').v2;

async function html(str) {
	var replacedText, replacePattern1, replacePattern2, replacePattern3, replacePattern4, replacePattern5;

	//URLs starting with http://, https://, or ftp://
	replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
	replacedText = str.replace(replacePattern1, `<a href="$1" target="_blank" class="alinks">$1</a>`);

	//URLs starting with "www." (without // before it, or it'd re-link the ones done above).
	replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
	replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank" class="alinks">$2</a>');

	replacePattern3 = /\*\*([^]+)\*\*/gim;
	replacedText = replacedText.replace(replacePattern3, '<b>$1</b>')

	replacePattern4 = /\*([^*]+)\*/gim;
	replacedText = replacedText.replace(replacePattern4, '<i>$1</i>')

	replacePattern5 = /\`([^`]+)\`/gim;
	replacedText = replacedText.replace(replacePattern5, '<code>$1</code>')

	var content = await replaceAsync(replacedText, /\B\@([\w\-]+)/gim, detectValidMentions);

	content = content.replace(/\B\#([\w\-]+)/gim, function (match, hashtag) {
		var post = `<a href="/search?query=${hashtag}&type=squak" class="mentions">${match}</a>`;
		return post;
	})

	return content
}

async function replaceAsync(str, regex, asyncFn) {
	const promises = [];
	str.replace(regex, (match, ...args) => {
		const promise = asyncFn(match, ...args);
		promises.push(promise);
	});
	const data = await Promise.all(promises);
	return str.replace(regex, () => data.shift());
}

async function detectValidMentions(match, name) {
	return new Promise((resolve, reject) => {
		User.findOne({
			username: name
		}).then((mention) => {
			if (mention) {
				if (typeof squakId !== 'undefined' && squakId !== null) {
					User.findOneAndUpdate({
						username: name
					}, {
						$addToSet: {
							notifications: {
								txt: `vous a mentionné dans un squak`,
								txten: `mentionned you in a squak`,
								url: `/squak/${squakId}`,
								author: currentUserId
							}
						}
					}).then(() => {
						let post = `<a href="/${name}" class="mentions">${match}</a>`;
						resolve(post);
					});
				} else {
					User.findOneAndUpdate({
						username: name
					}, {
						$addToSet: {
							notifications: {
								txt: `vous a mentionné dans un squak`,
								txten: `mentionned you in a squak`,
								url: `/squak/${originalSquakId}`,
								author: currentUserId
							}
						}
					}).then(() => {
						let post = `<a href="/${name}" class="mentions">${match}</a>`;
						resolve(post);
					});
				}
			} else {
				let post = match
				resolve(post);
			}
		});
	});
}

function makeid(length) {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}


// Home page to list all tweets
exports.postTweet = async (req, res) => {
	var backURL = req.header('Referer') || '/';
	try {
		if (req.videourl) {
			req.body.video = req.videourl
		} else if (req.imageurl) {
			req.body.image = req.imageurl
		} else if (!req.body.tweet) {
			req.flash('status', '402')
			return res.redirect(`${backURL}`);
		} else if (!req.body.tweet.replace(/\s/g, '').length) {
			req.flash('status', '402')
			return res.redirect(`${backURL}`);
		} else if (!req.user) {
			req.flash('status', '301')
			return res.redirect(`${backURL}`);
		}
		req.body.author = req.user._id;
		var unique = false;
		while (unique == false) {
			randomid = makeid(7)
			var test = await Tweet.findOne({
				shortid: randomid
			})
			if (!test) {
				unique = true
			}
		};
		req.body.shortid = randomid;
		currentUserId = req.user._id;
		squakId = randomid
		if (req.body.tweet) req.body.content = await html(req.body.tweet.replace(/\</g, "&lt;").replace(/\>/g, "&gt;"))
		const tweet = new Tweet(req.body);
		await tweet.save();
		res.redirect('back');
		// res.json(req.body)


	} catch (e) {
		console.log(e);
		req.flash('status', '400')
		res.redirect('/')
	}
}
exports.uploadImage = async (req, res, next) => {
	try {
		if (req.files) {
			const image = req.files.image;
			const video = req.files.video;
			if (video) {
				try {
					await cloudinary.uploader.upload(video.tempFilePath, {
							resource_type: "video",
						},
						function (error, result) {
							console.log(result, error)
							if (result) {
								const videourl = result.secure_url.toString()
								req.videourl = videourl
							}
						});
				} catch (e) {
					console.log(e);
					req.flash('status', '405')
					res.redirect('/')
				}
			} else if (image) {
				try {
					await cloudinary.uploader.upload(image.tempFilePath, {
							format: 'png',
							transformation: [{
								width: 400,
								crop: "scale"
							}]
						},
						async function (err, result) {
							const imageurl = result.secure_url.toString()
							req.imageurl = imageurl
						}
					)
				} catch (e) {
					console.log(e);
					req.flash('status', '403')
					res.redirect('/')
				}
			}
			next();
		} else {
			next();
		}
	} catch (e) {
		console.log(e);
		req.flash('status', '400')
		res.redirect('/')
	}
}


exports.postReply = async (req, res) => {
	try {
		if (req.videourl) {
			req.body.video = req.videourl
		} else if (req.imageurl) {
			req.body.image = req.imageurl
		} else if (!req.body.reply) {
			req.flash('status', '402')
			return res.redirect(`${backURL}`);
		} else if (!req.body.reply.replace(/\s/g, '').length) {
			req.flash('status', '402')
			return res.redirect(`${backURL}`);
		}
		req.body.author = req.user._id;
		var unique = false;
		while (unique == false) {
			randomid = makeid(7)
			var test = await Reply.findOne({
				shortid: randomid
			})
			if (!test) {
				unique = true
			}
		};
		req.body.shortid = randomid;
		req.body.squak = req.params.id;
		currentUserId = req.user._id;
		originalSquakId = req.params.id
		if (req.body.reply != "") req.body.content = await html(req.body.reply.replace(/\</g, "&lt;").replace(/\>/g, "&gt;"))
		const reply = new Reply(req.body);
		var originalsquak = await Tweet.findByIdAndUpdate({
			_id: req.params.id
		}, {
			$inc: {
				replies: 1
			}
		}).populate('author');
		if (!originalsquak) {
			originalsquak = await Reply.findByIdAndUpdate({
				_id: req.params.id
			}, {
				$inc: {
					replies: 1
				}
			}).populate('author');
		}
		await reply.save();
		if (originalsquak.author._id.toString() != req.user._id.toString()) {
			await User.findByIdAndUpdate({
					_id: originalsquak.author._id
				}, {
					$addToSet: {
						notifications: {
							txt: `a répondu à votre squak`,
							txten: `replied to your squak`,
							url: `/squak/${originalsquak.shortid}`,
							author: req.user._id
						}
					}
				},
				function (err, result) {
					if (err) console.log(err);
				});
		}
		res.redirect('back');


	} catch (e) {
		console.log(e);
		req.flash('status', '400')
		res.redirect('/')
	}
}




// Delete a tweet controller
// Tweet deleting function
const confirmedOwner = (squak, user, backURL) => {
	if (!squak.author._id.equals(user._id)) {
		req.flash('status', '600')
		return res.redirect(`${backURL}`);
	}
}


exports.deleteSquak = async (req, res) => {
	try {
		backURL = req.header('Referer') || '/';

		const squak = await Tweet.findOne({
			_id: req.params.id
		});
		const reply = await Reply.findOne({
			_id: req.params.id
		});
		if (!req.user.moderator) {
			confirmedOwner(squak || reply, req.user, backURL);
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
					if (err) console.log(err);
				});
		}
		if (squak) console.log(squak.tweet + " deleted")
		await Tweet.deleteOne(squak);
		await Reply.deleteOne(reply);
		res.redirect('back')
	} catch (e) {
		console.log(e);
		req.flash('status', '600')
		return res.redirect(`${backURL}`);
	}
}

exports.reportSquak = async (req, res) => {
	try {
		backURL = req.header('Referer') || '/';

		const squak = await Tweet.findOne({
			_id: req.params.id
		});
		const reply = await Reply.findOne({
			_id: req.params.id
		});
		if (squak) {
			await Tweet.findByIdAndUpdate({
					_id: squak._id
				}, {
					$inc: {
						reports: 1
					}
				},
				function (err, result) {
					if (err) console.log(err);
				});
		} else if (reply) {
			await Reply.findByIdAndUpdate({
					_id: reply._id
				}, {
					$inc: {
						reports: 1
					}
				},
				function (err, result) {
					if (err) console.log(err);
				});
		} else {
			req.flash('status', '404')
			return res.redirect('/')
		}
		User.find({
			moderator: true
		}).then((result) => {
			result.forEach(moderator => {
				if(squak) {
					User.findByIdAndUpdate({
							_id: moderator._id
						}, {
							$addToSet: {
								notifications: {
									txt: `a signalé un squak`,
									txten: `reported a squak`,
									url: `/squak/${squak.shortid || squak._id}`,
									author: req.user._id
								}
							}
						},
						function (err, result) {
							if (err) console.log(err);
						});
				} else if(reply) {
					User.findByIdAndUpdate({
							_id: moderator._id
						}, {
							$addToSet: {
								notifications: {
									txt: `a signalé un squak`,
									txten: `reported a squak`,
									url: `/reply/${reply.shortid|| reply._id}`,
									author: req.user._id
								}
							}
						},
						function (err, result) {
							if (err) console.log(err);
						});
				} else {
					req.flash('status', '404')
					res.redirect('back')
				}
			})
		})
		req.flash('status', '102')
		res.redirect('back')
	} catch (e) {
		console.log(e);
		req.flash('status', '600')
		return res.redirect('back');
	}


}

exports.pinSquak = async (req, res) => {
	try {
		backURL = req.header('Referer') || '/';

		const squak = await Tweet.findOne({
			_id: req.params.id
		}).populate('author');

		if (squak) {
			if (squak.author.username != req.user.username) {
				req.flash('status', '600')
				return res.redirect(`${backURL}`);
			}
		} else {
			req.flash('status', '404')
			return res.redirect(`${backURL}`);
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
						if (err) console.log(err);
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
						if (err) console.log(err);
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
					if (err) console.log(err);
				});
		}
		res.redirect('back')
	} catch (e) {
		console.log(e);
		req.flash('status', '600')
		return res.redirect(`${backURL}`);
	}


}

// Getting a single Tweet
exports.singleTweetPage = async (req, res) => {
	try {
		backURL = req.header('Referer') || '/';
		var squak = await Tweet.findOne({
			shortid: req.params.id.toString()
		}).populate('author');
		var replies;

		if (squak == null) {
			var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
			if (!checkForHexRegExp.test(req.params.id)) {
				req.flash('status', '404')
				return res.redirect(`${backURL}`);
			}
			squak = await Tweet.findOne({
				_id: req.params.id
			}).populate('author');
			replies = await Reply.find({
				squak: req.params.id
			}).populate('author');
			if (squak == null) {
				req.flash('status', '404')
				return res.redirect(`${backURL}`);
			}
		} else {
			replies = await Reply.find({
				squak: squak._id
			}).populate('author');
		}

		res.render('single', {
			appname: process.env.APP_NAME || 'Squakr',
			appurl: process.env.APP_URL || 'Squakr.fr',
			appheader: process.env.APP_HEADER || 'Squakr.fr',
			squak,
			moment,
			replies,
			type: 'squak',
			status: req.flash('status').pop() || req.query.status || '200'
		});

	} catch (err) {
		console.log(err);
		req.flash('status', '404')
		return res.redirect(`${backURL}`);
	}

}

exports.singleReplyPage = async (req, res) => {
	try {
		backURL = req.header('Referer') || '/';
		var reply = await Reply.findOne({
			shortid: req.params.id.toString()
		}).populate('author');
		var replies;

		if (reply == null) {
			var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
			if (!checkForHexRegExp.test(req.params.id)) {
				req.flash('status', '404')
				return res.redirect(`${backURL}`);
			}
			reply = await Reply.findOne({
				_id: req.params.id
			}).populate('author');
			replies = await Reply.find({
				squak: req.params.id
			}).populate('author');
			if (reply == null) {
				req.flash('status', '404')
				return res.redirect(`${backURL}`);
			}
		} else {
			replies = await Reply.find({
				squak: reply._id
			}).populate('author');
		}

		Tweet.findOne({
			_id: reply.squak
		}, (err, prt) => {
			if (prt) {
				res.render('single', {
					appname: process.env.APP_NAME || 'Squakr',
					appurl: process.env.APP_URL || 'Squakr.fr',
					appheader: process.env.APP_HEADER || 'Squakr.fr',
					squak: reply,
					parent: prt,
					parenttype: 'squak',
					moment,
					replies,
					type: 'reply',
					status: req.flash('status').pop() || req.query.status || '200'
				});
			} else {
				Reply.findOne({
					_id: reply.squak
				}, (err, prt) => {
					if (prt) {
						res.render('single', {
							appname: process.env.APP_NAME || 'Squakr',
							appurl: process.env.APP_URL || 'Squakr.fr',
							appheader: process.env.APP_HEADER || 'Squakr.fr',
							squak: reply,
							parent: prt,
							parenttype: 'reply',
							moment,
							replies,
							type: 'reply',
							status: req.flash('status').pop() || req.query.status || '200'
						});
					} else {
						res.render('single', {
							appname: process.env.APP_NAME || 'Squakr',
							appurl: process.env.APP_URL || 'Squakr.fr',
							appheader: process.env.APP_HEADER || 'Squakr.fr',
							squak: reply,
							moment,
							replies,
							type: 'reply',
							status: req.flash('status').pop() || req.query.status || '200'
						});
					}
				}).populate('author');
			}
		}).populate('author');

	} catch (err) {
		console.log(err);
		req.flash('status', '404')
		return res.redirect(`${backURL}`);
	}

}
