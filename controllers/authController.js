const passport = require('passport');

exports.login = passport.authenticate('local', {
	failureRedirect: '/login?err=300',
	successRedirect: '/'
});

exports.logout = (req, res) => {
	req.logout();
	res.redirect('/')
}

exports.isLoggedIn = (req, res, next) => {
	if (!req.isAuthenticated()) {
		res.redirect('/?err=301');
		return;
	}

	next();
}
