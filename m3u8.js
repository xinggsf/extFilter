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
		v = 0 != msg.frameId ? find(e => e.allowFullscreen) || find(isPlayer) :
			[].find.call(document.querySelectorAll('object,embed'), isMVFlash);
		break;
	case 'iframe-block':
		v = find(e => e.src && e.src.includes(msg.url));
	}
	if (!v) return;
	// log('found MV:\n', msg.url, v);
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
			}
		],
	});
	v.remove();
	//log(dp);
	dp.fullScreen.request('web');
	dp.container.closest('body > *').classList.add('gm-dp-zTop');
	/*
	dp.video.addEventListener('dblclick', ev => {
		if (document.fullscreen) document.exitFullscreen();
		else dp.fullScreen.toggle('web'); //browser  fullScreen.isFullScreen
	}, true);
	dp.notice('视频播放速率为： '+ dp.video.playbackRate, 900); */
});

const cssList = {
	'www.dyjihe.com': '.dplayer{height:518px;}',
	'www.haitur.com': '.bottom{display:none!important}',
	'www.huaxingui.com': '.dplayer-web-fullscreen-fix #player-sidebar-is{display:none!important}',
	'v.qq.com': '.dplayer-web-fullscreen-fix #mod_player~*, .dplayer-web-fullscreen-fix #shortcut, .dplayer-web-fullscreen-fix .site_head{display:none!important}'
};
const ss = cssList[location.hostname];
ss && setTimeout(injectCSS,99,ss);