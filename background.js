const _noBlock = {cancel: !1};
//专门处理多层子框架嵌套
const getTopFrame = (tabId, details) => {
	chrome.webNavigation.getAllFrames(
		{ tabId },
		function (frames) {
			for (let n = details.frameId;;) {
				let frame = frames.find(k => k.frameId == n);
				if (frame.parentFrameId <= 0) {
					details.frameUrl = frame.url;
					chrome.tabs.sendMessage(tabId, details);
					chrome.browserAction.enable(tabId);
					return;
				}
				n = frame.parentFrameId;
			}
		}
	);
};
const filter = details => {
	const {tabId, frameId, parentFrameId, url, type} = details;
	if (tabId == -1) return _noBlock;
	const info = { url };
	if (frameId != 0) {
		info.id = 'iframe-block';
		if (parentFrameId > 0) {
			info.frameId = parentFrameId;
			getTopFrame(tabId, info);
			return _noBlock;
		}
	}
	else if ('object' == type) info.id = 'mv-block';
	else return _noBlock;
	chrome.tabs.sendMessage(tabId, info);
	chrome.browserAction.enable(tabId);
	return _noBlock;
};

const um = new URL('https://www.yasehezi.com/');
const reAddr = /^http.+?\.m(?:3u8|p4)$/;
chrome.webRequest.onBeforeRequest.addListener(
	details => {
		const {tabId, frameId, parentFrameId, url} = details;
		um.href = url;
		if (tabId == -1 || um.hostname.endsWith('.yasehezi.com')) return _noBlock;
		for (const v of um.searchParams.values()) {
			if (reAddr.test(v)) {
				const info = { 'url': v, id: 'iframe-block' };
				if (frameId == 0) info.frameUrl = url;
				else if (parentFrameId > 0) {
					info.frameId = parentFrameId;
					getTopFrame(tabId, info);
					return {redirectUrl: 'about:blank'};
				}
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