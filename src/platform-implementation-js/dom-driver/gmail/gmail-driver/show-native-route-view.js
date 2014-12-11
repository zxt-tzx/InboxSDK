var GmailElementGetter = require('../gmail-element-getter');

module.exports = function(gmailDriver, element){

	var contentSectionElement = GmailElementGetter.getContentSectionElement();
	if(!contentSectionElement){
		return;
	}

	var customViewContainerElement = contentSectionElement.querySelector('.inboxsdk__custom_view');
	if(customViewContainerElement){
		customViewContainerElement.remove();
	}

	var children = contentSectionElement.children;
	Array.prototype.forEach.call(children, function(child){
		child.style.display = '';
	});

};