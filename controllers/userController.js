// Importing the model for use on this controller
const User = require('../models/User');
const Tweet = require('../models/Tweet');
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
		var months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
		if (reqUser) {
			// Find all tweets by that user with the _id
			const tweets = await Tweet.find({
				author: reqUser._id
			}).populate('author').sort({
				created: 'desc'
			});


			// Display the profile page
			res.render('profile', {
				reqUser,
				tweets,
				moment,
				months
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
		const reqUser = await User.findOne({
			username: req.params.username
		});
		var months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
		if (reqUser) {

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
				likes
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
			email: req.body.email,
			website: req.body.website,
			bio: req.body.bio,
			avatar: req.body.avatar || req.user.avatar,
			banner: req.body.banner || req.user.banner
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

		res.redirect('/account?msg=account_updated')
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
				message: 'Le fichier sélectionné n\'est pas une image valide.'
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
	req.checkBody('username', 'Le nom d\'utilisateur ne peut pas être vide').notEmpty();
	req.check('username', 'Le nom \'utilisateur ne peut pas contenir d\'espaces').custom(value => !/\s/.test(value))
	req.check('username', 'Le nom \'utilisateur ne peut pas contenir de caractères spéciaux').custom(value => /^[0-9a-zA-Z]+$/.test(value))
	req.sanitizeBody('email');
	req.checkBody('email', 'L\'email ne peut pas être vide').notEmpty();
	req.checkBody('email', 'L\'email spécifié n\'est pas valide').isEmail();
	req.checkBody('password', 'Le mot de passe ne peut pas être vide').notEmpty();
	req.checkBody('password-confirm', 'La confirmation de mot de passe ne peut pas être vide').notEmpty();
	req.checkBody('password-confirm', 'Les mots de passe ne correspondent pas').equals(req.body.password);

	const errors = req.validationErrors();
	if (errors) {
		console.log(errors);
		res.redirect(`back`)
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
		res.send('Un utilisateur est déjà inscrit avec ce nom d\'utilisateur ou cette adresse email');
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


// Heart a tweet
exports.heartTweet = async (req, res) => {
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
	res.redirect('back')
}
