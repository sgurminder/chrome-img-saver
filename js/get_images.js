

function gDriveCallback() {
    chrome.identity.getAuthToken({interactive: true }, function(token){
	if(chrome.runtime.lastError){
	    alert(chrome.runtime.lastError.message);
	    return;
	}
	console.log("token is " + token);
    });
}				 


// Get images by sending message to content script attached to current tab
function getAllImages(callback)  {

    var queryInfo = {
	active: true,
	currentWindow: true
    };

    chrome.tabs.query(queryInfo, function (tabs) {
	
	var tab = tabs[0];
	var tab_id = tab.id;
	var msg = {
	    get: "images"
	};
	chrome.tabs.sendMessage(tab_id,msg, function(response) {
	    console.log("Received response for " + response.num_of_images + "images" );
	   console.log(response.Images);
	    response.Images.forEach(function(image) {
		console.log(image);
		//chrome identity and Drive API access token
		gDriveCallback();
	    });
	});
    });
}


document.addEventListener('DOMContentLoaded', function() {
    getAllImages(function() {
	console.log("Received response from content script");
    });


});

