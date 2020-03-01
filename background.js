const filter = details => {
	const {tabId, frameId, url, type} = details;
	if (frameId != 0 ||'object' == type ||
		('media' == type && url.includes('.m3u8')))
	{
		const info = { url,frameId,type,id: 'mv-block' };
		chrome.tabs.sendMessage(tabId, info);
		chrome.browserAction.enable(tabId);
	}
	return {cancel: !1};
};

//用onBeforeSendHeaders更具体
chrome.webRequest.onBeforeRequest.addListener(
	filter,
    {
		urls: ['*://*/*.m3u8','*://*/*.m3u8?*'],
		types: ['object','xmlhttprequest','media']
	},
    ["blocking"]
);
chrome.webRequest.onBeforeRequest.addListener(
	filter,
    { urls: ['*://*/*.mp4','*://*/*.mp4?*'], types: ['media']},
    ["blocking"]
);