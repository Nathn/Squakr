function GetURLParameter(sParam) {
	var sPageURL = window.location.search.substring(1);
	var sURLVariables = sPageURL.split('&');
	for (var i = 0; i < sURLVariables.length; i++) {
		var sParameterName = sURLVariables[i].split('=');
		if (sParameterName[0] == sParam) {
			return sParameterName[1];
		}
	}
}

function GetStatusString(status) {
	if (status == '100') return 'Votre email a bien été confirmé.'
	if (status == '101') return 'L\'ID a été copié.'
	if (status == '102') return 'Le signalement a bien été transmis.'
	if (status == '200') return 'OK'
	if (status == '300') return 'La connexion a échoué, veuillez réessayer.'
	if (status == '301') return 'Vous devez être connecté pour effectuer cette action.'
	if (status == '400') return 'L\'envoi du squak a échoué. Si le problème persiste, veuillez contacter un administatreur.'
	if (status == '401') return 'Votre lien de confirmation n\'est pas valide. Si votre lien est le bon, veuillez envoyer un email à contact@squakr.fr'
	if (status == '402') return 'Votre squak ne peut pas être vide.'
	if (status == '403') return 'L\'envoi de l\'image a échoué, vérifiez qu\'elle fasse moins de 10 Mo ainsi que son format.\nSi le problème persiste, veuillez contacter un administatreur.'
	if (status == '404') return 'Squak non trouvé.'
	if (status == '405') return 'L\'envoi de la vidéo a échoué, vérifiez qu\'elle fasse moins de 100 Mo ainsi que son format.\nSi le problème persiste, veuillez contacter un administatreur.'
	if (status == '450') return 'La recherche ne peut pas être vide.'
	if (status == '451') return 'La recherche ne peut pas contenir des caractères non alphanumériques.'
	if (status == '500') return 'Le nom d\'utilisateur ne peut pas être vide.'
	if (status == '501') return 'Le nom d\'utilisateur ne peut pas contenir d\'espaces.'
	if (status == '502') return 'Le nom d\'utilisateur ne peut pas contenir de caractères spéciaux.'
	if (status == '503') return 'L\'email ne peut pas être vide.'
	if (status == '504') return 'L\'email spécifié n\'est pas valide.'
	if (status == '505') return 'Le mot de passe ne peut pas être vide.'
	if (status == '506') return 'La confirmation de mot de passe ne peut pas être vide.'
	if (status == '507') return 'Les mots de passe ne correspondent pas.'
	if (status == '508') return 'Un utilisateur est déjà inscrit avec ce nom d\'utilisateur.'
	if (status == '509') return 'Un utilisateur est déjà inscrit avec cette adresse email.'
	if (status == '510') return 'Le nom d\'utilisateur ne peut pas contenir plus de 16 caractères.'
	if (status == '511') return 'Le nom d\'utilisateur choisi est réservé pour des raisons techniques.'
	if (status == '512') return 'Une erreur inconnue est survenue lors de l\'inscription. Si le problème persiste, veuillez contacter un administatreur.'
	if (status == '600') return 'Vous n\'avez pas assez de permissions pour faire ça.'
	return;
}

function GetStatusStringEn(status) {
	if (status == '100') return 'The email has been confirmed.'
	if (status == '101') return 'The ID has been copied.'
	if (status == '200') return 'OK'
	if (status == '300') return 'The connection failed, please retry.'
	if (status == '301') return 'You have to be logged in to do this.'
	if (status == '400') return 'Squak upload failed. If the problem persists, please contact an administrator.'
	if (status == '401') return 'Confirmation link not valid. If you are sure this is the right link, please send a message to contact@squakr.fr.'
	if (status == '402') return 'Your squak cannot be blank.'
	if (status == '403') return 'Image upload failed, please verify its format and its size (max : 10 Mb).\nIf the problem persists, please contact an administrator.'
	if (status == '404') return 'Squak not found.'
	if (status == '405') return 'Video upload failed, please verify its format and its size (max : 100 Mb).\nIf the problem persists, please contact an administrator.'
	if (status == '450') return 'The search query cannot be blank.'
	if (status == '451') return 'The search query cannot contain non-alphanumeric characters.'
	if (status == '500') return 'The username cannot be blank.'
	if (status == '501') return 'The usermane connot contain spaces.'
	if (status == '502') return 'The username can only contain letters, numbers and underscores.'
	if (status == '503') return 'The email cannot be blank.'
	if (status == '504') return 'The email is not valid.'
	if (status == '505') return 'The password cannot be blank.'
	if (status == '506') return 'The password confirmation cannot be blank.'
	if (status == '507') return 'The passwords don\'t match.'
	if (status == '508') return 'An user is already registered with this username.'
	if (status == '509') return 'An user is already registered with this email.'
	if (status == '510') return 'The username cannot contain more than 16 characters.'
	if (status == '511') return 'The chosen username is reserved for technical reasons.'
	if (status == '512') return 'An unknown error occurred during registration. If the problem persists, please contact an administrator.'
	if (status == '600') return 'You don\'t have enough permissions to do this.'
	return;
}

