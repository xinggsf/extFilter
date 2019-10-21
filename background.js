const webExt = chrome || browser;

const addr = new URL('https://www.test.org/');
//用onBeforeSendHeaders更具体
webExt.webRequest.onBeforeRequest.addListener(details => {
        const {tabId, frameId, url} = details;
		addr.href = url;
		const block = addr.pathname.endsWith('.m3u8') &&
			(details.frameId != 0 ||'object' == details.type);
        if (block) {
			const info = { url, frameId, id: 'mv-block' };
            webExt.tabs.sendMessage(tabId, info);
            webExt.browserAction.enable(tabId);
        }
        return {cancel: block};
    },
    { urls: ['*://*/*.m3u8*'], types: ['object', 'xmlhttprequest', 'other']},
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
    { urls: ['*://*/*'], types: ['media']},
    ["blocking"]
);