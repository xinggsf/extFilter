const webExt = chrome || browser;

//用onBeforeSendHeaders更具体
webExt.webRequest.onBeforeRequest.addListener(details => {
        const {tabId, frameId, url} = details;
		const block = details.frameId != 0 ||'object' == details.type;
        if (block) {
			const info = { url, frameId, id: 'mv-block' };
            webExt.tabs.sendMessage(tabId, info);
            webExt.browserAction.enable(tabId);
        }
        return {cancel: block};
    },
    { urls: ['*://*/*.m3u8','*://*/*.m3u8?*'], types: ['object', 'xmlhttprequest']},
    ["blocking"]
);
webExt.webRequest.onBeforeRequest.addListener(details => {
        const {tabId, frameId, url} = details;
		const block = frameId != 0;
        if (block) {
			const info = { url, frameId, id: 'mv-block' };
            webExt.tabs.sendMessage(tabId, info);
            webExt.browserAction.enable(tabId);
        }
        return {cancel: block};
    },
    { urls: ['<all_urls>'], types: ['media']},
    ["blocking"]
);