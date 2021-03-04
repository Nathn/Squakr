async function copyID(id, dataurl, squak=false) {
	if (squak) {
		var urlpattern = '/squak/'
	} else {
		var urlpattern = '/'
	}
	if (!navigator.clipboard) {
    	// Clipboard API not available
    	if (document.getElementById("status")) {
			document.getElementById("status").innerHTML = `L\'interaction avec le presse-papier n\'est pas disponible pour votre navigateur.<br />Vous pouvez changer de navigateur ou retrouver l\'ID dans la <a href="${urlpattern}${dataurl}/json" style="text-decoration: none; color: white; border-bottom: 1px solid white; cursor: pointer">page de données JSON</a>.` + '<br/ ><a onclick="clearStatus();" style="text-decoration: none; color: white; border-bottom: 1px solid white; cursor: pointer"><small>Fermer</small></a>'
		} else if (document.getElementById("statusen")) {
			document.getElementById("statusen").innerHTML = `Interaction with the clipboard is not available for your browser.<br />You can still change browser or find the ID in the <a href="${urlpattern}${dataurl}/json" style="text-decoration: none; color: white; border-bottom: 1px solid white; cursor: pointer">JSON data page</a>.` + '<br/ ><a onclick="clearStatus();" style="text-decoration: none; color: white; border-bottom: 1px solid white; cursor: pointer"><small>Close</small></a>'
		}
  	}
	try {
  		await navigator.clipboard.writeText(id)
		if (document.getElementById("status")) {
			document.getElementById("status").innerHTML = 'L\'ID a été copié.' + '<br/ ><a onclick="clearStatus();" style="text-decoration: none; color: white; border-bottom: 1px solid white; cursor: pointer"><small>Fermer</small></a>'
		} else if (document.getElementById("statusen")) {
			document.getElementById("statusen").innerHTML = 'The ID has been copied.' + '<br/ ><a onclick="clearStatus();" style="text-decoration: none; color: white; border-bottom: 1px solid white; cursor: pointer"><small>Close</small></a>'
		}
	} catch (e) {
		if (document.getElementById("status")) {
			document.getElementById("status").innerHTML = `L\'interaction avec le presse-papier n\'est pas disponible pour votre navigateur.<br />Vous pouvez changer de navigateur ou retrouver l\'ID dans la <a href="${urlpattern}${dataurl}/json" style="text-decoration: none; color: white; border-bottom: 1px solid white; cursor: pointer">page de données JSON</a>.` + '<br/ ><a onclick="clearStatus();" style="text-decoration: none; color: white; border-bottom: 1px solid white; cursor: pointer"><small>Fermer</small></a>'
		} else if (document.getElementById("statusen")) {
			document.getElementById("statusen").innerHTML = `Interaction with the clipboard is not available for your browser.<br />You can still change browser or find the ID in the <a href="${urlpattern}${dataurl}/json" style="text-decoration: none; color: white; border-bottom: 1px solid white; cursor: pointer">JSON data page</a>.` + '<br/ ><a onclick="clearStatus();" style="text-decoration: none; color: white; border-bottom: 1px solid white; cursor: pointer"><small>Close</small></a>'
		}
	}
}
