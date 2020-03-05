const _noBlock = {cancel: !1};
const filter = details => {
	const {tabId, frameId, url, type} = details;
	if (tabId != -1 && (frameId != 0 ||'object' == type)) {
		const info = { url,frameId,id: 'mv-block' };
		chrome.tabs.sendMessage(tabId, info);
		chrome.browserAction.enable(tabId);
	}
	return _noBlock;
};

chrome.webRequest.onBeforeRequest.addListener(
	details => {
		const {tabId, url} = details;
		if (tabId == -1 || url.startsWith('https://www.yasehezi.com')) return _noBlock;
		const m = url.match(/=(http.+?\.m(?:3u8|p4))(\?|&|$)/);
		if (m) {
			const s = m[2] == '?' ? url.slice(m.index +1) : m[1];
			const info = { 'url': s, id: 'iframe-block' };
			chrome.tabs.sendMessage(tabId, info);
			chrome.browserAction.enable(tabId);
            return {redirectUrl: 'about:blank'};
		}
		return _noBlock;
	},
    { urls: ['*://*/*.m3u8*','*://*/*.mp4*'], types: ['sub_frame'] },
    ["blocking"]
);
//用onBeforeSendHeaders更具体 content-type application/vnd.apple.mpegurl application/x-mpegURL video/mp2t
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