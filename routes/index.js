// Calling the modules
const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const tweetController = require('../controllers/tweetController');

// Index page
router.get('/', appController.indexPage);

// Single tweet page
router.get('/squak/:id', tweetController.singleTweetPage);
// router.get('/reply/:id', tweetController.singleReplyPage);

// API
////////////////////////////////
router.post('/api/tweets/:id/heart', userController.heartTweet)

router.post('/api/replies/:id/heart', userController.heartReply)

router.post('/api/tweets/:id/reply',
	tweetController.uploadImage,
	tweetController.postReply
)

router.get('/api/users/:id/verify', userController.verifyUser)

router.get('/api/users/:id/confirm', userController.confirmUser)

router.get('/api/users/:id/follow', userController.followUser)

// Registration page
router.get('/register', userController.registerPage);

// Connexion page
router.get('/login', userController.loginPage);

router.get('/cgu', userController.cguPage);

router.get('/search', userController.searchPage);

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
router.get('/settings/account',
	authController.isLoggedIn,
	userController.accountPage);
router.get('/settings',
	authController.isLoggedIn,
	userController.settingsPage);

router.post('/settings/account',
	userController.upload,
	userController.accountUpdate);

router.post('/settings',
	userController.upload,
	userController.settingsUpdate);

// Uploading a profile image
router.post('/upload',
	userController.upload,
	userController.accountUpdate);

// Tweet Specific routes
///////////////////////////////
router.post('/squak',
	tweetController.uploadImage,
	tweetController.postTweet);

router.get('/delete/:id',
	authController.isLoggedIn,
	tweetController.deleteTweet);


router.get('/:username/likes', userController.likesProfilePage);
router.get('/:username/following', userController.followingProfilePage);
router.get('/:username/followers', userController.followersProfilePage);


// Profile Page at the end because :username
router.get('/:username', userController.profilePage);





// Exporting the module
module.exports = router;
