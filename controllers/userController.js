// Importing the model for use on this controller
const User = require('../models/User');
const Tweet = require('../models/Tweet');
const promisify = require('es6-promisify');
const moment = require('moment');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
const cloudinary = require('cloudinary').v2;
const Reply = require('../models/Reply');



require('dotenv').config({
	path: 'variables.env'
});

// The default controller for this app
exports.registerPage = (req, res) => {
	res.render('register');
}

exports.loginPage = (req, res) => {
	res.render('login');
}

exports.cguPage = (req, res) => {
	res.render('cgu');
}

function uniq(a) {
	var seen = {};
	return a.filter(function (item) {
		return seen.hasOwnProperty(item) ? false : (seen[item] = true);
	});
}

exports.searchPage = async (req, res) => {
	try {
		backURL = req.header('Referer') || '/';
		if (!req.query.query && !backURL.endsWith('err=400')) return res.redirect(`${backURL}?err=400`)
		if (!req.query.query) return res.redirect(`${backURL}`)
		var query = req.query.query;
		const searchresults1 = await User.find({
				username: {
					$regex: `^.*${query}.*`,
					$options: "i"
				}
			},
			(err, data) => {
				console.log(err);
			}
		).sort({
			moderator: -1,
			verified: -1,
			avatar: -1
		});
		var searchresults2 = await User.find({
				name: {
					$regex: `^.*${query}.*`,
					$options: "i"
				}
			},
			(err, data) => {
				console.log(err);
			}
		).sort({
			moderator: -1,
			verified: -1,
			avatar: -1
		});
		var searchresults3 = searchresults1.concat(searchresults2);
		searchresults = uniq(searchresults3)

		res.render('search', {
			searchresults,
			query
		});
		return;
	} catch (e) {
		console.log(e);
		res.redirect('back')
	}
}

// The profile page controller
exports.profilePage = async (req, res) => {
	try {
		if (req.user && req.user.lang == "en") {
			moment.locale('en')
		}
		const reqUser = await User.findOne({
			username: req.params.username
		});
		var months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
		var enmonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		if (reqUser) {
			// Find all tweets by that user with the _id
			const tweets = await Tweet.find({
				author: reqUser._id
			}).populate('author').sort({
				created: 'desc'
			});

			const likes = await Tweet.find({
				author: {
					$ne: reqUser._id
				},
				_id: {
					$in: reqUser.hearts
				}
			}).populate('author').sort({
				created: 'desc'
			});


			// Display the profile page
			res.render('profile', {
				reqUser,
				tweets,
				likes,
				moment,
				months,
				enmonths
			});
			return;
		} else {
			res.render('404', {})
		}

		// Else display a not found page


	} catch (e) {
		console.log(e);
		res.redirect('/')
	}
}


exports.likesProfilePage = async (req, res) => {
	try {
		if (req.user && req.user.lang == "en") {
			moment.locale('en')
		}
		const reqUser = await User.findOne({
			username: req.params.username
		});
		var months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
		var enmonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		if (reqUser) {

			const tweets = await Tweet.find({
				author: reqUser._id
			}).populate('author').sort({
				created: 'desc'
			});

			const likes = await Tweet.find({
				author: {
					$ne: reqUser._id
				},
				_id: {
					$in: reqUser.hearts
				}
			}).populate('author').sort({
				created: 'desc'
			});

			// Display the profile page
			res.render('profilelikes', {
				reqUser,
				moment,
				months,
				enmonths,
				likes,
				tweets
			});
			return;
		} else {
			res.render('404', {})
		}

		// Else display a not found page


	} catch (e) {
		console.log(e);
		res.redirect('/')
	}
}




// Getting the account page
exports.accountPage = async (req, res) => {
	const user = await User.findOne({
		_id: req.user._id
	});
	res.render('account', {
		user
	})
}

// Updating the account page POST
exports.accountUpdate = async (req, res) => {
	try {
		const updates = {
			name: req.body.name,
			email: req.body.email || req.user.email,
			website: req.body.website,
			bio: req.body.bio,
			lang: req.body.lang
		}

		const user = await User.findOneAndUpdate({
			_id: req.user._id
		}, {
			$set: updates
		}, {
			new: true,
			runValidators: true,
			context: 'query'
		})

		res.redirect(`/${req.user.username}`)
	} catch (e) {
		console.log(e);
		res.redirect('back')
	}
}


