import cfg from "./config.js";

cfg.init();
const allMVs = new Map();
const saveMV = (tabId, detail) => {
	let text = '1', a = allMVs.get(tabId);
	if (!a) allMVs.set(tabId, Array.of(detail));
	else if (a.some(k => k.url == detail.url)) return;
	else text = uu.toByteUnit(a.unshift(detail),4);
	chrome.browserAction.setBadgeText({tabId, text});
};

const libManager = {
	enabled: true,
	loadedTab: new Map(),
	initOnTab(tabId) {
		this.loadedTab.delete(tabId);
	},
	toggle() {
		this.enabled = !this.enabled;
	},
	isLoaded(tabId) {
		return this.loadedTab.has(tabId);
	},
	inject(tabId, url, type = -1) {
		if (!this.enabled) return;
		const loadedType = this.loadedTab.get(tabId) || 0;
		if (loadedType && (loadedType & 0xff) == 0x1f) return;
		if (type == -1 || type == 'auto') type = uu.getPlayOrd(url);
		else if (typeof type == 'string') type = uu.vLib[type] || 2;

		if (type != 1) saveMV(tabId, {url, kind: type}); // 直接媒体由onHeadersReceived事件来添加，以获得字节大小信息
		if (cfg.value.useShaka && (type&6) && !(loadedType & 16)) {
			chrome.tabs.executeScript(tabId,{file:"lib/mux.min.js"});
			chrome.tabs.executeScript(tabId,{file:"lib/shaka-player.compiled.js"});
			type = 16;
		}

		else if ((type & 2) && !(loadedType & 2))
			chrome.tabs.executeScript(tabId,{file:"lib/hls.min.js"});
		else if ((type & 4) && !(loadedType & 4))
			chrome.tabs.executeScript(tabId,{file:"lib/dash.all.min.js"});
		else if ((type & 8) && !(loadedType & 8))
			chrome.tabs.executeScript(tabId,{file:"lib/flv.min.js"});

		if (!(loadedType & 1)) {
			chrome.tabs.insertCSS(tabId,{file:"player-fix.css"});
			chrome.tabs.executeScript(tabId,{file:"lib/DPlayer.min.js"});
			type |= 1;
		}
		this.loadedTab.set(tabId, loadedType | type);
	}
};

export default libManager;
export {allMVs,saveMV};