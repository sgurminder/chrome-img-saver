
chrome.browserAction.onClicked.addListener(function() {
    init();
});

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

    getToken();
    
    function getToken() {
	chrome.identity.getAuthToken({interactive: true}, function(t){
	    if(chrome.runtime.lastError){
		alert(chrome.runtime.lastError.message);
		return;
	    }
	    authToken.access_token = t;
	    //validate token 
//	    console.log("Loaded javscript client library");
	    gapi.auth.setToken(authToken);
	    gapi.client.load("drive","v3",function(){
		gapi.client.drive.files.list().execute(function(response){
		    console.log(response.code);
		    if(response.code == 401){
			chrome.identity.removeCachedAuthToken({'token': t},function(){
//			    console.log("Removed token");
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
//    // console.log(filename);
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
	if(self.fetch){
	    // console.log("Fetch found, Using fetch");
	    var setHeaders = new Headers();
	    setHeaders.append('Authorization', 'Bearer ' + authToken.access_token);
	    setHeaders.append('Content-Type', mime);
	    
	    var setOptions = {
		method: 'PATCH',
		headers: setHeaders,
		body: blob
	    };
	    fetch(url,setOptions)
		.then(response => { if(response.ok){
		    // console.log("save to google using fetch");
		}
				    else{
					// console.log("Response wast not ok");
				    }
				  })
	    .catch(error => {
		// console.log("There is an error " + error.message);
	    });
	    
	}
	else{
	    var xhr = new XMLHttpRequest();
	    xhr.open('PATCH',url);
	    xhr.setRequestHeader('Authorization', 'Bearer ' + authToken.access_token);
	    xhr.setRequestHeader('Content-Type', mime);
	    xhr.onload = result => {
	    // console.log("Saved to Google drive");
	    }
	    xhr.send(blob);
	}
    });
}




// Get images by sending message to content script attached to current tab
function getAllImages(callback)  {

    var queryInfo = {
	active: true,
	currentWindow: true,
	windowType: "normal"
    };
    var notID = 0;
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
		    // console.log("Uploading " + images.length );
		    var options = {
			'type': 'basic',
			'iconUrl': '../img/icon.png',
			'title': 'Image Saver',
			'message': 'Uploading ' + images.length + ' images to Google Drive',
			'buttons': [{'title': 'View images', 'iconUrl': '../img/googleDrive.png'},{'title': "Stop uploading", 'iconUrl': '../img/cross.png'} ]
		    }
		    chrome.notifications.create("id"+notID++,options,function(notID) {
			// console.log("Created notification with ID " + notID);
			chrome.notifications.onButtonClicked.addListener(function(id,index){
			    // console.log("User clicked button " + index + "in notification " + notID);
			    if(index == 0){
				// console.log("Visit drive");
				var creat = {
				    'url': 'https://drive.google.com/drive/folders/'+ currentId }
				chrome.tabs.create(creat,function(tab){
				    // console.log("Created new tab for drive");
				});
			    }
			    else{
				// console.log("Stop uploading");
				images = [];
			    }
			}); 
		    });
			
			
		    processImages();
		    
		    function processImages(){
			if(images.length > 0){
			    var image = images.shift();
			    // console.log(image);
			    if(self.fetch){
				var setOptions = {
				    method: 'GET'
				};
				var u;
				fetch(image,setOptions)
				    .then(response => { 
					if(response.ok){
					    u = response.url;
					    return response.blob();
					}
				    }).then(nblob => {
					var mime = nblob.type;
					var p =[];
					p.push(currentId);
					get_or_create(u,mime,p,function(id){
					    if(mime == 'image/pjpeg'){
						mime = 'image/jpeg';
					    }
					    var fileId = id;
					    const url = 'https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=media';
					    if(self.fetch){
						// console.log("Fetch found, Using fetch");
						var setHeaders = new Headers();
						setHeaders.append('Authorization', 'Bearer ' + authToken.access_token);
						setHeaders.append('Content-Type', mime);
						
						var setOptions = {
						    method: 'PATCH',
						    headers: setHeaders,
						    body: nblob
						};
						fetch(url,setOptions)
						    .then(response => { if(response.ok){
							 console.log("save to google using fetch");
						    }
									else{
									    console.log("Response wast not ok");
									}
								      })
						    .catch(error => {
							console.log("There is an error " + error.message);
						    });
						
					    }
					    else{
						var xhr = new XMLHttpRequest();
						xhr.open('PATCH',url);
						xhr.setRequestHeader('Authorization', 'Bearer ' + authToken.access_token);
						xhr.setRequestHeader('Content-Type', mime);
						xhr.onload = result => {
						    console.log("Saved to Google drive");
						}
						xhr.send(blob);
					    }
					});
					
				    }).catch(error => {
					console.log("Found error " + error.message);
				    });
			    }
			    else{
				var xhr = new XMLHttpRequest();
				xhr.open('GET',image,true);
				xhr.responseType = 'blob';
				xhr.onload = onImageFetched;
				xhr.send();
			    }
			}
		    	setTimeout(processImages,1000);
		    }
		   
		});
	    });
	});
    });
}
