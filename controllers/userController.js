const User = require('../models/User');
const Tweet = require('../models/Tweet');
const Reply = require('../models/Reply');
const promisify = require('es6-promisify');
const moment = require('moment');
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');
const clipboardy = require('clipboardy');
const Discord = require("discord.js");

require('dotenv').config({
	path: 'variables.env'
});

exports.registerPage = (req, res) => {
	if (!req.user) {
		res.render('register', {
			appname: process.env.APP_NAME || 'Squakr',
			appurl: process.env.APP_URL || 'Squakr.fr',
			appheader: process.env.APP_HEADER || 'Squakr.fr',
			status: req.flash('status').pop() || req.flash('error').pop() || req.query.status || '200'
		});
	} else {
		res.redirect('/')
	}
}

exports.loginPage = (req, res) => {
	if (!req.user) {
		res.render('login', {
			appname: process.env.APP_NAME || 'Squakr',
			appurl: process.env.APP_URL || 'Squakr.fr',
			appheader: process.env.APP_HEADER || 'Squakr.fr',
			status: req.flash('status').pop() || req.flash('error').pop() || req.query.status || '200'
		});
	} else {
		res.redirect('/')
	}
}

exports.resetPage = (req, res) => {
	if (!req.user) {
		res.render('reset', {
			appname: process.env.APP_NAME || 'Squakr',
			appurl: process.env.APP_URL || 'Squakr.fr',
			appheader: process.env.APP_HEADER || 'Squakr.fr',
			status: req.flash('status').pop() || req.flash('error').pop() || req.query.status || '200'
		});
	} else {
		res.redirect('/')
	}
}

exports.cguPage = (req, res) => {
	res.render('cgu', {
		appname: process.env.APP_NAME || 'Squakr',
		appurl: process.env.APP_URL || 'Squakr.fr',
		appheader: process.env.APP_HEADER || 'Squakr.fr',
	});
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
		if (!req.query.query) {
			req.flash('status', '450')
			return res.redirect(`${backURL}`);
		}
		var query = req.query.query;
		if (!/^[ a-zA-ZÀ-ÿ0-9\u00f1\u00d1]*$/g.test(query)) {
			req.flash('status', '451')
			return res.redirect(`${backURL}`);
		}
		var typesearch = req.query.type;
		if (typesearch == 'users') {
			var searchresults = await User.find({
				$or: [
				  { username: { $regex: `^.*${query}.*`, $options: "i" } },
				  { name: { $regex: `^.*${query}.*`, $options: "i" } },
				  { username: { $regex: `^.*${query.replace(/\s/g, '')}.*`, $options: "i" } },
				  { name: { $regex: `^.*${query.replace(/\s/g, '')}.*`, $options: "i" } },
				]
			}).sort({
				moderator: -1,
				verified: -1,
				avatar: -1
			});
			searchresults = uniq(searchresults).slice(0, 50)
			return res.render('searchusers', {
				appname: process.env.APP_NAME || 'Squakr',
				appurl: process.env.APP_URL || 'Squakr.fr',
				appheader: process.env.APP_HEADER || 'Squakr.fr',
				searchresults,
				query,
				typesearch,
				status: req.flash('status').pop() || req.query.status || '200'
			});
		} else {
			var searchresults = await Tweet.find({
						tweet: {
							$regex: `^.*${query}.*`,
							$options: "im"
						}
					},
					(err, data) => {
						if (err) console.log(err);
					}
			).sort({
				created: 'desc'
			})
			.populate('author')
			.limit(500);
			var userresults = await User.find({
				$or: [
				  { username: { $regex: `^.*${query}.*`, $options: "i" } },
				  { name: { $regex: `^.*${query}.*`, $options: "i" } },
				  { username: { $regex: `^.*${query.replace(/\s/g, '')}.*`, $options: "i" } },
				  { name: { $regex: `^.*${query.replace(/\s/g, '')}.*`, $options: "i" } },
				]
			}).sort({
				moderator: -1,
				verified: -1,
				avatar: -1
			});
			userresults = uniq(userresults).slice(0, 50);

			return res.render('search', {
				appname: process.env.APP_NAME || 'Squakr',
				appurl: process.env.APP_URL || 'Squakr.fr',
				appheader: process.env.APP_HEADER || 'Squakr.fr',
				typesearch,
				searchresults,
				userresults,
				query,
				moment,
				status: req.flash('status').pop() || req.query.status || '200'
			});
		}
	} catch (e) {
		console.log(e);
		res.redirect('back')
	}
}

exports.profilePage = async (req, res) => {
	try {
		if (req.user && req.user.lang == "en") {
			moment.locale('en')
		} else {
			moment.locale('fr')
		}
		const reqUser = await User.findOne({
			username: req.params.username
		});
		var months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
		var enmonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		if (reqUser) {
			// Find all tweets by that user with the _id
			const tweets = await Tweet.find({
				author: reqUser._id,
				_id: {
					$ne: reqUser.pinned
				}
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

			// Display the profile page
			res.render('profile', {
				appname: process.env.APP_NAME || 'Squakr',
				appurl: process.env.APP_URL || 'Squakr.fr',
				appheader: process.env.APP_HEADER || 'Squakr.fr',
				reqUser,
				tweets,
				likes,
				moment,
				months,
				enmonths,
				pinned,
				status: req.flash('status').pop() || req.query.status || '200'
			});
			return;
		} else {
			res.render('404', {
				appname: process.env.APP_NAME || 'Squakr',
				appurl: process.env.APP_URL || 'Squakr.fr',
				appheader: process.env.APP_HEADER || 'Squakr.fr',
			})
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
				appname: process.env.APP_NAME || 'Squakr',
				appurl: process.env.APP_URL || 'Squakr.fr',
				appheader: process.env.APP_HEADER || 'Squakr.fr',
				reqUser,
				moment,
				months,
				enmonths,
				likes,
				tweets,
				status: req.flash('status').pop() || req.query.status || '200'
			});
			return;
		} else {
			res.render('404', {
				appname: process.env.APP_NAME || 'Squakr',
				appurl: process.env.APP_URL || 'Squakr.fr',
				appheader: process.env.APP_HEADER || 'Squakr.fr',
			})
		}
		// Else display a not found page
	} catch (e) {
		console.log(e);
		res.redirect('/')
	}
}

exports.accountPage = async (req, res) => {
	const user = await User.findOne({
		_id: req.user._id
	});
	res.render('account', {
		appname: process.env.APP_NAME || 'Squakr',
		appurl: process.env.APP_URL || 'Squakr.fr',
		appheader: process.env.APP_HEADER || 'Squakr.fr',
		user
	})
}

