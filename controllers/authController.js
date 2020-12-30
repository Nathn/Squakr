const passport = require('passport');

exports.login = passport.authenticate('local', {
	failureRedirect: '/login',
	successRedirect: '/',
	failureFlash: '300'
});

exports.logout = (req, res) => {
	req.logout();
	res.redirect('/')
}

exports.isLoggedIn = (req, res, next) => {
	if (!req.isAuthenticated()) {
		req.flash('status', '301')
		res.redirect('/');
		return;
	}

	next();
}
