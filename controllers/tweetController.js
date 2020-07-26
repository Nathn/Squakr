const nweet = require('../models/nweet');
const moment = require('moment');
moment.locale('fr')

// Home page to list all nweets
exports.postnweet = async (req, res) => {
	try {
		req.body.author = req.user._id;
		const nweet = new nweet(req.body);
		await nweet.save();
		res.redirect('back');
		// res.json(req.body)


	} catch (e) {
		console.log(e);
		res.redirect('/?msg=Failed to nweet')
	}
}




// Delete a nweet controller
// nweet deleting function
const confirmedOwner = (nweet, user) => {
	if (!nweet.author.equals(user._id)) {
		// You don't have permission to delete this.
		throw Error('You don\'t have permission to delete this')
	}
}


exports.deletenweet = async (req, res) => {
	try {
		const nweet = await nweet.findOne({
			_id: req.params.id
		});
		if (!req.user.username === 'tamal') {
			confirmedOwner(nweet, req.user);
		}

		const deletenweet = await nweet.deleteOne(nweet);
		res.redirect('back')
	} catch (e) {
		console.log(e);
		res.redirect('/?msg=Failed to delete')
	}


}

// Getting a single nweet
exports.singlenweetPage = async (req, res) => {
	try {
		const nweet = await nweet.findOne({
			_id: req.params.id
		}).populate('author');
		res.render('single', {
			nweet,
			moment
		});

	} catch (err) {
		console.log(err);
		res.redirect('/?msg=No nweets found')
	}

}
