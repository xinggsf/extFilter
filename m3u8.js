const iframes = document.getElementsByTagName('iframe');
const log = console.log.bind(console);
const q = (css, p = document) => p.querySelector(css);
const isPlayer = e => e.clientWidth > 111 && e.clientHeight > 88;
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
	switch (msg.id) {
	case 'mv-block':
		let v = 0 != msg.frameId ? [...iframes].find(isPlayer) :
			msg.type == 'media' ? document.getElementsByTagName('video')[0] :
			[...document.querySelectorAll('object,embed')].find(isMVFlash);
		if (!v) return;//已删除，网页重试其他地址
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
			container: v.parentNode
		});
		v.remove();
		setTimeout(() => {
			v = dp.video;
			switch (location.hostname) {
			case '5nj.com':
			case 'www.cmdy5.com':
			case 'kan.jinbaozy.com':
				v.closest('.MacPlayer').style.height = 'auto';
				dp.fullScreen.request('web');
				break;
			case 'www.duboku.tv':
			case 'www.ffilmer.com':
			case 'www.i6v.cc':
				const el = v.closest('.dplayer-video-wrap');
				el.style.height = el.parentNode.clientHeight + 'px';
				break;
			case 'www.hdtt8.com':
			case 'www.huaxingui.com':
			case 'lefuntv.us':
			case 'cn.inmi.tv':
				v.closest('.fed-play-player').style.paddingTop = 0;
			}
		}, 330);
		break;
	}
});