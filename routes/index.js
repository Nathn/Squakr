// Calling the modules
const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const tweetController = require('../controllers/tweetController');

// Index page
router.get('/', appController.indexPage);

// Single nweet page
router.get('/nweet/:id', tweetController.singleTweetPage);

// API
////////////////////////////////
router.post('/api/tweets/:id/heart', userController.heartTweet)
router.post('/api/users/:id/verify', userController.verifyUser)

// Registration page
router.get('/register', userController.registerPage);

// Connexion page
router.get('/login', userController.loginPage);

// Registration POST request
router.post('/register',
	userController.verifyRegister,
	userController.checkUserExists,
	userController.registerUser,
	authController.login
)

// Login POST action
router.post('/login', authController.login);

// Logout route
router.get('/logout', authController.logout);


// Account page
router.get('/account',
	authController.isLoggedIn,
	userController.accountPage);

router.post('/account',
	userController.upload,
	userController.resize,
	userController.accountUpdate);

// Uploading a profile image
router.post('/upload',
	userController.upload,
	userController.resize,
	userController.accountUpdate);

// Tweet Specific routes
///////////////////////////////
router.post('/nweet', tweetController.postTweet);

router.get('/delete/:id',
	authController.isLoggedIn,
	tweetController.deleteTweet);


router.get('/:username/likes', userController.likesProfilePage);


// Profile Page at the end because :username
router.get('/:username', userController.profilePage);





// Exporting the module
module.exports = router;
