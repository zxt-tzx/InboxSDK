var GmailElementGetter = require('../gmail-element-getter');
var GmailNavItemView = require('../views/gmail-nav-item-view');

var waitFor = require('../../../lib/wait-for');

module.exports = function(orderGroup, navItemDescriptor){
	var gmailNavItemView = new GmailNavItemView(orderGroup, navItemDescriptor);

	GmailElementGetter
		.waitForGmailModeToSettle()
		.then(_waitForNavItemsHolder)
		.then(_attachNavItemView(gmailNavItemView));

	return gmailNavItemView;
};

function _waitForNavItemsHolder(){
	if(GmailElementGetter.isStandalone()){
		return;
	}

	return waitFor(function(){
		return GmailElementGetter.getNavItemHolders().length > 0;
	});
}

function _attachNavItemView(gmailNavItemView){
	return function(){
		var holder = _getNavItemsHolder();
		holder.appendChild(gmailNavItemView.getElement());
	};
}


function _getNavItemsHolder(){
	var holder = document.querySelector('.inboxsdk__navMenu');
	if(!holder){
		return _createNavItemsHolder();
	}
}

function _createNavItemsHolder(){
	var holder = document.createElement('div');
	holder.setAttribute('class', 'LrBjie inboxsdk__navMenu');
	holder.innerHTML = '<div class="TK"></div>';

	var gmailNavItemHolders = GmailElementGetter.getNavItemHolders();
	gmailNavItemHolders[1].insertAdjacentElement('beforebegin', holder);

	return holder;
}