exports.upload = async (req, res, next) => {
	if (req.files) {
		const avatarfile = req.files.avatar;
		const bannerfile = req.files.banner;
		if (avatarfile) {
			cloudinary.uploader.upload(avatarfile.tempFilePath, async function (err, result) {
				var success = true
				const avatarurl = result.secure_url.toString()
				var user = await User.findOneAndUpdate({
					_id: req.user._id
				}, {
					'$set': {
						avatar: avatarurl || req.user.avatar
					}
				})
			})
		}
		if (bannerfile) {
			cloudinary.uploader.upload(bannerfile.tempFilePath, async function (err, result) {
				var success = true
				const bannerurl = result.secure_url.toString()
				var user = await User.findOneAndUpdate({
					_id: req.user._id
				}, {
					'$set': {
						banner: bannerurl || req.user.banner
					}
				})
			})
		}
		next();
	} else {
		next();
	}
}


// Registration page middlewares
// Verify the reg data
exports.verifyRegister = async (req, res, next) => {
	req.sanitizeBody('username');
	req.checkBody('username', '200').notEmpty();
	req.check('username', '201').custom(value => !/\s/.test(value));
	req.check('username', '202').custom(value => /^[0-9a-zA-Z_]+$/.test(value));
	req.check('username', '210').isLength({
		max: 16
	});
	req.sanitizeBody('email');
	req.checkBody('email', '203').notEmpty();
	req.checkBody('email', '204').isEmail();
	req.checkBody('password', '205').notEmpty();
	req.checkBody('password-confirm', '206').notEmpty();
	req.checkBody('password-confirm', '207').equals(req.body.password);

	const errors = req.validationErrors();
	if (errors) {
		console.log(errors);
		res.redirect(`register?err=${errors[0].msg}`)
		return;
	}
	next();
}

// Check if the user already exists Will hook it up later
exports.checkUserExists = async (req, res, next) => {
	var user = await User.find({
		username: req.body.username
	})

	// console.log(user);

	if (user.length) {
		res.redirect(`register?err=208`)
		return;
	}

	user = await User.find({
		email: req.body.email
	})

	if (user.length) {
		res.redirect(`register?err=209`)
		return;
	}
	next();
}

// Register the user into the database
exports.registerUser = async (req, res, next) => {
	try {
		const user = new User({
			username: req.body.username,
			email: req.body.email,
			lang: req.body.lang
		});

		const register = promisify(User.register, User);
		await register(user, req.body.password);
		const Discord = require("discord.js");
		const {
			Client,
			Util
		} = require("discord.js");
		const client = new Discord.Client();
		client.login(process.env.TOKEN);
		client.on('ready', () => {
			var userEmbed = new Discord.MessageEmbed()
			userEmbed.setColor(0x3333ff);
			userEmbed.setTitle("Nouveau membre sur Squakr !");
			userEmbed.setDescription(`Souhaitez la bienvenue à @${req.body.username} !`);
			var logschannel = client.channels.cache.get('735169754989592648');
			try {
				logschannel.send(userEmbed)
			} catch (e) {
				console.log(e)
			}
		});
		await User.findByIdAndUpdate(
			user._id, {
				'$addToSet': {
					following: user._id
				}
			}, {
				new: true
			}
		);
		await User.findByIdAndUpdate(
			user._id, {
				'$addToSet': {
					following: '5f1daf2680067f0017a9a7e8'
				}
			}, {
				new: true
			}
		);
		await User.findByIdAndUpdate(
			user._id, {
				'$addToSet': {
					following: '5f1ea87352f68c001720c9a3'
				}
			}, {
				new: true
			}
		);
		await User.findByIdAndUpdate(
			'5f1daf2680067f0017a9a7e8', {
				'$addToSet': {
					followers: user._id
				}
			}, {
				new: true
			}
		);
		await User.findByIdAndUpdate(
			'5f1ea87352f68c001720c9a3', {
				'$addToSet': {
					followers: user._id
				}
			}, {
				new: true
			}
		);
		next();

	} catch (error) {
		res.redirect('/register');
		console.log(error);
	}
};


