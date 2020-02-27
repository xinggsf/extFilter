const iframes = document.getElementsByTagName('iframe');
const log = console.log.bind(console);
const q = (css, p = document) => p.querySelector(css);
const isMVFlash = e => {
	const isEmbed = e.matches('embed');
	let s = isEmbed ? e.src : (e.data || e.children.movie.value);
	if (!s || !/\.swf(?:$|\?)/.test(s)) return !1;
	if (e.clientWidth > 99 && e.clientHeight > 88) return !0;
	if (isEmbed) return !1;
	s = q('embed', e);
	return !!(s && isMVFlash(s));
};

chrome.runtime.onMessage.addListener((message, sender) => {
	switch (message.id) {
	case 'mv-block':
		let v = 0 != message.frameId ?
			[...iframes].find(e => e.allowFullscreen) :
			[...document.querySelectorAll('object,embed')].find(isMVFlash);
		if (!v) return;//已删除，网页重试其他地址
		log('found MV:\n', message.url, v);
		/* https://raw.githubusercontent.com/MoePlayer/DPlayer/master/dist/DPlayer.min.js
		const {frameId, tabId} = message;
		chrome.webNavigation.getFrame({frameId, tabId}, function(details){
			let f = getFrame(details.url);
			if (details.parentFrameId != -1) f = f.parent;
		});
		const u = new URL(message.url);
		const t = u.pathname.endsWith('.m3u8') ? 'hls' : 'normal'; */
		const player = new DPlayer({
			video: {
				url: message.url,
				type: 'auto'
			},
			autoplay: true,
			screenshot: true,
			container: v.parentNode
		});
		v.remove();
		setTimeout(() => {
			switch (location.hostname) {
			case 'www.i6v.cc':
				const el = q('.dplayer-video-wrap');
				el.style.height = el.parentNode.clientHeight.toFixed(0) + 'px';
				break;
			case 'www.hdtt8.com':
			case 'www.huaxingui.com':
			case 'lefuntv.us':
				q('.fed-play-player').style.paddingTop = 0;
			}
		}, 330);
		break;
	}
});