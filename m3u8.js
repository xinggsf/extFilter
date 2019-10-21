const webExt = chrome || browser;
const iframes = document.getElementsByTagName('iframe');
const getMVFrame = () => {
	for (let f of iframes) {
		if (f.allowFullscreen) return f;
	}
};

const log = console.log.bind(console);
const q = (css, p = document) => p.querySelector(css);
const isPlayer = (e) => {
	const isEmbed = e.matches('embed');
	let s = isEmbed ? e.src : (e.data || e.children.movie.value);
	if (!s || !/\.swf(?:$|\?)/.test(s)) return !1;
	if (e.clientWidth > 188 && e.clientHeight > 111) return !0;
	if (isEmbed) return !1;
	s = q('embed', e);
	return !!(s && isPlayer(s));
};

let v = null;
webExt.runtime.onMessage.addListener((message, sender) => {
	switch (message.id) {
	case 'mv-block':
		log(message.url);
		if (0 != message.frameId) v = getMVFrame();
		else {
			for (let k of document.querySelectorAll('object,embed')) {
				if (isPlayer(k)) {
					log('found flash: ', k);
					v = k;
					break;
				}
			}
		}
		if (!v) return;
		/*
		const {frameId, tabId} = message;
		webExt.webNavigation.getFrame({frameId, tabId}, function(details){
			let f = getFrame(details.url);
			if (details.parentFrameId != -1) f = f.parent;
		}); */
		//const u = new URL(message.url);
		//const t = u.pathname.endsWith('.m3u8') ? 'hls' : 'normal';
		new DPlayer({
			video: {
				url: message.url,
				type: 'auto'
			},
			autoplay: true,
			container: v.parentNode
		});
		v.remove();
		setTimeout(() => {
			switch (location.hostname) {
			case 'www.66s.cc':
				const el = v.closest('.dplayer');
				el.style.height = el.parentNode.clientHeight + 'px';
				break;
			case 'www.huaxingui.com':
			case 'lefuntv.us':
				q('.fed-play-player').style.paddingTop = 0;
			}
		}, 330);
		break;
	}
});