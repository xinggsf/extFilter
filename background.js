const filter = details => {
	const {tabId, frameId, url} = details;
	if (frameId != 0 ||'object' == details.type) {
		const info = { url, frameId, id: 'mv-block' };
		chrome.tabs.sendMessage(tabId, info);
		chrome.browserAction.enable(tabId);
	}
	return {cancel: !1};
};

//用onBeforeSendHeaders更具体
chrome.webRequest.onBeforeRequest.addListener(
	filter,
    { urls: ['*://*/*.m3u8','*://*/*.m3u8?*'], types: ['object', 'xmlhttprequest']},
    ["blocking"]
);
chrome.webRequest.onBeforeRequest.addListener(
	filter,
    { urls: ['<all_urls>'], types: ['media']},
    ["blocking"]
);