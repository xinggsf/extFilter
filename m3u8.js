const iframes = document.getElementsByTagName('iframe');
const find = [].find.bind(iframes);
const log = console.log.bind(console);
const q = (css, p = document) => p.querySelector(css);
const isPlayer = e => e.clientWidth > 221 && e.clientHeight > 111;
const injectCSS = css => {
	const e = document.createElement('style');
	e.textContent = css;
	document.head.appendChild(e);
};
const isMVFlash = e => {
	const isEmbed = e.matches('embed');
	let s = isEmbed ? e.src : (e.data || e.children.movie.value);
	if (!s || !/\.swf(?:$|\?)/.test(s)) return !1;
	if (isPlayer(e)) return !0;
	if (isEmbed) return !1;
	s = q('embed', e);
	return !!(s && isMVFlash(s));
};

chrome.runtime.onMessage.addListener((msg, sender) => {
	let v = null;
	switch (msg.id) {
	case 'mv-block':
		v = 0 != msg.frameId ? find(e => e.allowFullscreen || isPlayer(e)) :
			[].find.call(document.querySelectorAll('object,embed'), isMVFlash);
		break;
	case 'iframe-block':
		v = find(e => e.src && e.src.includes(msg.url));
	}
	if (!v) return;
	log('found MV:\n', msg.url, v);
	/* https://raw.githubusercontent.com/MoePlayer/DPlayer/master/dist/DPlayer.min.js
	const {frameId, tabId} = msg;
	chrome.webNavigation.getFrame({frameId, tabId}, function(details){
		let f = getFrame(details.url);
		if (details.parentFrameId != -1) f = f.parent;
	});
	const u = new URL(msg.url);
	const t = u.pathname.endsWith('.m3u8') ? 'hls' : 'normal'; */
	const dp = new DPlayer({
		video: {
			url: msg.url,
			type: 'auto'
		},
		autoplay: true,
		screenshot: true,
		theme: '#EC8',
		container: v.parentNode,
		contextmenu: [
			{
				text: '合金H5扩展BUG反馈',
				link: 'https://bbs.kafan.cn/thread-2162743-1-1.html'
			},
		],
	});
	v.remove();
	dp.fullScreen.request('web');
});

setTimeout(x => {
	switch (location.hostname) {
	case 'www.hdtt8.com':
	case 'cn.inmi.tv':
		injectCSS('.dplayer{height:666px;padding-top:0!important}.dplayer-web-fullscreen-fix .fed-head-info{display:none!important} .fed-head-info{position:absolute!important;}');
		break;
	case 'www.dyjihe.com':
		injectCSS('.dplayer{height:518px;}');
		break;
	case '5nj.com':
	case 'www.yunbtv.com':
	case 'www.cmdy5.com':
	case 'kan.jinbaozy.com':
		injectCSS('.MacPlayer{height:100%}');
		break;
	case 'www.hobiao.com':
		injectCSS('.MacPlayer{height:100%} .dplayer-web-fullscreen-fix .fed-head-info{display:none!important}');
		break;
	case 'www.huaxingui.com':
		injectCSS('.dplayer-web-fullscreen-fix header, .dplayer-web-fullscreen-fix #player-sidebar-is{display:none!important}');
		break;
	case 'www.haitur.com':
	case 'www.haituw.com':
	case 'www.haitum.cn':
		injectCSS('.bottom, .dplayer-web-fullscreen-fix header{display:none!important}');
		break;
	case 'www.iqiyi.com':
		injectCSS('.dplayer-web-fullscreen-fix .qy-header{display:none!important}');
		break;
	case 'v.qq.com':
		injectCSS('.dplayer-web-fullscreen-fix #mod_player~*, .dplayer-web-fullscreen-fix #shortcut, .dplayer-web-fullscreen-fix .site_head{display:none!important}');
		break;
	}
},99);