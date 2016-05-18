
var image_urls = [ ];
function retrieveImages() {
    
    var images = document.images;

    for(var i =0; i <images.length; i++)
    {
//	console.log(images[i].src);
	image_urls.push(images[i].src);
    }

}
    

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse){
    
    if(request.get == "images")
    {
	// retrieve all unique images
	retrieveImages()

	//synchronous sendresponse
	sendResponse(image_urls);
    }
});
    
