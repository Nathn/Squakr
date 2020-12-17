const express = require('express');
const fileupload = require('express-fileupload')
const app = express();
const promisify = require('es6-promisify');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');
const expressValidator = require('express-validator');
const routes = require('./routes');
require('./handlers/passport');

// Dot Env
require('dotenv').config({
	path: 'variables.env'
});

cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.CLOUD_API_KEY,
	api_secret: process.env.CLOUD_API_SECRET
});

// Mongoose
mongoose.connect(process.env.DATABASE, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});
mongoose.set('useFindAndModify', false);
mongoose.Promise = global.Promise;
mongoose.connection.on('error', (err) => {
	console.log('Une erreur est survenue avec la base de données : ' + err);
})

// Express session
app.use(session({
	secret: process.env.SECRET
}));

app.use(fileupload({
	useTempFiles: true
}));

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.setHeader('Access-Control-Allow-Credentials', true);
	next();
});


// Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Setting up views
app.set('views', (__dirname + '/views'));
app.set('view engine', 'pug');

// Public folder
app.use(express.static(__dirname + '/public'));
app.use('/uploads', express.static(__dirname + '/public'));

// Body Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

// Express validator
app.use(expressValidator());

// Locals
app.use((req, res, next) => {
	res.locals.user = req.user || null;
	next();
});

// Setting up the routes
app.use('/', routes);

const port = process.env.PORT || 3000;

// Starting the server
app.listen(port);
