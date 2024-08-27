import cfg from "./config.js";
import lm,{allMVs,saveMV} from "./lib-manage.js";

const {r1, getExtName, log, getFileName, reHost, abort} = uu;
const _noBlock = {cancel: !1};
const playPage = chrome.runtime.getURL('play.html');
const tabIdList = new Set([-1]);
const cacheTabs = new Set();
// 确保不重复生成斗鱼间直播地址
const needUrlForDY = (tabId) => allMVs.get(tabId)?.length < 4;
const getJXUrl = () => {
	const {useJX,jxUrls} = cfg.value;
	if (useJX < 0) return;
	if (useJX != 999) return jxUrls[useJX].url;
	const i = Math.random() * (jxUrls.length - 1);
	return jxUrls[~~i].url;
};
const checkTab = (id, host) => {
	if (id == -1 || !host) return;
	tabIdList.delete(id);
	lm.initOnTab(id);
	if (!cfg.value.domainWhiteList.some(k => host.includes(k))) return true;
	tabIdList.add(id);
};

// 删除头部
const delHeads = (names, headers) => headers.filter(k => {
	const hname = k.name.toLowerCase();
	const i = names.findIndex(s => s == hname);
	if (!~i) return true;
	names.splice(i,1);
});
// 增删改头部
const crudHeads = (names, headers) => {
	const rs = headers.filter(k => {
		const hname = k.name.toLowerCase();
		const i = names.findIndex(s => s.name == hname);
		if (!~i) return true;
		if (names[i].value) {
			k.value = names[i].value;
			names.splice(i,1);
			return true;
		}
		names.splice(i,1);
	});
	if (names.length) rs.push(...names.filter(k => k.value));
	return rs;
};
const delReferer = (tabId,requestHeaders) => {
	//判断是否为扩展内部请求
	if (!lm.isLoaded(tabId)) return _noBlock;
	const i = requestHeaders.findIndex(k => k.name.toLowerCase() == 'referer');
	if (!~i) return _noBlock;
	requestHeaders.splice(i, 1);
	return {requestHeaders};
};

chrome.tabs.onRemoved.addListener((id, removeInfo) => {
	if (id != -1) {
		lm.initOnTab(id);
		tabIdList.delete(id);
		cacheTabs.delete(id);
		allMVs.delete(id);
	}
});
chrome.webNavigation.onCommitted.addListener(({tabId,url,frameId}) => {
	if (frameId > 0) return;
	allMVs.delete(tabId);
	const host = r1(reHost, url);
	if (!lm.enabled || !checkTab(tabId, host)) return;
	chrome.tabs.executeScript(tabId,{file:'utils.js',runAt:'document_start'});
	chrome.tabs.executeScript(tabId,{file:'m3u8.js',runAt:'document_start'});
});

const noHandleMV = ['vip.sp-flv.com','vip.jsjinfu.com','vidhub.','json.xmflv.cc','.ssdm.cc','.qcheng.cc']; // m3u8.qwertwe.top
// 处理子框架
const handleFrame = async(url,tabId,frameId,parentFrameId,vType='') => {
	if (!lm.enabled) return;
	const domain = r1(reHost, url);
	if (noHandleMV.some(k => domain.includes(k))) abort();

	const info = {tabId};
	info.frameId = parentFrameId == 0 ? frameId : parentFrameId;
	let frameUrl;
	do {
		const r = await cfg.getFrame(info);
		info.frameId = r.parentFrameId;
		frameUrl = r.url;
	} while (info.frameId > 0);
	chrome.tabs.sendMessage(tabId, {id: 'iframe-block', url, frameUrl, vType});
};
/* 专门处理多层子框架嵌套
const getTopFrame = ({tabId, frameId}) => {
	let frame;
	const frames = await cfg.getAllFrames({ tabId });
	for (let n = frameId; n > 0;) {
		frame = frames.find(k => k.frameId == n);
		n = frame.parentFrameId;
	}
	return frame;
}; */

const vKindList = ['mp4','flv','m3u8','mpd','ogg','webm'];
// const audioKinds = ['mp3','m4a','wma','ra','rm'];Manifest
const filter = ({tabId, frameId, parentFrameId, url, type}) => {
	if (tabIdList.has(tabId)) return _noBlock;// || !vKindList.includes(getExtName(url))
	if (frameId != 0) {
		handleFrame(url,tabId,frameId,parentFrameId);
		lm.inject(tabId, url);
	}
	else if ('object' == type) {
		chrome.tabs.sendMessage(tabId, {id:'mv-block',url,vType:''});
		lm.inject(tabId, url);
	}
	else saveMV(tabId, {url});
	return _noBlock;
};

