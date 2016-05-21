

var t = { };

function apiInit(){
    var event = new Event('apiLoaded');

    document.dispatchEvent(event);
}


 var authToken = {};
function init() {

    getToken();

    function getToken() {
	chrome.identity.getAuthToken({interactive: true}, function(t){
	    if(chrome.runtime.lastError){
		alert(chrome.runtime.lastError.message);
		return;
	    }
	    authToken.access_token = t;
	    console.log(t);

	    console.log("Loaded javscript client library");
	    console.log("token is " + authToken.access_token);
	    gapi.auth.setToken(authToken);
	    gapi.client.load("drive","v3",function(){
		console.log("loaded drive api");
		var request = gapi.client.drive.files.list({q: "name='Saved images'"});
		request.execute(function(response){
		    console.log(response.files.length);
		    if(response.files.length == 0){
			var body = {
			    "name": "Saved images",
			    "mimeType": "application/vnd.google-apps.folder"
			}
			request = gapi.client.drive.files.create(body);
			request.execute(function(response){
			    console.log(response);
			});
		    }
		    
		    getAllImages(function () {
			console.log("Fetched images");
		    });
		});
	    });
	    
	});
    }
}
//    gapi.auth.authorize(params, function(token){
//	console.log("access token " + token.access_token);
  //  });


function xhrWithAuth(method, url, interactive, body,callback){
    var access_token;
    
    getToken();
    
    function getToken() {
	chrome.identity.getAuthToken({interactive: interactive}, function(token){
	    if(chrome.runtime.lastError){
		alert(chrome.runtime.lastError.message);
		return;
	    }
	    console.log(token);
	    access_token = token;
	    
	    requestStart();

	});
    }
    
    function requestStart() {
	var xhr = new XMLHttpRequest();
	console.log(url);
	xhr.open(method,url);
	xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
	xhr.setRequestHeader('Content-Type','application/json');
	xhr.onload = requestComplete;
	console.log(body);
	xhr.send(body);
    }
    
    function requestComplete() {
	if(this.status == 401 && retry){
	    console.log("Error in token");
	}
	else {
	    callback(null,this.status,this.response);
	}
    }
}

function onResponse(error,status,response){
    console.log(status);
    console.log(response);
}


function gDriveCallback() {
    chrome.identity.getAuthToken({interactive: true }, function(token){
	if(chrome.runtime.lastError){
	    alert(chrome.runtime.lastError.message);
	    return;
	}
	console.log("token is " + token);
    });
}				 

function onImageFetched(e){
    if(this.status != 200) return;
    var objUrl = window.URL.createObjectURL(this.response);
    var size = this.response.size;
    var type = this.response.type;
    var reader = new FileReader();
    reader.addEventListener('loadend',function(){
	});
    reader.readAsBinaryString(this.response);
    console.log("type " + type + " size " + size);
    var body = {
	'name': 'file4',
	'mimeType': type
    }
	
    var request = gapi.client.drive.files.create(body);
    request.execute(function(response){
	console.log("created file");
	console.log(response);
	console.log(response.id);
	console.log(reader.result.length);
	var request1 = gapi.client.request({
	'path': '/upload/drive/v3/files/'+response.id,
	'params': { 'uploadType' : 'media' },
	'method': 'PATCH',
	'headers': { 'Content-Type': response.mimeType },
	'body' : this.response
	});
	request1.execute(function(){
	    console.log("sent to drive");
	});
    });
	
//    request.execute(function(){
//	console.log("Sent data to drive");
  //  });
    gapi.client.load("drive","v3",function(){
	console.log("drive loaded");
	console.log(objUrl);
//	console.log("size " + this.response.size + " type " + this.response.type); 
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
	var tab_title = tab.title;
	var msg = {
	    get: "images"
	};
	chrome.tabs.sendMessage(tab_id,msg, function(response) {
	    console.log(tab_title);
	    response.Images.forEach(function(image) {
		console.log(image);
		var xhr = new XMLHttpRequest();
		xhr.open('GET',image,true);
		xhr.responseType = 'blob';
		xhr.onload = onImageFetched;
		xhr.send();
		//chrome identity and Drive API access token
		//gDriveCallback();
	    });
	});
    });
}

document.addEventListener('DOMContentLoaded', function() {
//    getAllImages(function() {
//	console.log("Received response from content script");
  //  });

});

