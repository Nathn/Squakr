// Calling the modules
const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const nweetController = require('../controllers/nweetController');

// Index page
router.get('/', appController.indexPage);

// Single nweet page
router.get('/nweet/:id', nweetController.singlenweetPage);

// API
////////////////////////////////
router.post('/api/nweets/:id/heart', userController.heartnweet)

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

// nweet Specific routes
///////////////////////////////
router.post('/nweet', nweetController.postnweet);

router.get('/delete/:id',
	authController.isLoggedIn,
	nweetController.deletenweet);

// Profile Page at the end because :username
router.get('/:username', userController.profilePage);




// Exporting the module
module.exports = router;
