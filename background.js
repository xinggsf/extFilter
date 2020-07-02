const _noBlock = {cancel: !1};
const tabIdList = new Set();
const um = new URL('https://www.yasehezi.com/');
const domainWhiteList = [
	'.163.com',
	'.91meijuw.com',
	'.cctv.com',
	'.douyu.com',
	'www.duboku.tv',
	'.google.com',
	'www.kalidm.com',
	'z1.m1907.cn',
	'.yatu.tv',
	//'www.youzhidy.com',
	'.zhihu.com',
];
const checkTab = tab => {
	if (!tab.url || !tab.url.startsWith('http')) return;
	um.href = tab.url;
	if (domainWhiteList.some(k => um.host.endsWith(k))) tabIdList.add(tab.id);
};

chrome.tabs.onCreated.addListener(checkTab);
chrome.tabs.onUpdated.addListener((id, changeInfo, tab) => {
	tabIdList.delete(id);
	checkTab(tab);
});
chrome.tabs.onRemoved.addListener((id, removeInfo) => {
	tabIdList.delete(id);
});

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
	if (tabId == -1 || tabIdList.has(tabId)) return _noBlock;
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

const reAddr = /^http.+?\.m(?:3u8|p4)$/;
const ulink = new URL('https://www.xxx.com/');
chrome.webRequest.onBeforeRequest.addListener(
	details => {
		const {tabId, frameId, parentFrameId, url} = details;
		if (tabId == -1 || tabIdList.has(tabId)) return _noBlock;
		ulink.href = url;
		const ss = ulink.searchParams.values();
		for (const v of ss) if (reAddr.test(v)) {
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
    {
		urls: ['*://*/hls/*'], types: ['xmlhttprequest']
	},
    ["blocking"]
);
chrome.webRequest.onBeforeRequest.addListener(
	filter,
    { urls: ['*://*/*'], types: ['media']},
    ["blocking"]
);