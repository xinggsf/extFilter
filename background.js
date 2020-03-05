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
/*
const innerAddrs = [ //内部的地址白名单
	'http://99hd.net/mp4/', // http://www.qiqidongman.com
	'https://api.xiaomingming.org/cloud/mp4.php', // http://www.imomoe.in
	'https://jx.123ku.com/' // https://www.cmdy5.com
]; */
chrome.webRequest.onBeforeRequest.addListener(
	details => {
		const {tabId, url} = details;
		if (tabId == -1 || url.startsWith('https://www.yasehezi.com')) return _noBlock;
		const n = url.indexOf('=http', 15);
		if (n > 15) {
			const info = { 'url': url.slice(n+1), id: 'iframe-block' };
			chrome.tabs.sendMessage(tabId, info);
			chrome.browserAction.enable(tabId);
            //if (innerAddrs.some(s => url.startsWith(s))) return _noBlock;
            return {redirectUrl: 'about:blank'};
		}
		return _noBlock;
	},
    { urls: ['*://*/*.m3u8','*://*/*.mp4'], types: ['sub_frame'] },
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