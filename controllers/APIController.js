// Importing the model for use on this controller
const User = require('../models/User');
const Tweet = require('../models/Tweet');
const promisify = require('es6-promisify');
const moment = require('moment');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');
const Reply = require('../models/Reply');

exports.APIHomePage = async (req, res) => {
	try {
		res.render('api', {
			status: req.flash('status').pop() || req.flash('error').pop() || req.query.status || '200'
		});
	} catch (e) {
		console.log(e);
		res.redirect('/')
	}
}


exports.ProfilePage = async (req, res) => {
	try {
		const reqUser = await User.findOne({
			username: req.params.username
		});
		if (reqUser) {
			const squaks = await Tweet.find({
				author: reqUser._id
			}).populate('author').sort({
				created: 'desc'
			});

			const pinned = await Tweet.findOne({
				_id: reqUser.pinned
			}).populate('author');

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

			res.json({
				id: reqUser._id,
				username: reqUser.username,
				name: reqUser.name,
				bio: reqUser.bio,
				website: reqUser.website,
				creationdate: reqUser.created,
				avatar: reqUser.avatar,
				banner: reqUser.banner,
				verified: reqUser.verified,
				confirmedmail: reqUser.confirmed,
				moderator: reqUser.moderator,
				conributor: reqUser.developer,
				likes: reqUser.likes,
				followers: reqUser.followers.length,
				following: reqUser.following.length,
				pinnedsquak: reqUser.pinned,
				squaks: squaks.length,
				likedsquaks: likes.length
			});
			return;
		} else {
			res.json({
				id: null
			});
		}
	} catch (e) {
		console.log(e);
		return res.json({id: null, error: e.toLocaleString()});
	}
}


exports.SquakPage = async (req, res) => {
	try {
		if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
			var squak = await Tweet.findOne({
				shortid: req.params.id.toString()
			}).populate('author');
		} else {
			var squak = await Tweet.findOne({
				_id: req.params.id.toString()
			}).populate('author');
		}

		if (!squak) {
			return res.json({
				id: null
			});
		}
		const replies = await Reply.find({
			squak: squak._id.toString()
		}).populate('author');

		res.json({
			id: squak._id,
			short_id: squak.shortid,
			author_id: squak.author._id,
			author_username: squak.author.username,
			text: squak.tweet,
			image: squak.image,
			video: squak.video,
			likes: squak.likes,
			replies: squak.replies,
			creationdate: squak.created
		});
		return;
	} catch (e) {
		console.log(e);
		return res.json({id: null, error: e.toLocaleString()});
	}
}

exports.APIGetSquaks = async (req, res) => {
	try {
		/*
		Parameters :
		- author
		- sort
		- order
		- to
		- from
		*/
		if (req.query.author && req.query.author.match(/^[0-9a-fA-F]{24}$/)) {
			var squaks = await Tweet.find({
				author: req.query.author
			}).populate('author')
			.sort({[req.query.sort || 'created']: req.query.order || 'desc'})
			.limit(parseInt(req.query.to, 10) || 20);
		} else if (req.query.author) {
			return res.json({
				id: null
			});
		} else {
			var squaks = await Tweet.find()
			.populate('author')
			.sort({[req.query.sort || 'created']: req.query.order || 'desc'})
			.limit(parseInt(req.query.to, 10) || 20);
		}
		squakResult = []
		squaks.forEach(squak => squakResult.push({
			id: squak._id,
			author_id: squak.author._id,
			author_username: squak.author.username
		}));
		let from = (parseInt(req.query.from, 10) || 0)
		return res.json(squakResult.slice(from));
	} catch (e) {
		console.log(e);
		return res.json({id: null, error: e.toLocaleString()});
	}
}


exports.APIGetUsers = async (req, res) => {
	try {
		/*
		Parameters :
		- sort
		- order
		- to
		- from
		*/
		notAuthorized = ['darkmode', 'devmode', 'suggestions', 'notifications', 'readnotifications', 'lang']
		if (notAuthorized.includes(req.query.sort)) {
			sortMethod = 'created'
		} else {
			sortMethod = req.query.sort
		}
		var users = await User.find()
		.sort({[sortMethod || 'created']: req.query.order || 'desc'})
		.limit(parseInt(req.query.to, 10) || 20);
		usersResult = []
		users.forEach(user => usersResult.push({
			id: user._id,
			username: user.username
		}));
		let from = (parseInt(req.query.from, 10) || 0)
		return res.json(usersResult.slice(from));
	} catch (e) {
		console.log(e);
		return res.json({id: null, error: e.toLocaleString()});
	}
}

