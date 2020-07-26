const passport = require('passport');

exports.login = passport.authenticate('local', {
	failureRedirect: '/?msg=login_failed',
	successRedirect: '/?msg=login_success'
});

exports.logout = (req, res) => {
	req.logout();
	res.redirect('/?msg=logout')
}

exports.isLoggedIn = (req, res, next) => {
	if (!req.isAuthenticated()) {
		res.redirect('/?msg=need_login');
		return;
	}

	next();
}