chrome.runtime.onMessage.addListener((msg, sender, cb) => {
	switch (msg.id) {
	case 'add-domain-whitelist':
		cfg.value.domainWhiteList.push(msg.host);
		cfg.save({domainWhiteList:cfg.value.domainWhiteList});
		break;
	case 'isCache':
		cb(cacheTabs.has(msg.tabId));
		break;
	case 'swapCache':
		if (cacheTabs.has(msg.tabId)) cacheTabs.delete(msg.tabId);
		else cacheTabs.add(msg.tabId);
		break;
	case 'power':
		lm.toggle();
		break;
	case 'getState':
		cb(lm.enabled);
		break;
	case 'clearMVList':
		allMVs.delete(msg.tabId);
		chrome.browserAction.setBadgeText({tabId: msg.tabId, text:'0'});
		break;
	case 'getMVList':
		cb(allMVs.get(msg.tabId));
		break;
	case 'getMVCount':
		cb(allMVs.get(msg.tabId)?.length);
	}
});

const ulink = new URL('https://www.meiju.com/');
const _getMVFromFrame = () => {
	for (let v of ulink.searchParams.values()) {
		v = decodeURIComponent(v);
		if (/^https?:\/\//.test(v) && /mp4|m3u8/.test(getExtName(v))) return v;
	}
}
// sub_frame
chrome.webRequest.onBeforeRequest.addListener(({url,tabId,frameId,parentFrameId}) => {
		if (tabIdList.has(tabId)) return _noBlock;
		ulink.href = url;
		if (ulink.hostname == 'player.youku.com') {
			const jx = getJXUrl();
			if (!jx) return _noBlock;
			const vid = r1(/embed\/([\w=]+)/,ulink.pathname);
			return {redirectUrl: `${jx}https://v.youku.com/v_show/id_${vid}.html`};
		}
		if (ulink.hostname.endsWith('.qq.com')) {
			const jx = getJXUrl();
			if (!jx) return _noBlock;
			const vid = ulink.searchParams.get('firstVid') || ulink.searchParams.get('vid');
			return {redirectUrl: jx +`https://v.qq.com/x/page/${vid}.html`};
		}

		const v = _getMVFromFrame();
		// log(url, v, parentFrameId)
		if (!v) return _noBlock;
		if (parentFrameId < 1) {
			const info = { id: 'iframe-block', url: v, frameUrl: url };
			chrome.tabs.sendMessage(tabId, info);
		} else {
			handleFrame(v,tabId,frameId,parentFrameId);
		}
		lm.inject(tabId, v);
		return {redirectUrl: 'about:blank'};
	},
    { 	urls: [
			'https://player.youku.com/embed/*',
			'https://film.qq.com/*',
			'*://*/*.m3u8*','*://*/*.mp4*'
		],
		types: ['sub_frame'] },
    ['blocking']
);

const baseAddr = chrome.runtime.getURL('lib/');
chrome.webRequest.onBeforeRequest.addListener(
	function({tabId, frameId, url}) {
		// 1.0.10/hls.min.js 低版本hls.js不兼容
		if (!lm.enabled || tabIdList.has(tabId) || !url.startsWith('http') || url.endsWith('/1.0.10/hls.min.js')) return _noBlock;
		const fname = getFileName(url).fname.toLowerCase();
		if (fname.startsWith('flv.')) return {redirectUrl: baseAddr + 'flv.min.js'};
		if (fname.startsWith('dash.')) return {redirectUrl: baseAddr + 'dash.all.min.js'};
		if (fname.startsWith('hls.daye202')) return _noBlock; //美果TV
		if (fname.startsWith('hls.') || url.endsWith('/Nxplayer/NxHls.min.js')) return {redirectUrl: baseAddr + 'hls.min.js'};
		//,'https://www.nxflv.com/Nxplayer/Nxplayer.min.js','https://www.nxflv.com/Nxplayer/NxHls.min.js'
		if (fname.startsWith('dplayer.') || url.endsWith('/Nxplayer/Nxplayer.min.js')) {
			chrome.tabs.insertCSS(tabId,{frameId,file:'player-fix.css'});
			return {redirectUrl: baseAddr + 'DPlayer.min.js'};
		}
		return _noBlock;
	},
    { urls: ['*://*/*.min.js','https://*/js/hls.js'], types: ['script'] },
    ['blocking']
);
chrome.webRequest.onBeforeRequest.addListener(
	({url}) => ({cancel: url.startsWith('http')}),
    { urls: ['*://*/*/DPlayer.min.css'], types: ['stylesheet'] },
    ['blocking']
);

// object xmlhttprequest
chrome.webRequest.onBeforeRequest.addListener(
	filter, {
		urls: ['*://*/*.flv*','*://*/*.mpd*','*://*/*.m3u8','*://*/*.m3u8?*'],
		types: ['object','xmlhttprequest']
	},
    ['blocking']
);

//xmlhttprequest
chrome.webRequest.onBeforeSendHeaders.addListener(
	function({tabId,requestHeaders,frameId}) {
		const a = [];
		if (frameId === 0 && lm.isLoaded(tabId)) a.push('referer');
		if (cacheTabs.has(tabId)) a.push('pragma','cache-control');

		if (a.length) return {requestHeaders: delHeads(a,requestHeaders)};
	},
    {urls: ['*://*/*.png','*://*/*.jpg','*://*/*.ts','*://*/*.ts?*'], types: ['xmlhttprequest']},
    ['blocking','requestHeaders','extraHeaders']
);

// media
chrome.webRequest.onBeforeSendHeaders.addListener(
	function({url,tabId,frameId,parentFrameId,requestHeaders}) {
		if (!lm.enabled || tabIdList.has(tabId)) return;
		if (frameId == 0) return delReferer(tabId,requestHeaders);
		handleFrame(url,tabId,frameId,parentFrameId,'normal');
		lm.inject(tabId, url, 1);
	},
    { urls: ['<all_urls>'], types: ['media']},
    ['blocking','requestHeaders','extraHeaders']
);

// main_frame
chrome.webRequest.onBeforeRequest.addListener(function({tabId, url}) {
	if (!url.startsWith('http')) return _noBlock;
	/* const playUrl = playPage +'#'+ url;
    if (navigator.userAgent.includes('Firefox')) {
        chrome.tabs.update(info.tabId, {url: playUrl});
        return {cancel: true};
    } */
	if (vKindList.includes(getExtName(url))) return {redirectUrl:playPage +`?vType=auto#${url}`};
}, {
	urls: ['*://*/*.m3u8*','*://*/*.mp4*','*://*/*.ogg*','*://*/*.webm*','*://*/*.mpd*','*://*/*.flv*'],
	types:['main_frame']
}, ['blocking']);

const getMVSizeFromHead = h => h.find(k => k.name.toLowerCase()=='content-length')?.value;
chrome.webRequest.onHeadersReceived.addListener(
	function({tabId, frameId, parentFrameId, type, url, responseHeaders: head, initiator: origin}) {
		if (tabId < 0 || !origin.startsWith('http') ||
			head.some(k => k.name.toLowerCase() == 'location')) return;
		const s = head.find(k => k.name.toLowerCase() == 'content-type')?.value.toLowerCase().split(';')[0];
		if (!s) return;
		if (type == 'media') {
			if (s.startsWith('text')) return;
			const info = {url, kind: s, size: getMVSizeFromHead(head)};
			saveMV(tabId, info);
			if (s.startsWith('audio/')) return;
			const item = head.find(k => k.name.toLowerCase() == 'access-control-allow-origin');
			if (item) item.value = '*';
			else head.push({name: 'access-control-allow-origin',value: '*'});
			return {responseHeaders: head};
		}
		let r = _noBlock;
		if (cacheTabs.has(tabId) &&
			head.some(k => k.name.toLowerCase() == 'accept-ranges' && k.value == 'bytes'))
		{
			const h = delHeads(['pragma','cache','cache-control','x-cache','last-modified','expires',
				'date','etag','access-control-allow-credentials'],head);
			h.push({
				name: 'Cache-Control',
				value: 'max-age=88000'
			},{
				name: 'cache',
				value: 'disk'
			});
			r = {responseHeaders: h};
		}

		if (s.startsWith('image') || s.endsWith('stream')) return r;
		const info = {url};
		if (s.startsWith('text')) {
			if (getExtName(url) != 'm3u8') return;
			info.kind = 'hls';
		}
		//application/vnd.apple.mpegurl x-mpegURL dash+xml video/x-flv
		else if (s.includes('mpegurl',13) || s.substr(12, 6)=='x-mpeg') info.kind = 'hls';
		else if (s.substr(12, 4) =='dash') info.kind = 'dash';
		else if (s.includes('x-flv',6)) {
			info.kind = 'flv';
			info.size = getMVSizeFromHead(head);
		}
		else if (s.startsWith('video/')) {
			const mhost = origin.substr(-10);
			if (mhost == '.youku.com') return r;
			if (mhost == '.douyu.com' && s.substr(6, 5) =='x-p2p') {
				info.kind ='flv';
			}
			else {
				info.size = getMVSizeFromHead(head);
				if (info.size < 5<<20) return r; // 5Mb
				info.kind = 'auto';
			}
		}
		// else if (s.startsWith('audio/')) {
			// if (!s.endsWith('/mp4')) saveMV(tabId, {url, kind: s}); // audio/mp4 是dash切片音频数据??
			// return;
		// }
		else return r;

		saveMV(tabId, info);
		if (frameId != 0 && !lm.isLoaded(tabId) && !tabIdList.has(tabId)) {
			handleFrame(url,tabId,frameId,parentFrameId,info.kind);
			lm.inject(tabId, url, info.kind);
		}
		return r;
	},
	{urls: ['<all_urls>'], types: ['xmlhttprequest','media']},
	['blocking','responseHeaders',chrome.webRequest.OnBeforeSendHeadersOptions.EXTRA_HEADERS].filter(Boolean)
);