// Calling the modules
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const appController = require('../controllers/appController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const squakController = require('../controllers/squakController');
const APIController = require('../controllers/APIController');

// Set up rate limiter: maximum of 500 requests per 15 minutes
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 500, // max 500 requests per windowMs
	message: 'Too many requests, please try again later.'
});

// Index page
router.get('/', limiter, appController.indexPage);

// Single tweet page
router.get('/squak/:id', limiter, squakController.singleTweetPage);
router.get('/squak/:id/json', limiter, APIController.SquakPage);
router.post('/squak/:id', limiter, squakController.singleTweetPage);
router.get('/reply/:id', limiter, squakController.singleReplyPage);
router.post('/reply/:id', limiter, squakController.singleReplyPage);

router.post('/api/squaks/:id/heart', limiter, userController.heartTweet);
router.post('/api/replies/:id/heart', limiter, userController.heartReply);
router.post('/api/squaks/:id/reply',
	limiter,
	squakController.uploadImage,
	squakController.postReply
);
router.get('/api/users/:id/verify', limiter, userController.verifyUser);
router.get('/api/users/:id/confirm', limiter, userController.confirmUser);
router.get('/api/users/:id/unconfirm', limiter, userController.unConfirmUser);
router.get('/api/users/:id/follow', limiter, userController.followUser);

// Registration page
router.get('/register', limiter, userController.registerPage);

// Connexion page
router.get('/login', limiter, userController.loginPage);

// Reset password page
// router.get('/reset', userController.resetPage);

router.get('/cgu', limiter, userController.cguPage);

router.get('/search', limiter, userController.searchPage);

router.get('/notifications', limiter, appController.notificationsPage);

router.get('/api', limiter, APIController.APIHomePage);
router.get('/api/squaks', limiter, APIController.APIGetSquaks);
router.get('/api/users', limiter, APIController.APIGetUsers);

// Registration POST request
router.post('/register',
	limiter,
	userController.verifyRegister,
	userController.checkUserExists,
	userController.registerUser,
	authController.login
);

// Login POST action
router.post('/login', limiter, authController.login);

// Logout route
router.get('/logout', limiter, authController.logout);


// Account page
router.get('/settings/account',
	limiter,
	authController.isLoggedIn,
	userController.accountPage);
router.get('/settings',
	limiter,
	authController.isLoggedIn,
	userController.settingsPage);
router.post('/settings/account',
	limiter,
	userController.upload,
	userController.accountUpdate);
router.post('/settings',
	limiter,
	userController.upload,
	userController.settingsUpdate);

// Uploading a profile image
router.post('/upload',
	limiter,
	userController.upload,
	userController.accountUpdate);

// Tweet Specific routes
router.post('/squak',
	limiter,
	squakController.uploadImage,
	squakController.postTweet);
router.get('/delete/:id',
	limiter,
	authController.isLoggedIn,
	squakController.deleteSquak);
router.get('/report/:id',
	limiter,
	authController.isLoggedIn,
	squakController.reportSquak);
router.post('/pin/:id',
	limiter,
	authController.isLoggedIn,
	squakController.pinSquak);


router.get('/:username/likes', limiter, userController.likesProfilePage);
router.get('/:username/following', limiter, userController.followingProfilePage);
router.get('/:username/followers', limiter, userController.followersProfilePage);
router.get('/:username/json', limiter, APIController.ProfilePage);


// Profile Page at the end because :username
router.get('/:username', limiter, userController.profilePage);




// Exporting the module
module.exports = router;
