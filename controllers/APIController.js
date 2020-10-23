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

exports.ProfilePage = async (req, res) => {
	try {
		const reqUser = await User.findOne({
			username: req.params.username
		});
		if (reqUser) {
			// Find all tweets by that user with the _id
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


			// Display the JSON page
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
				developer: reqUser.developer,
				likes: reqUser.likes,
				followers: reqUser.followers.length,
				following: reqUser.following.length,
				pinnedsquak: reqUser.pinned,
				squaks: squaks.length
			});
			return;
		} else {
			res.json({
				id: null
			});
		}
	} catch (e) {
		console.log(e);
		res.redirect('/')
	}
}


exports.SquakPage = async (req, res) => {
	try {
		if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
			res.json({
				id: null
			});
		}
		const squak = await Tweet.findOne({
			_id: req.params.id.toString()
		}).populate('author');

		const replies = await Reply.find({
			squak: req.params.id.toString()
		}).populate('author');

		if (!squak) {
			res.json({
				id: null
			});
		}

		// Display the JSON page
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
		res.redirect('/')
	}
}
