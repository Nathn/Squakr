const express = require('express');
const app = express();
const promisify = require('es6-promisify');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const expressValidator = require('express-validator');
const routes = require('./routes');
require('./handlers/passport');

// Dot Env
require('dotenv').config({ path: 'variables.env' });

// Mongoose
mongoose.connect(process.env.DATABASE);
mongoose.Promise = global.Promise;
mongoose.connection.on('error', (err) => {
	console.log('We have an error with the database: ' + err);
})

// Express session
app.use(session({ secret: process.env.SECRET }));

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
app.use(bodyParser.urlencoded({ extended: true }));

// Express validator
app.use(expressValidator());

// Locals
app.use((req, res, next) => {
	res.locals.user = req.user || null;
	next();
});

// Setting up the routes
app.use('/', routes);

const PORT = process.env.PORT || 3000;

// Starting the server
app.listen(PORT, () => console.log('We have a server running on PORT: ' + PORT));
