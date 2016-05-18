

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
	    // callback for sending data to google drive
	    //callback(list)
	    console.log("Received response");
	    response.image_urls.forEach(function(image) {
		console.log(image);
	    });
	});
    });
//    callback();
}


document.addEventListener('DOMContentLoaded', function() {
    getAllImages(function() {
	console.log("Received response from content script");
    });
});