// Heart a tweet
exports.heartTweet = async (req, res) => {
	backURL = req.header('Referer') || '/';
	if (!req.user) return res.redirect(`/login`)
	const hearts = req.user.hearts.map(obj => obj.toString());
	const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
	const user = await User.findByIdAndUpdate(
		req.user._id, {
			[operator]: {
				hearts: req.params.id
			}
		}, {
			new: true
		}
	);
	const squak = await Tweet.findById({
		_id: req.params.id
	}).populate('author');
	if (hearts.includes(req.params.id) == true) {
		if (squak.author.username != req.user.username) {
			Tweet.findByIdAndUpdate({
					_id: req.params.id
				}, {
					$inc: {
						likes: -1
					}
				},
				function (err, result) {
					if (err) {
						console.log(err);
					} else {
						// console.log(result);
					}
				}
			);
			User.findByIdAndUpdate({
					_id: squak.author._id
				}, {
					$inc: {
						likes: -1
					}
				},
				function (err, result) {
					if (err) {
						console.log(err);
					} else {
						console.log(result);
					}
				}
			);
		}
	} else {
		if (squak.author.username != req.user.username) {
			Tweet.findByIdAndUpdate({
					_id: req.params.id
				}, {
					$inc: {
						likes: 1
					}
				},
				function (err, result) {
					if (err) {
						console.log(err);
					} else {
						console.log(result);
					}
				}
			);
			User.findByIdAndUpdate({
					_id: squak.author._id
				}, {
					$inc: {
						likes: 1
					}
				},
				function (err, result) {
					if (err) {
						console.log(err);
					} else {
						console.log(result);
					}
				}
			);
		}
	}
	res.redirect(`${backURL}#${req.params.id}`)
}

exports.heartReply = async (req, res) => {
	backURL = req.header('Referer') || '/';
	const hearts = req.user.hearts.map(obj => obj.toString());
	const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
	const user = await User.findByIdAndUpdate(
		req.user._id, {
			[operator]: {
				hearts: req.params.id
			}
		}, {
			new: true
		}
	);
	const reply = await Reply.findById({
		_id: req.params.id
	}).populate('author');
	if (hearts.includes(req.params.id) == true) {
		if (reply.author.username != req.user.username) {
			Reply.findByIdAndUpdate({
					_id: req.params.id
				}, {
					$inc: {
						likes: -1
					}
				},
				function (err, result) {
					if (err) {
						console.log(err);
					} else {
						console.log(result);
					}
				}
			);
			User.findByIdAndUpdate({
					_id: reply.author._id
				}, {
					$inc: {
						likes: -1
					}
				},
				function (err, result) {
					if (err) {
						console.log(err);
					} else {
						console.log(result);
					}
				}
			);
		}
	} else {
		if (reply.author.username != req.user.username) {
			Reply.findByIdAndUpdate({
					_id: req.params.id
				}, {
					$inc: {
						likes: 1
					}
				},
				function (err, result) {
					if (err) {
						console.log(err);
					} else {
						console.log(result);
					}
				}
			);
			User.findByIdAndUpdate({
					_id: reply.author._id
				}, {
					$inc: {
						likes: 1
					}
				},
				function (err, result) {
					if (err) {
						console.log(err);
					} else {
						console.log(result);
					}
				}
			);
		}
	}
	res.redirect(`${backURL}`)
}


exports.verifyUser = async (req, res) => {
	if (!req.user.moderator) {
		res.redirect(`/`)
	}
	const user = await User.findByIdAndUpdate(
		req.params.id, {
			'$set': {
				verified: true
			}
		}
	);
	res.redirect(`back`)
}

exports.confirmUser = async (req, res) => {
	if (!req.user.moderator) {
		res.redirect(`/`)
	}
	const user = await User.findByIdAndUpdate(
		req.params.id, {
			'$set': {
				confirmed: true
			}
		}
	);
	res.redirect(`back`)
}

exports.followUser = async (req, res) => {
	if (!req.user) {
		return res.redirect(`/login`)
	}
	const following = req.user.following.map(obj => obj.toString());
	const operator = following.includes(req.params.id) ? '$pull' : '$addToSet';
	const user = await User.findByIdAndUpdate(
		req.user._id, {
			[operator]: {
				following: req.params.id
			}
		}, {
			new: true
		}
	);
	const fuser = await User.findByIdAndUpdate(
		req.params.id, {
			[operator]: {
				followers: req.user._id
			}
		}, {
			new: true
		}
	);

	res.redirect(`back`)
}
