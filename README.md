<!-- markdownlint-disable MD033 -->
# Squakr

A new social network designed to be easy to use, save no data and let the user be in control of what he sees in his news feed.<br/>
Originally forked from [TamalAnwar/twitter-clone-new](https://github.com/TamalAnwar/twitter-clone-new).

➡️ <https://squakr.fr/>

![status](https://img.shields.io/website?url=https%3A%2F%2Fwww.squakr.fr)

- [Features](#features)
- [Screenshots](#screenshots)
- [Build your own Squakr](#build-your-own-squakr)
- [Environnement Variables](#environnement-variables)

## Features

- Account system with crypted passwords
- Email verification system (only email-verified users can reach the home page of visitors)
- Microblogging system with image and video uploads support
- Hashtags and user mentions support
- Likes and replies
- Follow system and custom timeline
- Search function among users and squaks
- Notifications on follows, likes, replies and mentions
- Verification badge
- Moderators who can delete squaks and verify users
- Report system that sends a notification to all moderators
- Appearance settings (dark theme, developper mode, etc)
- Open API (read-only)
- English and French supported (other languages coming soon)

## Screenshots

<p style="text-align: center;">
<img src="https://raw.githubusercontent.com/Nathn/Squakr/master/screenshot-home.png" alt="Homepage" width="600"/>
<br/>
<i>Homepage</i>
</p>
<br/>
<p style="text-align: center;">
<img src="https://raw.githubusercontent.com/Nathn/Squakr/master/screenshot-home-dark.png" alt="Homepage" width="600"/>
<br/>
<i>Homepage (dark theme)</i>
</p>
<br/>
<p style="text-align: center;">
<img src="https://raw.githubusercontent.com/Nathn/Squakr/master/screenshot-search.png" alt="Search" width="600"/>
<br/>
<i>Search results page</i>
</p>
<br/>
<p style="text-align: center;">
<img src="https://raw.githubusercontent.com/Nathn/Squakr/master/screenshot-profile.png" alt="Profile" width="600"/>
<br/>
<i>User Profile</i>
</p>
<br/>

## Build your own Squakr

You can easily build and host your own version of Squakr to give your community a safe space to talk.<br/>Here's how :

1. Make sure you have Git and NPM installed.
2. Clone this repository locally with `git clone https://github.com/Nathn/Squakr`.
3. Inside the folder, create a `variables.env` file and add the required [envirronnement variables](#environnement-variables).
4. Execute `npm install` to install the dependencies.
5. Execute `npm start` to start the server.
6. Open you browser and point it to `http://localhost:3000/` (you can change the port with the environnement variable `PORT`)
7. Happy Coding !

<br/>

## Environnement Variables

You have to declare these variables in a `variables.env` file inside of your root folder in order to make your Squakr installation work correctly with the 5 required variables, and to personnalize it with the other ones. If you are not familiar with the env syntax, you can use the file `variables.env.example` as a model.</br>
You will have to create a (free) account on <https://cloudinary.com/> to host image and video uploads. No CB needed and you will only be limited when you reach 1 GB per month.

- `DATABASE` : The URL of the MongoDB database you want to use. On local, if you have MongoDB installed on your machine, it will be `mongodb://localhost/squakr`.
- `SECRET` : A secret string that will be use by Express to configure sessions. Make it secure if possible.
- `CLOUD_NAME` : Your Cloudinary cloud name (you can find these informations on the top of the Cloudinary dashboard).
- `CLOUD_API_KEY` : Your Cloudinary API Key (you can find these informations on the top of the Cloudinary dashboard).
- `CLOUD_API_SECRET` : Your Cloudinary API Secret (you can find these informations on the top of the Cloudinary dashboard). Do not share it !
- `APP_NAME` (optionnal) : The name of the app, displayed in various places.  Default is Squakr.
- `APP_URL` (optionnal) : The URL (without HTTP and WWW) of the app, displayed on some places. Default is Squakr.fr.
- `APP_HEADER` (optionnal) : The title displayed on the header of all pages. Default is Squakr.fr.
- `PORT` (optionnal) : The localhost port you want the app to run on. Change it if you have already something running on port 3000.
- `TOKEN` (optionnal) : If you want to have a Discord Bot that sends a message in a channel when an user joins your Squakr, paste its token here.
- `CHANNEL_ID` (optionnal) : The Discord channel ID the bot will sends the message in.
- `EMAIL_USER` (optionnal) : The email adress confirmation mails will come from.
- `EMAIL_HOST` (optionnal) : The outgoing mail server of the email (often something like `smtp.example.com`).
- `EMAIL_PASS` (optionnal) : The password of the email.
- `DEFAULT_FOLLOW_FR_1` (optionnal) : The ID of the account to which new users who have selected French as their language will be following by default. You can get IDs directy from the app by turning on the **developer mode** in the settings, go to the wanted profile and click **Copy ID**.
- `DEFAULT_FOLLOW_FR_2` (optionnal) : The ID of a second account to which new users who have selected French as their language will be following by default. To add more, you have to edit the file `controllers/userController.js` (line ~580)
- `DEFAULT_FOLLOW_EN_1` (optionnal) : The ID of the account to which new users who have selected English as their language will be following by default.
- `DEFAULT_FOLLOW_EN_2` (optionnal) : The ID of a second account to which new users who have selected English as their language will be following by default. To add more, you have to edit the file `controllers/userController.js` (line ~620)