exports.settingsPage = async (req, res) => {
	const user = await User.findOne({
		_id: req.user._id
	});
	res.render('settings', {
		appname: process.env.APP_NAME || 'Squakr',
		appurl: process.env.APP_URL || 'Squakr.fr',
		appheader: process.env.APP_HEADER || 'Squakr.fr',
		user
	})
}

exports.accountUpdate = async (req, res) => {
	try {
		var updates = {
			name: req.body.name,
			email: req.body.email || req.user.email,
			website: req.body.website,
			bio: req.body.bio
		}

		if (!req.user) {
			req.flash('status', '301')
			return res.redirect('back')
		}

		if (req.body.email && req.body.email != req.user.email) {
			if (process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
				if (req.user.lang == 'fr') {
					var subject = `Vérifiez votre nouvelle adresse email, @${req.user.username}.`
					var htmlmsg = `<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Strict//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'> <html data-editor-version='2' class='sg-campaigns' xmlns='http://www.w3.org/1999/xhtml'> <head> <meta http-equiv='Content-Type' content='text/html; charset=utf-8'> <meta name='viewport' content='width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1'>  <meta http-equiv='X-UA-Compatible' content='IE=Edge'>    <style type='text/css'> body, p, div { font-family: inherit; font-size: 14px; } body { color: #000000; } body a { color: #1188E6; text-decoration: none; } p { margin: 0; padding: 0; } table.wrapper { width: 100% !important; table-layout: fixed; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -moz-text-size-adjust: 100%; -ms-text-size-adjust: 100%; } img.max-width { max-width: 100% !important; } .column.of-2 { width: 50%; } .column.of-3 { width: 33.333%; } .column.of-4 { width: 25%; } @media screen and (max-width:480px) { .preheader .rightColumnContent, .footer .rightColumnContent { text-align: left !important; } .preheader .rightColumnContent div, .preheader .rightColumnContent span, .footer .rightColumnContent div, .footer .rightColumnContent span { text-align: left !important; } .preheader .rightColumnContent, .preheader .leftColumnContent { font-size: 80% !important; padding: 5px 0; } table.wrapper-mobile { width: 100% !important; table-layout: fixed; } img.max-width { height: auto !important; max-width: 100% !important; } a.bulletproof-button { display: block !important; width: auto !important; font-size: 80%; padding-left: 0 !important; padding-right: 0 !important; } .columns { width: 100% !important; } .column { display: block !important; width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; margin-left: 0 !important; margin-right: 0 !important; } } </style>  <link href='https://fonts.googleapis.com/css?family=Muli&display=swap' rel='stylesheet'> <style> body { font-family: 'Muli', sans-serif; } </style>  </head> <body> <div class='wrapper' data-link-color='#1188E6' data-body-style='font-size:14px; font-family:inherit; color:#000000; background-color:#FFFFFF;'> <div class='webkit'> <table cellpadding='0' cellspacing='0' border='0' width='100%' class='wrapper' bgcolor='#FFFFFF'> <tbody> <tr> <td valign='top' bgcolor='#FFFFFF' width='100%'> <table width='100%' role='content-container' class='outer' align='center' cellpadding='0' cellspacing='0' border='0'> <tbody> <tr> <td width='100%'> <table width='100%' cellpadding='0' cellspacing='0' border='0'> <tbody> <tr> <td>  <table width='100%' cellpadding='0' cellspacing='0' border='0' style='width:100%; max-width:600px;' align='center'> <tbody> <tr> <td role='modules-container' style='padding:0px 0px 0px 0px; color:#000000; text-align:left;' bgcolor='#FFFFFF' width='100%' align='left'> <table class='module preheader preheader-hide' role='module' data-type='preheader' border='0' cellpadding='0' cellspacing='0' width='100%' style='display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;'> <tbody> <tr> <td role='module-content'> <p></p> </td> </tr> </tbody> </table> <table border='0' cellpadding='0' cellspacing='0' align='center' width='100%' role='module' data-type='columns' style='padding:30px 20px 30px 20px;' bgcolor='#f6f6f6'> <tbody> <tr role='module-content'> <td height='100%' valign='top'> <table class='column' width='540' style='width:540px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 10px;' cellpadding='0' cellspacing='0' align='left' border='0' bgcolor=''> <tbody> <tr> <td style='padding:0px;margin:0px;border-spacing:0;'> <table class='wrapper' role='module' data-type='image' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='72aac1ba-9036-4a77-b9d5-9a60d9b05cba'> <tbody> <tr> <td style='font-size:6px; line-height:10px; padding:0px 0px 0px 0px;' valign='top' align='center'> <img class='max-width' border='0' style='display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px;' width='230' alt='' data-proportionally-constrained='true' data-responsive='false' src='https://squakr.fr/uploads/pyt6ht4r8.png' height='200'> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='spacer' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='27716fe9-ee64-4a64-94f9-a4f28bc172a0'> <tbody> <tr> <td style='padding:0px 0px 30px 0px;' role='module-content' bgcolor=''> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='text' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='948e3f3f-5214-4721-a90e-625a47b1c957' data-mc-module-version='2019-10-22'> <tbody> <tr> <td style='padding:50px 30px 18px 30px; line-height:36px; text-align:inherit; background-color:#ffffff;' height='100%' valign='top' bgcolor='#ffffff' role='module-content'> <div> <div style='font-family: inherit; text-align: center'> <span style='font-size: 43px'>@${req.user.username}, votre email Squakr a été modifié ! </span> </div> <div> </div> </div> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='text' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='a10dcb57-ad22-4f4d-b765-1d427dfddb4e' data-mc-module-version='2019-10-22'> <tbody> <tr> <td style='padding:18px 30px 0px 30px; line-height:22px; text-align:inherit; background-color:#ffffff;' height='100%' valign='top' bgcolor='#ffffff' role='module-content'> <div> <div style='font-family: inherit; text-align: center'> <span style='color: #000000; font-size: 18px; font-family: arial,helvetica,sans-serif'>Vérifier ton adresse n'est pas obligatoire, mais en plus d'ajouter un super badge à ton profil, cela réduira tes chances d'être suspendu pour comportement automatisé et propulsera ton profil en haut des résultats de recherche !</span> </div> <div style='font-family: inherit; text-align: center; margin-top:10px;'> <span style='color: #39aeb4; font-size: 18px'><strong>Convaicu ? </strong></span> </div> <div> </div> </div> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='spacer' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='7770fdab-634a-4f62-a277-1c66b2646d8d'> <tbody> <tr> <td style='padding:0px 0px 20px 0px;' role='module-content' bgcolor='#ffffff'> </td> </tr> </tbody> </table> <table border='0' cellpadding='0' cellspacing='0' class='module' data-role='module-button' data-type='button' role='module' style='table-layout:fixed;' width='100%' data-muid='d050540f-4672-4f31-80d9-b395dc08abe1'> <tbody> <tr> <td align='center' bgcolor='#ffffff' class='outer-td' style='padding:0px 0px 0px 0px;'> <table border='0' cellpadding='0' cellspacing='0' class='wrapper-mobile' style='text-align:center;'> <tbody> <tr> <td align='center' bgcolor='#ffbe00' class='inner-td' style='border-radius:6px; font-size:16px; text-align:center; background-color:inherit;'> <a href='https://squakr.fr/api/users/${req.user._id}/confirm?token=h8g5a-8z8ep-5z1ex' style='background-color:#4bd3db; border:1px solid #4bd3db; border-color:#4bd3db; border-radius:0px; border-width:1px; color:#000000; display:inline-block; font-size:14px; font-weight:normal; letter-spacing:0px; line-height:normal; padding:12px 40px 12px 40px; text-align:center; text-decoration:none; border-style:solid; font-family:inherit;' target='_blank'>Vérifier l'email</a> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='spacer' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='c37cc5b7-79f4-4ac8-b825-9645974c984e'> <tbody> <tr> <td style='padding:0px 0px 30px 0px;' role='module-content' bgcolor='#ffffff'> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> <div data-role='module-unsubscribe' class='module' role='module' data-type='unsubscribe' style='color:#444444; font-size:12px; line-height:20px; padding:16px 16px 16px 16px; text-align:Center;' data-muid='4e838cf3-9892-4a6d-94d6-170e474d21e5'> Si vous pensez avoir reçu ce mail par erreur, vous pouvez simplement l'ignorer.<br /> Si vous êtes propriétaire de ce compte mais n'avez pas changé votre email, contactez-nous immédiatement à l'adresse <a href='mailto:contact@squakr.fr'>contact@squakr.fr</a> . <div class='Unsubscribe--addressLine'> <p class='Unsubscribe--senderName' style='font-size:12px; line-height:20px;'> <a href='https://squakr.fr'>Squakr.fr</a> </p> </div> </div> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </div> </div> </body> </html>`;
				} else if (req.user.lang == 'en') {
					var subject = `Verify your new email address on ${process.env.APP_NAME || "Squakr"}, @${req.user.username}.`
					var htmlmsg = `<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Strict//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'> <html data-editor-version='2' class='sg-campaigns' xmlns='http://www.w3.org/1999/xhtml'> <head> <meta http-equiv='Content-Type' content='text/html; charset=utf-8'> <meta name='viewport' content='width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1'>  <meta http-equiv='X-UA-Compatible' content='IE=Edge'>    <style type='text/css'> body, p, div { font-family: inherit; font-size: 14px; } body { color: #000000; } body a { color: #1188E6; text-decoration: none; } p { margin: 0; padding: 0; } table.wrapper { width: 100% !important; table-layout: fixed; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -moz-text-size-adjust: 100%; -ms-text-size-adjust: 100%; } img.max-width { max-width: 100% !important; } .column.of-2 { width: 50%; } .column.of-3 { width: 33.333%; } .column.of-4 { width: 25%; } @media screen and (max-width:480px) { .preheader .rightColumnContent, .footer .rightColumnContent { text-align: left !important; } .preheader .rightColumnContent div, .preheader .rightColumnContent span, .footer .rightColumnContent div, .footer .rightColumnContent span { text-align: left !important; } .preheader .rightColumnContent, .preheader .leftColumnContent { font-size: 80% !important; padding: 5px 0; } table.wrapper-mobile { width: 100% !important; table-layout: fixed; } img.max-width { height: auto !important; max-width: 100% !important; } a.bulletproof-button { display: block !important; width: auto !important; font-size: 80%; padding-left: 0 !important; padding-right: 0 !important; } .columns { width: 100% !important; } .column { display: block !important; width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; margin-left: 0 !important; margin-right: 0 !important; } } </style>  <link href='https://fonts.googleapis.com/css?family=Muli&display=swap' rel='stylesheet'> <style> body { font-family: 'Muli', sans-serif; } </style>  </head> <body> <div class='wrapper' data-link-color='#1188E6' data-body-style='font-size:14px; font-family:inherit; color:#000000; background-color:#FFFFFF;'> <div class='webkit'> <table cellpadding='0' cellspacing='0' border='0' width='100%' class='wrapper' bgcolor='#FFFFFF'> <tbody> <tr> <td valign='top' bgcolor='#FFFFFF' width='100%'> <table width='100%' role='content-container' class='outer' align='center' cellpadding='0' cellspacing='0' border='0'> <tbody> <tr> <td width='100%'> <table width='100%' cellpadding='0' cellspacing='0' border='0'> <tbody> <tr> <td>  <table width='100%' cellpadding='0' cellspacing='0' border='0' style='width:100%; max-width:600px;' align='center'> <tbody> <tr> <td role='modules-container' style='padding:0px 0px 0px 0px; color:#000000; text-align:left;' bgcolor='#FFFFFF' width='100%' align='left'> <table class='module preheader preheader-hide' role='module' data-type='preheader' border='0' cellpadding='0' cellspacing='0' width='100%' style='display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;'> <tbody> <tr> <td role='module-content'> <p></p> </td> </tr> </tbody> </table> <table border='0' cellpadding='0' cellspacing='0' align='center' width='100%' role='module' data-type='columns' style='padding:30px 20px 30px 20px;' bgcolor='#f6f6f6'> <tbody> <tr role='module-content'> <td height='100%' valign='top'> <table class='column' width='540' style='width:540px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 10px;' cellpadding='0' cellspacing='0' align='left' border='0' bgcolor=''> <tbody> <tr> <td style='padding:0px;margin:0px;border-spacing:0;'> <table class='wrapper' role='module' data-type='image' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='72aac1ba-9036-4a77-b9d5-9a60d9b05cba'> <tbody> <tr> <td style='font-size:6px; line-height:10px; padding:0px 0px 0px 0px;' valign='top' align='center'> <img class='max-width' border='0' style='display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px;' width='230' alt='' data-proportionally-constrained='true' data-responsive='false' src='https://squakr.fr/uploads/pyt6ht4r8.png' height='200'> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='spacer' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='27716fe9-ee64-4a64-94f9-a4f28bc172a0'> <tbody> <tr> <td style='padding:0px 0px 30px 0px;' role='module-content' bgcolor=''> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='text' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='948e3f3f-5214-4721-a90e-625a47b1c957' data-mc-module-version='2019-10-22'> <tbody> <tr> <td style='padding:50px 30px 18px 30px; line-height:36px; text-align:inherit; background-color:#ffffff;' height='100%' valign='top' bgcolor='#ffffff' role='module-content'> <div> <div style='font-family: inherit; text-align: center'> <span style='font-size: 43px'>@${req.user.username}, your email on Squakr has been modified ! </span> </div> <div> </div> </div> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='text' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='a10dcb57-ad22-4f4d-b765-1d427dfddb4e' data-mc-module-version='2019-10-22'> <tbody> <tr> <td style='padding:18px 30px 0px 30px; line-height:22px; text-align:inherit; background-color:#ffffff;' height='100%' valign='top' bgcolor='#ffffff' role='module-content'> <div> <div style='font-family: inherit; text-align: center'> <span style='color: #000000; font-size: 18px; font-family: arial,helvetica,sans-serif'>Verifying your address isn't required, but in addition to adding a great badge to your profile, it will reduce your chances of being suspended for automated behavior and propel your profile to the top of search results !</span> </div> <div style='font-family: inherit; text-align: center; margin-top:10px;'> <span style='color: #39aeb4; font-size: 18px;'><strong>Convinced ?</strong></span> </div> <div> </div> </div> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='spacer' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='7770fdab-634a-4f62-a277-1c66b2646d8d'> <tbody> <tr> <td style='padding:0px 0px 20px 0px;' role='module-content' bgcolor='#ffffff'> </td> </tr> </tbody> </table> <table border='0' cellpadding='0' cellspacing='0' class='module' data-role='module-button' data-type='button' role='module' style='table-layout:fixed;' width='100%' data-muid='d050540f-4672-4f31-80d9-b395dc08abe1'> <tbody> <tr> <td align='center' bgcolor='#ffffff' class='outer-td' style='padding:0px 0px 0px 0px;'> <table border='0' cellpadding='0' cellspacing='0' class='wrapper-mobile' style='text-align:center;'> <tbody> <tr> <td align='center' bgcolor='#ffbe00' class='inner-td' style='border-radius:6px; font-size:16px; text-align:center; background-color:inherit;'> <a href='https://squakr.fr/api/users/${req.user._id}/confirm?token=h8g5a-8z8ep-5z1ex' style='background-color:#4bd3db; border:1px solid #4bd3db; border-color:#4bd3db; border-radius:0px; border-width:1px; color:#000000; display:inline-block; font-size:14px; font-weight:normal; letter-spacing:0px; line-height:normal; padding:12px 40px 12px 40px; text-align:center; text-decoration:none; border-style:solid; font-family:inherit;' target='_blank'>Verify email</a> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='spacer' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='c37cc5b7-79f4-4ac8-b825-9645974c984e'> <tbody> <tr> <td style='padding:0px 0px 30px 0px;' role='module-content' bgcolor='#ffffff'> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> <div data-role='module-unsubscribe' class='module' role='module' data-type='unsubscribe' style='color:#444444; font-size:12px; line-height:20px; padding:16px 16px 16px 16px; text-align:Center;' data-muid='4e838cf3-9892-4a6d-94d6-170e474d21e5'> If you think you received this email by error, you can simply ignore it.<br /> If you are the owner of this account but have not changed your email address, contact us immediately at <a href='mailto:contact@squakr.fr'>contact@squakr.fr</a> . <div class='Unsubscribe--addressLine'> <p class='Unsubscribe--senderName' style='font-size:12px; line-height:20px;'> <a href='https://squakr.fr'>Squakr.fr</a> </p> </div> </div> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </div> </div> </body> </html>`;
				}
				const transporter = nodemailer.createTransport({
					host: process.env.EMAIL_HOST,
					port: process.env.EMAIL_PORT,
					auth: {
						user: process.env.EMAIL_USER,
						pass: process.env.EMAIL_PASS
					},
					tls: {
						rejectUnauthorized: false
					}
				});

				const mailOptions = {
					from: `${process.env.APP_NAME || "Squakr"} <${process.env.EMAIL_USER}>`,
					to: req.body.email,
					subject: subject,
					html: htmlmsg
				};

				transporter.sendMail(mailOptions, function (error, info) {
					if (error) {
						console.log(error);
					} else {
						console.log('Email sent : ' + info.response);
					}
				});
				/*
				var user = await User.findByIdAndUpdate(
						req.user._id, {
							'$set': {
								confirmed: false
							}
						}
				); */
				// It throws a MongoError when I add this and try it on cloud (works on localhost), don't know why :/
			}
		}

		await User.findOneAndUpdate({
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
exports.settingsUpdate = async (req, res) => {
	try {
		const updates = {
			lang: req.body.lang,
			suggestions: req.body.suggestions,
			devmode: req.body.devmode,
			darkmode: req.body.theme ? true : false
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

		res.redirect(`/`)
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
				const avatarurl = result.secure_url.toString()
				await User.findOneAndUpdate({
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
				const bannerurl = result.secure_url.toString()
				await User.findOneAndUpdate({
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
	req.checkBody('username', '500').notEmpty();
	req.check('username', '501').custom(value => !/\s/.test(value));
	req.check('username', '502').custom(value => /^[0-9a-zA-Z_]+$/.test(value));
	req.check('username', '510').isLength({
		max: 16
	});
	req.sanitizeBody('email');
	req.checkBody('email', '503').notEmpty();
	req.checkBody('email', '504').isEmail();
	req.checkBody('password', '505').notEmpty();
	req.checkBody('password-confirm', '506').notEmpty();
	req.checkBody('password-confirm', '507').equals(req.body.password);

	const errors = req.validationErrors();
	if (errors) {
		console.log(errors);
		req.flash('status', `${errors[0].msg}`)
		return res.redirect(`register`)
	}
	next();
}

exports.checkUserExists = async (req, res, next) => {
	var user = await User.find({
		username: { $eq: req.body.username }
	})

	if (user.length) {
		req.flash('status', '508')
		return res.redirect(`register`)
	}

	user = await User.find({
		email: { $eq: req.body.email }
	})

	if (user.length) {
		req.flash('status', '509')
		return res.redirect(`register`)
	}

	let blacklist = [
		'api',
		'cgu',
		'delete',
		'id',
		'login',
		'logout',
		'notifications',
		'register',
		'report',
		'reset',
		'search',
		'settings',
		'squak',
	]
	if (blacklist.includes(req.body.username.toLowerCase())) {
		req.flash('status', '511')
		return res.redirect(`register`)
	}

	next();
}

// Register the user into the database
exports.registerUser = async (req, res, next) => {
	try {
		const avatars = ['/uploads/no-avatar-blue.jpg',
						'/uploads/no-avatar-green.jpg',
						'/uploads/no-avatar-red.jpg',
						'/uploads/no-avatar-yellow.jpg',
						'/uploads/no-avatar-black.jpg']
		const user = new User({
			username: req.body.username,
			name: req.body.username.charAt(0).toUpperCase() + req.body.username.slice(1),
			email: req.body.email,
			avatar: avatars[Math.floor(Math.random() * avatars.length)], // Random avatar
			lang: req.body.lang
		});

		const register = promisify(User.register, User);
		await register(user, req.body.password);

		if (process.env.TOKEN && process.env.CHANNEL_ID) {
			const client = new Discord.Client();
			client.login(process.env.TOKEN);
			client.on('ready', () => {
				var userEmbed = new Discord.MessageEmbed()
				userEmbed.setColor(0x3333ff);
				userEmbed.setTitle(`Nouveau membre sur ${process.env.APP_NAME || "Squakr"} !`);
				userEmbed.setDescription(`Souhaitez la bienvenue à @${req.body.username} !`);
				var logschannel = client.channels.cache.get(process.env.CHANNEL_ID);
				try {
					logschannel.send(userEmbed)
				} catch (e) {
					console.log(e)
				}
			});
		}

		await User.findByIdAndUpdate(
			user._id, {
				'$addToSet': {
					following: user._id
				}
			}, {
				new: true
			}
		);

		if (req.body.lang == 'fr') {
			if (process.env.DEFAULT_FOLLOW_FR_1) {
				await User.findByIdAndUpdate(
					user._id, {
						'$addToSet': {
							following: process.env.DEFAULT_FOLLOW_FR_1
						}
					}, {
						new: true
					}
				);
				await User.findByIdAndUpdate(
					process.env.DEFAULT_FOLLOW_FR_1, {
						'$addToSet': {
							followers: user._id
						}
					}, {
						new: true
					}
				);
			}

			if (process.env.DEFAULT_FOLLOW_FR_2) {
				await User.findByIdAndUpdate(
					user._id, {
						'$addToSet': {
							following: process.env.DEFAULT_FOLLOW_FR_2
						}
					}, {
						new: true
					}
				);
				await User.findByIdAndUpdate(
					process.env.DEFAULT_FOLLOW_FR_2, {
						'$addToSet': {
							followers: user._id
						}
					}, {
						new: true
					}
				);
			}
		} else if (req.body.lang == 'en') {
			if (process.env.DEFAULT_FOLLOW_EN_1) {
				await User.findByIdAndUpdate(
					user._id, {
						'$addToSet': {
							following: process.env.DEFAULT_FOLLOW_EN_1
						}
					}, {
						new: true
					}
				);
				await User.findByIdAndUpdate(
					process.env.DEFAULT_FOLLOW_EN_1, {
						'$addToSet': {
							followers: user._id
						}
					}, {
						new: true
					}
				);
			}

			if (process.env.DEFAULT_FOLLOW_EN_2) {
				await User.findByIdAndUpdate(
					user._id, {
						'$addToSet': {
							following: process.env.DEFAULT_FOLLOW_EN_2
						}
					}, {
						new: true
					}
				);
				await User.findByIdAndUpdate(
					process.env.DEFAULT_FOLLOW_EN_2, {
						'$addToSet': {
							followers: user._id
						}
					}, {
						new: true
					}
				);
			}
		}

		if (process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
			if (req.body.lang == 'fr') {
				var subject = `Bienvenue sur ${process.env.APP_NAME || "Squakr"}, ${req.body.username} !`
				var htmlmsg = `<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Strict//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'> <html data-editor-version='2' class='sg-campaigns' xmlns='http://www.w3.org/1999/xhtml'> <head> <meta http-equiv='Content-Type' content='text/html; charset=utf-8'> <meta name='viewport' content='width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1'>  <meta http-equiv='X-UA-Compatible' content='IE=Edge'>    <style type='text/css'> body, p, div { font-family: inherit; font-size: 14px; } body { color: #000000; } body a { color: #1188E6; text-decoration: none; } p { margin: 0; padding: 0; } table.wrapper { width: 100% !important; table-layout: fixed; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -moz-text-size-adjust: 100%; -ms-text-size-adjust: 100%; } img.max-width { max-width: 100% !important; } .column.of-2 { width: 50%; } .column.of-3 { width: 33.333%; } .column.of-4 { width: 25%; } @media screen and (max-width:480px) { .preheader .rightColumnContent, .footer .rightColumnContent { text-align: left !important; } .preheader .rightColumnContent div, .preheader .rightColumnContent span, .footer .rightColumnContent div, .footer .rightColumnContent span { text-align: left !important; } .preheader .rightColumnContent, .preheader .leftColumnContent { font-size: 80% !important; padding: 5px 0; } table.wrapper-mobile { width: 100% !important; table-layout: fixed; } img.max-width { height: auto !important; max-width: 100% !important; } a.bulletproof-button { display: block !important; width: auto !important; font-size: 80%; padding-left: 0 !important; padding-right: 0 !important; } .columns { width: 100% !important; } .column { display: block !important; width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; margin-left: 0 !important; margin-right: 0 !important; } } </style>  <link href='https://fonts.googleapis.com/css?family=Muli&display=swap' rel='stylesheet'> <style> body { font-family: 'Muli', sans-serif; } </style>  </head> <body> <div class='wrapper' data-link-color='#1188E6' data-body-style='font-size:14px; font-family:inherit; color:#000000; background-color:#FFFFFF;'> <div class='webkit'> <table cellpadding='0' cellspacing='0' border='0' width='100%' class='wrapper' bgcolor='#FFFFFF'> <tbody> <tr> <td valign='top' bgcolor='#FFFFFF' width='100%'> <table width='100%' role='content-container' class='outer' align='center' cellpadding='0' cellspacing='0' border='0'> <tbody> <tr> <td width='100%'> <table width='100%' cellpadding='0' cellspacing='0' border='0'> <tbody> <tr> <td>  <table width='100%' cellpadding='0' cellspacing='0' border='0' style='width:100%; max-width:600px;' align='center'> <tbody> <tr> <td role='modules-container' style='padding:0px 0px 0px 0px; color:#000000; text-align:left;' bgcolor='#FFFFFF' width='100%' align='left'> <table class='module preheader preheader-hide' role='module' data-type='preheader' border='0' cellpadding='0' cellspacing='0' width='100%' style='display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;'> <tbody> <tr> <td role='module-content'> <p></p> </td> </tr> </tbody> </table> <table border='0' cellpadding='0' cellspacing='0' align='center' width='100%' role='module' data-type='columns' style='padding:30px 20px 30px 20px;' bgcolor='#f6f6f6'> <tbody> <tr role='module-content'> <td height='100%' valign='top'> <table class='column' width='540' style='width:540px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 10px;' cellpadding='0' cellspacing='0' align='left' border='0' bgcolor=''> <tbody> <tr> <td style='padding:0px;margin:0px;border-spacing:0;'> <table class='wrapper' role='module' data-type='image' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='72aac1ba-9036-4a77-b9d5-9a60d9b05cba'> <tbody> <tr> <td style='font-size:6px; line-height:10px; padding:0px 0px 0px 0px;' valign='top' align='center'> <img class='max-width' border='0' style='display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px;' width='230' alt='' data-proportionally-constrained='true' data-responsive='false' src='https://squakr.fr/uploads/pyt6ht4r8.png' height='200'> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='spacer' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='27716fe9-ee64-4a64-94f9-a4f28bc172a0'> <tbody> <tr> <td style='padding:0px 0px 30px 0px;' role='module-content' bgcolor=''> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='text' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='948e3f3f-5214-4721-a90e-625a47b1c957' data-mc-module-version='2019-10-22'> <tbody> <tr> <td style='padding:50px 30px 18px 30px; line-height:36px; text-align:inherit; background-color:#ffffff;' height='100%' valign='top' bgcolor='#ffffff' role='module-content'> <div> <div style='font-family: inherit; text-align: center'> <span style='font-size: 43px'>Merci de ton inscription, @${req.body.username} ! </span> </div> <div> </div> </div> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='text' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='a10dcb57-ad22-4f4d-b765-1d427dfddb4e' data-mc-module-version='2019-10-22'> <tbody> <tr> <td style='padding:18px 30px 0px 30px; line-height:22px; text-align:inherit; background-color:#ffffff;' height='100%' valign='top' bgcolor='#ffffff' role='module-content'> <div> <div style='font-family: inherit; text-align: center'> <span style='color: #000000; font-size: 18px; font-family: arial,helvetica,sans-serif'>Vérifier ton adresse n'est pas obligatoire, mais en plus d'ajouter un super badge à ton profil, cela réduira tes chances d'être suspendu pour comportement automatisé et propulsera ton profil en haut des résultats de recherche !</span> </div> <div style='font-family: inherit; text-align: center; margin-top:10px;'> <span style='color: #39aeb4; font-size: 18px'><strong>Convaicu ? </strong></span> </div> <div> </div> </div> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='spacer' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='7770fdab-634a-4f62-a277-1c66b2646d8d'> <tbody> <tr> <td style='padding:0px 0px 20px 0px;' role='module-content' bgcolor='#ffffff'> </td> </tr> </tbody> </table> <table border='0' cellpadding='0' cellspacing='0' class='module' data-role='module-button' data-type='button' role='module' style='table-layout:fixed;' width='100%' data-muid='d050540f-4672-4f31-80d9-b395dc08abe1'> <tbody> <tr> <td align='center' bgcolor='#ffffff' class='outer-td' style='padding:0px 0px 0px 0px;'> <table border='0' cellpadding='0' cellspacing='0' class='wrapper-mobile' style='text-align:center;'> <tbody> <tr> <td align='center' bgcolor='#ffbe00' class='inner-td' style='border-radius:6px; font-size:16px; text-align:center; background-color:inherit;'> <a href='https://squakr.fr/api/users/${user._id}/confirm?token=h8g5a-8z8ep-5z1ex' style='background-color:#4bd3db; border:1px solid #4bd3db; border-color:#4bd3db; border-radius:0px; border-width:1px; color:#000000; display:inline-block; font-size:14px; font-weight:normal; letter-spacing:0px; line-height:normal; padding:12px 40px 12px 40px; text-align:center; text-decoration:none; border-style:solid; font-family:inherit;' target='_blank'>Vérifier l'email</a> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='spacer' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='c37cc5b7-79f4-4ac8-b825-9645974c984e'> <tbody> <tr> <td style='padding:0px 0px 30px 0px;' role='module-content' bgcolor='#ffffff'> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> <div data-role='module-unsubscribe' class='module' role='module' data-type='unsubscribe' style='color:#444444; font-size:12px; line-height:20px; padding:16px 16px 16px 16px; text-align:Center;' data-muid='4e838cf3-9892-4a6d-94d6-170e474d21e5'> Si vous pensez avoir reçu ce mail par erreur, vous pouvez simplement l'ignorer. <div class='Unsubscribe--addressLine'> <p class='Unsubscribe--senderName' style='font-size:12px; line-height:20px;'> <a href='https://squakr.fr'>Squakr.fr</a> </p> </div> </div> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </div> </div> </body> </html>`;
			} else if (req.body.lang == 'en') {
				var subject = `Welcome to ${process.env.APP_NAME || "Squakr"}, ${req.body.username} !`
				var htmlmsg = `<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Strict//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'> <html data-editor-version='2' class='sg-campaigns' xmlns='http://www.w3.org/1999/xhtml'> <head> <meta http-equiv='Content-Type' content='text/html; charset=utf-8'> <meta name='viewport' content='width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1'>  <meta http-equiv='X-UA-Compatible' content='IE=Edge'>    <style type='text/css'> body, p, div { font-family: inherit; font-size: 14px; } body { color: #000000; } body a { color: #1188E6; text-decoration: none; } p { margin: 0; padding: 0; } table.wrapper { width: 100% !important; table-layout: fixed; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -moz-text-size-adjust: 100%; -ms-text-size-adjust: 100%; } img.max-width { max-width: 100% !important; } .column.of-2 { width: 50%; } .column.of-3 { width: 33.333%; } .column.of-4 { width: 25%; } @media screen and (max-width:480px) { .preheader .rightColumnContent, .footer .rightColumnContent { text-align: left !important; } .preheader .rightColumnContent div, .preheader .rightColumnContent span, .footer .rightColumnContent div, .footer .rightColumnContent span { text-align: left !important; } .preheader .rightColumnContent, .preheader .leftColumnContent { font-size: 80% !important; padding: 5px 0; } table.wrapper-mobile { width: 100% !important; table-layout: fixed; } img.max-width { height: auto !important; max-width: 100% !important; } a.bulletproof-button { display: block !important; width: auto !important; font-size: 80%; padding-left: 0 !important; padding-right: 0 !important; } .columns { width: 100% !important; } .column { display: block !important; width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; margin-left: 0 !important; margin-right: 0 !important; } } </style>  <link href='https://fonts.googleapis.com/css?family=Muli&display=swap' rel='stylesheet'> <style> body { font-family: 'Muli', sans-serif; } </style>  </head> <body> <div class='wrapper' data-link-color='#1188E6' data-body-style='font-size:14px; font-family:inherit; color:#000000; background-color:#FFFFFF;'> <div class='webkit'> <table cellpadding='0' cellspacing='0' border='0' width='100%' class='wrapper' bgcolor='#FFFFFF'> <tbody> <tr> <td valign='top' bgcolor='#FFFFFF' width='100%'> <table width='100%' role='content-container' class='outer' align='center' cellpadding='0' cellspacing='0' border='0'> <tbody> <tr> <td width='100%'> <table width='100%' cellpadding='0' cellspacing='0' border='0'> <tbody> <tr> <td>  <table width='100%' cellpadding='0' cellspacing='0' border='0' style='width:100%; max-width:600px;' align='center'> <tbody> <tr> <td role='modules-container' style='padding:0px 0px 0px 0px; color:#000000; text-align:left;' bgcolor='#FFFFFF' width='100%' align='left'> <table class='module preheader preheader-hide' role='module' data-type='preheader' border='0' cellpadding='0' cellspacing='0' width='100%' style='display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;'> <tbody> <tr> <td role='module-content'> <p></p> </td> </tr> </tbody> </table> <table border='0' cellpadding='0' cellspacing='0' align='center' width='100%' role='module' data-type='columns' style='padding:30px 20px 30px 20px;' bgcolor='#f6f6f6'> <tbody> <tr role='module-content'> <td height='100%' valign='top'> <table class='column' width='540' style='width:540px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 10px;' cellpadding='0' cellspacing='0' align='left' border='0' bgcolor=''> <tbody> <tr> <td style='padding:0px;margin:0px;border-spacing:0;'> <table class='wrapper' role='module' data-type='image' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='72aac1ba-9036-4a77-b9d5-9a60d9b05cba'> <tbody> <tr> <td style='font-size:6px; line-height:10px; padding:0px 0px 0px 0px;' valign='top' align='center'> <img class='max-width' border='0' style='display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px;' width='230' alt='' data-proportionally-constrained='true' data-responsive='false' src='https://squakr.fr/uploads/pyt6ht4r8.png' height='200'> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='spacer' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='27716fe9-ee64-4a64-94f9-a4f28bc172a0'> <tbody> <tr> <td style='padding:0px 0px 30px 0px;' role='module-content' bgcolor=''> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='text' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='948e3f3f-5214-4721-a90e-625a47b1c957' data-mc-module-version='2019-10-22'> <tbody> <tr> <td style='padding:50px 30px 18px 30px; line-height:36px; text-align:inherit; background-color:#ffffff;' height='100%' valign='top' bgcolor='#ffffff' role='module-content'> <div> <div style='font-family: inherit; text-align: center'> <span style='font-size: 43px'>Thank you for your registration, @${req.body.username} ! </span> </div> <div> </div> </div> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='text' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='a10dcb57-ad22-4f4d-b765-1d427dfddb4e' data-mc-module-version='2019-10-22'> <tbody> <tr> <td style='padding:18px 30px 0px 30px; line-height:22px; text-align:inherit; background-color:#ffffff;' height='100%' valign='top' bgcolor='#ffffff' role='module-content'> <div> <div style='font-family: inherit; text-align: center'> <span style='color: #000000; font-size: 18px; font-family: arial,helvetica,sans-serif'>Verifying your address isn't required, but in addition to adding a great badge to your profile, it will reduce your chances of being suspended for automated behavior and propel your profile to the top of search results !</span> </div> <div style='font-family: inherit; text-align: center; margin-top:10px;'> <span style='color: #39aeb4; font-size: 18px;'><strong>Convinced ?</strong></span> </div> <div> </div> </div> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='spacer' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='7770fdab-634a-4f62-a277-1c66b2646d8d'> <tbody> <tr> <td style='padding:0px 0px 20px 0px;' role='module-content' bgcolor='#ffffff'> </td> </tr> </tbody> </table> <table border='0' cellpadding='0' cellspacing='0' class='module' data-role='module-button' data-type='button' role='module' style='table-layout:fixed;' width='100%' data-muid='d050540f-4672-4f31-80d9-b395dc08abe1'> <tbody> <tr> <td align='center' bgcolor='#ffffff' class='outer-td' style='padding:0px 0px 0px 0px;'> <table border='0' cellpadding='0' cellspacing='0' class='wrapper-mobile' style='text-align:center;'> <tbody> <tr> <td align='center' bgcolor='#ffbe00' class='inner-td' style='border-radius:6px; font-size:16px; text-align:center; background-color:inherit;'> <a href='https://squakr.fr/api/users/${user._id}/confirm?token=h8g5a-8z8ep-5z1ex' style='background-color:#4bd3db; border:1px solid #4bd3db; border-color:#4bd3db; border-radius:0px; border-width:1px; color:#000000; display:inline-block; font-size:14px; font-weight:normal; letter-spacing:0px; line-height:normal; padding:12px 40px 12px 40px; text-align:center; text-decoration:none; border-style:solid; font-family:inherit;' target='_blank'>Verify email</a> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> <table class='module' role='module' data-type='spacer' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;' data-muid='c37cc5b7-79f4-4ac8-b825-9645974c984e'> <tbody> <tr> <td style='padding:0px 0px 30px 0px;' role='module-content' bgcolor='#ffffff'> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> <div data-role='module-unsubscribe' class='module' role='module' data-type='unsubscribe' style='color:#444444; font-size:12px; line-height:20px; padding:16px 16px 16px 16px; text-align:Center;' data-muid='4e838cf3-9892-4a6d-94d6-170e474d21e5'> If you think you received this email by error, you can simply ignore it. <div class='Unsubscribe--addressLine'> <p class='Unsubscribe--senderName' style='font-size:12px; line-height:20px;'> <a href='https://squakr.fr'>Squakr.fr</a> </p> </div> </div> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </div> </div> </body> </html>`;
			}
			var transporter = nodemailer.createTransport({
				host: process.env.EMAIL_HOST,
				port: process.env.EMAIL_PORT,
				auth: {
					user: process.env.EMAIL_USER,
					pass: process.env.EMAIL_PASS
				},
				tls: {
					rejectUnauthorized: false
				}
			});

			var mailOptions = {
				from: `${process.env.APP_NAME || "Squakr"} <${process.env.EMAIL_HOST}>`,
				to: req.body.email,
				subject: subject,
				html: htmlmsg
			};

			transporter.sendMail(mailOptions, function (error, info) {
				if (error) {
					console.log(error);
				} else {
					console.log('Email sent : ' + info.response);
				}
			});
		}
		req.flash('status', '103')
		next();

	} catch (error) {
		req.flash('status', '512')
		res.redirect('/register');
		console.log(error);
	}
};


exports.heartTweet = async (req, res) => {
	backURL = req.header('Referer') || '/';
	if (!req.user) {
		req.flash('status', '301')
		return res.redirect(`/login`)
	}
	const hearts = req.user.hearts.map(obj => obj.toString());
	const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
	await User.findByIdAndUpdate(
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
						// console.log(result);
					}
				}
			);
			User.findByIdAndUpdate({
					_id: squak.author._id
				}, {
					$inc: {
						likes: 1
					},
					$addToSet: {
						notifications: {
							txt: `a aimé votre squak.`,
							txten: `liked your squak.`,
							url: `/squak/${req.params.id}`,
							author: req.user._id
						}
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
	await User.findByIdAndUpdate(
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
	}).populate('author').populate('squak');
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
					},
					$addToSet: {
						notifications: {
							txt: `a aimé votre réponse.`,
							txten: `liked your reply.`,
							url: `/squak/${reply.squak.shortid}`,
							author: req.user._id
						}
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
	res.redirect(`${backURL}`);
}


exports.verifyUser = async (req, res) => {
	if (!req.user.moderator) {
		res.redirect(`/`)
	}
	await User.findByIdAndUpdate(
		req.params.id, {
			'$set': {
				verified: true
			},
			$addToSet: {
				notifications: {
					txt: `a certifié votre compte !`,
					txten: `certified your account !.`,
					url: `/${req.user.username}`,
					author: req.user._id
				}
			}
		}
	);
	res.redirect(`back`)
}

exports.confirmUser = async (req, res) => {
	const user = await User.findByIdAndUpdate(
		req.params.id, {
			'$set': {
				confirmed: true
			}
		}
	);
	if (user && req.query.mod == 'true') {
		req.flash('status', '200')
		res.redirect(`/${user.username}`)
	} else if (user) {
		req.flash('status', '100')
		res.redirect(`/`)
	} else {
		req.flash('status', '401')
		res.redirect(`/`)
	}
}

exports.unConfirmUser = async (req, res) => {
	const user = await User.findByIdAndUpdate(
		req.params.id, {
			'$set': {
				confirmed: false
			}
		}
	);
	if (user && req.user && req.user.moderator == true) {
		req.flash('status', '200')
		res.redirect(`/${user.username}`)
	} else if (user && req.user) {
		req.flash('status', '600')
		res.redirect(`/`)
	} else if (user) {
		req.flash('status', '600')
		res.redirect(`/`)
	} else {
		req.flash('status', '800')
		res.redirect(`/`)
	}
}

exports.followUser = async (req, res) => {
	if (!req.user) {
		return res.redirect(`/login`)
	}
	const following = req.user.following.map(obj => obj.toString());
	const operator = following.includes(req.params.id) ? '$pull' : '$addToSet';
	await User.findByIdAndUpdate(
		req.user._id, {
			[operator]: {
				following: req.params.id
			}
		}, {
			new: true
		}
	);
	await User.findByIdAndUpdate(
		req.params.id, {
			[operator]: {
				followers: req.user._id,
				notifications: {
					txt: `vous suit.`,
					txten: `follows your account.`,
					url: `/${req.user.username}`,
					author: req.user._id
				}
			}
		}, {
			new: true
		}
	);

	res.redirect(`back`)
}


exports.followingProfilePage = async (req, res) => {
	try {
		if (req.user && req.user.lang == "en") {
			moment.locale('en')
		}
		const reqUser = await User.findOne({
			username: req.params.username
		});
		if (reqUser) {
			var followingids = reqUser.following
			followingids.reverse();
			var following = []
			for (const index in followingids) {
				if (followingids[index].toString() != reqUser._id.toString()) {
					following.push(
						await User.findOne({
							_id: followingids[index]
						})
					)
				}
			};
			following.sort(function (a, b) {
				return b.followers.length - a.followers.length;
			})
			res.render('following', {
				appname: process.env.APP_NAME || 'Squakr',
				appurl: process.env.APP_URL || 'Squakr.fr',
				appheader: process.env.APP_HEADER || 'Squakr.fr',
				reqUser,
				following
			});
			return;
		} else {
			// Else display a not found page
			res.render('404', {
				appname: process.env.APP_NAME || 'Squakr',
				appurl: process.env.APP_URL || 'Squakr.fr',
				appheader: process.env.APP_HEADER || 'Squakr.fr',
			})
		}
	} catch (e) {
		console.log(e);
		res.redirect('/')
	}
}

exports.followersProfilePage = async (req, res) => {
	try {
		if (req.user && req.user.lang == "en") {
			moment.locale('en')
		}
		const reqUser = await User.findOne({
			username: req.params.username
		});
		if (reqUser) {
			var followersids = reqUser.followers
			followersids.reverse();
			var followers = []
			for (const index in followersids) {
				followers.push(
					await User.findOne({
						_id: followersids[index]
					})
				)
			};
			followers.sort(function (a, b) {
				return b.followers.length - a.followers.length;
			})
			return res.render('followers', {
				appname: process.env.APP_NAME || 'Squakr',
				appurl: process.env.APP_URL || 'Squakr.fr',
				appheader: process.env.APP_HEADER || 'Squakr.fr',
				reqUser,
				followers
			});
		} else {
			// Else display a not found page
			res.render('404', {
				appname: process.env.APP_NAME || 'Squakr',
				appurl: process.env.APP_URL || 'Squakr.fr',
				appheader: process.env.APP_HEADER || 'Squakr.fr',
			})
		}
	} catch (e) {
		console.log(e);
		res.redirect('/')
	}
}
