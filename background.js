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

const um = new URL('https://www.yasehezi.com/');
const reAddr = /^http.+?\.m(?:3u8|p4)$/;
chrome.webRequest.onBeforeRequest.addListener(
	details => {
		const {tabId, url} = details;
		um.href = url;
		if (tabId == -1 || um.hostname.endsWith('.yasehezi.com')) return _noBlock;
		for (const v of um.searchParams.values()) {
			if (reAddr.test(v)) {
				const info = { 'url': v, id: 'iframe-block' };
				chrome.tabs.sendMessage(tabId, info);
				chrome.browserAction.enable(tabId);
				return {redirectUrl: 'about:blank'};
			}
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