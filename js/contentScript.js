
var image_urls = [] ;
function retrieveImages() {
    
    var images = document.images;
    var urls = [];
    console.log(images.length);
    for(var i =0; i <images.length; i++)
    {
	urls.push(images[i].src);
    }
    urls.sort();
    //Remove duplicates
    if(urls.length == 0)
    {
	return ;
    }
    image_urls.push(urls[0]);
    var j = 0;
    for(i = 1; i<urls.length; i++)
    {
	if(image_urls[j] != urls[i])
	{
	    image_urls.push(urls[i]);
	    console.log(image_urls[j]);
	    j++;
	}
	else
	{
	    continue;
	}
    }
}
    

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse){
    
    if(request.get == "images")
    {
	// retrieve all unique images
	retrieveImages()

	//synchronous sendresponse
	//sendResponse(image_urls);
	sendResponse({ "Images" : image_urls});
	image_urls = [];
    }
});
    
