const filter = details => {
	const {tabId, frameId, url, type} = details;
	if (frameId != 0 ||'object' == type) {
		const info = { url,frameId,id: 'mv-block' };
		chrome.tabs.sendMessage(tabId, info);
		chrome.browserAction.enable(tabId);
	}
	return {cancel: !1};
};

chrome.webRequest.onBeforeRequest.addListener(
	details => {
		const {tabId, url} = details;
		if (url.startsWith('https://www.yasehezi.com/')) return {cancel: !1};
		const m = url.match(/=(http.+)$/);
		if (m) {
			const info = { url: m[1], frameId: 9, id: 'mv-block' };
			setTimeout(() => {
				chrome.tabs.sendMessage(tabId, info);
				chrome.browserAction.enable(tabId);
			}, 290);
		}
		return {cancel: !!m};
	},
    { urls: ['*://*/*.m3u8','*://*/*.mp4'], types: ['sub_frame'] },
    ["blocking"]
);
//用onBeforeSendHeaders更具体
chrome.webRequest.onBeforeRequest.addListener(
	filter,
    {
		urls: ['*://*/*.m3u8','*://*/*.m3u8?*'],
		types: ['object','xmlhttprequest']
	},
    ["blocking"]
);
chrome.webRequest.onBeforeRequest.addListener(
	filter,
    { urls: ['*://*/*'], types: ['media']},
    ["blocking"]
);