function offsetAnchor() {
	if (location.hash.length !== 0) {
		window.scrollTo(window.scrollX, window.scrollY - 300);
	}
}

function getOutput(type) {
	var outputfile = document.getElementById('outputfile');
	var uploadimg = document.getElementById('uploadimg');
	var uploadvideo = document.getElementById('uploadvideo');
	var squak_textarea = document.getElementById('squak_textarea');
	var icon_set = document.getElementById('icon_set');
	if (type == "image") {
		squak_textarea.dataset['output'] = 1
		icon_set.dataset['output'] = 1
		outputfile.innerHTML = uploadimg.value.replace(/.*[\/\\]/, '') + ' <i class="fa fa-trash" title="Supprimer" onclick="clearInput()" style="color: #1091FF; cursor: pointer;"></i>';
		uploadvideo.value = ''
	}
	if (type == "video") {
		squak_textarea.dataset['output'] = 1
		icon_set.dataset['output'] = 1
		outputfile.innerHTML = uploadvideo.value.replace(/.*[\/\\]/, '') + ' <i class="fa fa-trash" title="Supprimer" onclick="clearInput()" style="color: #1091FF; cursor: pointer;"></i>';
		uploadimg.value = ''
	}
	return false;
}

function clearInput() {
	squak_textarea.dataset['output'] = 0
	icon_set.dataset['output'] = 0
	outputfile.innerHTML = '';
	uploadimg.value = ''
	uploadvideo.value = ''
	return false;
}

function dispStatus(status) {
	console.log("Status code : " + status)
	if (GetStatusString(status)) {
		if (GetStatusString(status) == "OK") return "OK";
		if (document.getElementById("regstatus")) {
			document.getElementById("regstatus").innerHTML = GetStatusString(status)
		} else if (document.getElementById("loginstatus")) {
			document.getElementById("loginstatus").innerHTML = GetStatusString(status)
		} else if (document.getElementById("status")) {
			document.getElementById("status").innerHTML = GetStatusString(status) + '<br/ ><a onclick="clearStatus();" style="text-decoration: none; color: white; border-bottom: 1px solid white; cursor: pointer"><small>Fermer</small></a>'
		} else if (document.getElementById("statusen")) {
			document.getElementById("statusen").innerHTML = GetStatusStringEn(status) + '<br/ ><a onclick="clearStatus();" style="text-decoration: none; color: white; border-bottom: 1px solid white; cursor: pointer"><small>Close</small></a>'
		}
	}
}

function clearStatus() {
	if (document.getElementById("status")) {
		document.getElementById("status").innerHTML = ""
	} else if (document.getElementById("statusen")) {
		document.getElementById("statusen").innerHTML = ""
	}
}

function changeTheme() {
	if (document.getElementById("themeswitch")) {
		if (document.getElementById("themeswitch").checked) {
			var body = document.getElementsByTagName("body")[0];
			body.dataset['theme'] = 'dark';
			if (document.getElementsByClassName("currenttheme")[0]) {
				document.getElementsByClassName("currenttheme")[0].innerHTML = 'Nuit'
			} else if (document.getElementsByClassName("currentthemeen")[0]) {
				document.getElementsByClassName("currentthemeen")[0].innerHTML = 'Dark'
			}
		} else {
			var body = document.getElementsByTagName("body")[0];
			body.dataset['theme'] = 'light';
			if (document.getElementsByClassName("currenttheme")[0]) {
				document.getElementsByClassName("currenttheme")[0].innerHTML = 'Jour'
			} else if (document.getElementsByClassName("currentthemeen")[0]) {
				document.getElementsByClassName("currentthemeen")[0].innerHTML = 'Light'
			}
		}
	}
}


function toggleEmoji() {
	document.getElementsByClassName('emojiMenu')[0].classList.toggle('shown')
}

document.addEventListener("DOMContentLoaded", function(event) {
	if (document.querySelector('emoji-picker')) document.querySelector('emoji-picker').addEventListener('emoji-click', event => document.getElementsByClassName("squak_textarea")[0].value += `${event.detail.unicode} `);
	if (document.querySelector('emoji-picker')) {
		document.addEventListener('click', function (event) {
			var isClickInside = document.querySelector('emoji-picker').contains(event.target) || document.getElementById('emojiButton').contains(event.target);
			if (!isClickInside) {
				if ((document.getElementsByClassName('emojiMenu')[0].classList[1] == 'shown')) toggleEmoji();
			}
		});
	}
	if (document.getElementsByClassName('squak_textarea')[0]) document.getElementsByClassName('squak_textarea')[0].addEventListener('focus', event => {
		if (document.getElementsByClassName('emojiMenu')[0].classList[1] == 'shown') {
			toggleEmoji();
		}
	});
});

window.addEventListener("hashchange", offsetAnchor);
window.setTimeout(offsetAnchor, 1);
