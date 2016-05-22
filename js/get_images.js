var authToken = {};
var parentId;
var currentId;
var Id;
function get_or_create(name,mime,parent,callback){

    var request = gapi.client.drive.files.list({q: "name='"+name+"'"});
    request.execute(function(response){
	if(!response.files[0]){
	    var req = gapi.client.drive.files.create({'name': name, 'mimeType': mime,'parents': parent});
	    req.execute(function(response){
		Id = response.id;
		callback(Id);
	    });
	}
	else{
	    Id = response.files[0].id;
	    callback(Id);
	}
    });

}

function init() {
//    chrome.identity.removeCachedAuthToken(authToken.access_token,function(){
  //  console.log("removed token");
   // });
    getToken();
    
    function getToken() {
	chrome.identity.getAuthToken({interactive: true}, function(t){
	    console.log("inside getToken");
	    if(chrome.runtime.lastError){
		alert(chrome.runtime.lastError.message);
		return;
	    }
	    authToken.access_token = t;
	    //validate token 
	    console.log("Loaded javscript client library");
	    gapi.auth.setToken(authToken);
	    gapi.client.load("drive","v3",function(){
		gapi.client.drive.files.list().execute(function(response){
		    console.log(response.code);
		    if(response.code == 401){
			chrome.identity.removeCachedAuthToken({'token': t},function(){
			    console.log("Removed token");
			    getToken();
			});
		    }
	    });

		mime = "application/vnd.google-apps.folder";
		var p = [];
		get_or_create("Saved images",mime,p,function(id){
		    // update parentId
		    parentId = id;
		    getAllImages(function(){
		    });
		});
	    });
	});
    }
}



function onImageFetched(e) {
   if(this.status != 200) return;
    var objUrl = window.URL.createObjectURL(this.response);
    var u = e.currentTarget.responseURL;
    var filename = u;
    console.log(filename);
    var blob = this.response
    mime = this.response.type;
    var p = [];
    p.push(currentId);

    get_or_create(filename,mime,p,function(id){
	if(mime == 'image/pjpeg'){
	    mime = 'image/jpeg';
	}
	var fileId = id;
	const url = 'https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=media';
	var xhr = new XMLHttpRequest();
	xhr.open('PATCH',url);
	xhr.setRequestHeader('Authorization', 'Bearer ' + authToken.access_token);
	xhr.setRequestHeader('Content-Type', mime);
	xhr.onload = result => {
	    console.log("Saved to Google drive");
	}
	xhr.send(blob);
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
	//create subfolder in saved images
	var p =[];
	mime = "application/vnd.google-apps.folder";
	get_or_create("Saved images",mime,p,function(id){
	    p.push(id);
	    get_or_create(tab_title,mime,p,function(id){
		currentId = id;
		chrome.tabs.sendMessage(tab_id,msg, function(response) {
		    var images = response.Images;
		    processImages();
		    function processImages(){
			if(images.length > 0){
			    var image = images.shift();
			    console.log(image);
			    var xhr = new XMLHttpRequest();
			    xhr.open('GET',image,true);
			    xhr.responseType = 'blob';
			    xhr.onload = onImageFetched;
			    xhr.send();
			}
		    	setTimeout(processImages,1000);
		    }
		    
		});
	    });
	});
    });
}


document.addEventListener('DOMContentLoaded', function() {
//    init();
//    getAllImages(function() {
//	console.log("Received response from content script");
  //  });

});

