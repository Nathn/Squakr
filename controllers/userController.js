// Importing the model for use on this controller
const User = require('../models/User');
const nweet = require('../models/nweet');
const promisify = require('es6-promisify');
const moment = require('moment');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
moment.locale('fr')

// The default controller for this app
exports.registerPage = (req, res) => {
	res.render('register');
}

exports.loginPage = (req, res) => {
	res.render('login');
}

// The profile page controller
exports.profilePage = async (req, res) => {
	try {
		const reqUser = await User.findOne({
			username: req.params.username
		});

		if (reqUser) {
			// Find all nweets by that user with the _id
			const nweets = await nweet.find({
				author: reqUser._id
			}).populate('author').sort({
				created: 'desc'
			});

			// Display the profile page
			res.render('profile', {
				reqUser,
				nweets,
				moment
			});
			return;
		}

		// Else display a not found page
		// res.redirect('/404');


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
			email: req.body.email,
			website: req.body.website,
			bio: req.body.bio,
			avatar: req.body.avatar || req.user.avatar
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

		res.redirect('/account?msg=account updated')
	} catch (e) {
		console.log(e);
		res.redirect('back')
	}
}

// Image upload middlewares
const multerOptions = {
	storage: multer.memoryStorage(),
	fileFilter(req, file, next) {
		const isImage = file.mimetype.startsWith('image/');

		if (isImage) {
			next(null, true);
		} else {
			next({
				message: 'You must supply a valid image file.'
			}, false)
		}
	}
}

exports.upload = multer(multerOptions).single('avatar');

exports.resize = async (req, res, next) => {
	if (!req.file) {
		next();
		return;
	}

	const extension = req.file.mimetype.split('/')[1];
	req.body.avatar = `${uuid.v4()}.${extension}`;

	const image = await jimp.read(req.file.buffer);
	await image.resize(300, 300);
	await image.write(`./public/uploads/${req.body.avatar}`);
	next();


}

// Registration page middlewares
// Verify the reg data
exports.verifyRegister = async (req, res, next) => {
	req.sanitizeBody('username');
	req.checkBody('username', 'Username should not be empty!').notEmpty();
	req.sanitizeBody('email');
	req.checkBody('email', 'Email should not be empty').notEmpty();
	req.checkBody('email', 'You must enter a valid email to register').isEmail();
	req.checkBody('password', 'Password should not be empty').notEmpty();
	req.checkBody('password-confirm', 'Password confirmation should not be empty').notEmpty();
	req.checkBody('password-confirm', 'Both passwords does not match!').equals(req.body.password);

	const errors = req.validationErrors();
	if (errors) {
		console.log(errors);
		res.redirect('back')
		return;
	}
	next();
}

// Check if the user already exists Will hook it up later
exports.checkUserExists = async (req, res, next) => {
	const user = await User.find({
		username: req.body.username,
		email: req.body.email
	})

	// console.log(user);

	if (user.length) {
		res.send('A user already exists with the username or email.');
		return;
	}
	next();
}

// Register the user into the database
exports.registerUser = async (req, res, next) => {
	try {
		const user = new User({
			username: req.body.username,
			email: req.body.email
		});

		const register = promisify(User.register, User);
		await register(user, req.body.password);
		// res.send('User registration successfull!')
		next();

	} catch (error) {
		res.redirect('/register');
		console.log(error);
	}
}


// Heart a nweet
exports.heartnweet = async (req, res) => {
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
}
