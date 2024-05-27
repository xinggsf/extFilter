const host = location.hostname;
const {r1, sleep, hookHls, dom, log, q, getPlayType} = uu;
const router = {
	'www.555kyy.com': '.dplayer-web-fullscreen-fix .fixedGroup, .dplayer-web-fullscreen-fix .sidebar, .dplayer-web-fullscreen-fix .header, .dplayer-web-fullscreen-fix .module-player-side{display:none!important} .dplayer:fullscreen video{height:100%!important} .MacPlayer, :not(.dplayer-fulled) video{height:600px!important}',
	//'www.ourxh.com': '.dplayer-web-fullscreen-fix #player-sidebar-is, .dplayer-web-fullscreen-fix .myui-panel_bd{display:none!important}',
	'acgndmku.com': 'iframe#buffer, iframe#install, .dplayer-web-fullscreen-fix .hot_banner, #fd_tips, .dplayer-web-fullscreen-fix .foot ul.extra{display:none!important} #topnav{position: absolute!important}',
	'www.ddzvod.com':'iframe#buffer, iframe#install{display:none!important} body:not(.dplayer-web-fullscreen-fix) .bofang{height:654px!important} video{max-height:100%!important}',
	// 'ke.qq.com': '.study-video-wrapper--gray:after{display:none!important}',
	'v.qq.com': '.dplayer-web-fullscreen-fix #mod_player~*, .dplayer-web-fullscreen-fix #shortcut, .dplayer-web-fullscreen-fix .site_head{display:none!important}',
	'wetv.vip': '.gm-fp-body .play__aside--right, .gm-fp-body .sidebar, .gm-fp-body header{display:none!important}'
};
router['www.nnvod.com']= router['www.ddzvod.com'];
const ss = router[host];
const reLZFrame = /^https:\/\/vip\.lz-?cdn\d*\.com\/share\//;
const iframes = document.getElementsByTagName('iframe');
const find = [].find.bind(iframes);
const getStyle = (o, s) => {
	if (o.style[s]) return o.style[s];
	s = s.replace(/([A-Z])/g,'-$1').toLowerCase();
	return getComputedStyle(o)?.getPropertyValue(s);
};

let cfg,dp;

const isMVFlash = e => {
	const isEmbed = e.matches('embed');
	let s = isEmbed ? e.src : (e.data || e.children.movie.value);
	if (!s || !/\.swf(?:$|\?)/.test(s)) return !1;
	if (e.offsetHeight > 99) return !0;
	if (isEmbed) return !1;
	s = q('embed', e);
	return !!(s && isMVFlash(s));
};
const createPlayer = async (p, url, type = 'auto') => {
	!cfg.useShaka && hookHls(cfg);
	if (!type || type == 'auto') type = getPlayType(url);
	const video = { url, type };
	let playRate;
	if (cfg.useShaka && (type == 'hls' || type == 'dash')) {
		video.type = 'm3u8';
		video.customType = {
			m3u8(e, player) {
				const sk = new shaka.Player(e);
				sk.configure({
					streaming: {
						bufferingGoal: cfg.buffSize + 9,
						// rebufferingGoal: 15,
						bufferBehind: cfg.buffSize,
					}
				});
				playRate = localStorage.mvPlayRate || 1;
				sk.load(url).catch(err => {
					if (err instanceof Error) {
					// shaka crashed with an unhandled native error
					}

					else if (err.severity === shaka.util.Error.Severity.CRITICAL) {
						alert('合金H5播放器\n无法解码！请换用兼容模式');
					} else {
					// handle non-fatal error, playback can continue
					}
				});
				player.shaka = sk;
			}
		};
	}
	dp = new DPlayer({
		video,
		theme: "#00B3FF",
		autoplay: true,
		screenshot: true,
		contextmenu: [
			{
				text: '将当前域名加入白名单',
				click(player) {
					chrome.runtime.sendMessage({id:'add-domain-whitelist', host});
					if (!player.video.duration) location.reload();
				}
			},{
				text: '不能播放！转内置播放器',
				click(player) {
					player.pause();
					const s = chrome.runtime.getURL('play.html') + `?vType=${type}&curTime=${~~player.video.currentTime}#${url}`;
					window.open(s);
				}
			}
		],
		container: p
	});
	playRate && dp.on('destroy', function() {this.shaka.destroy()});
	playRate && dp.on('loadedmetadata',async function() {
		await sleep(3300);
		dp.speed(+playRate);
	});
	await sleep(99);
	p.closest('body > *')?.classList.add('gm-dp-zTop');
	let a = [], e = dp.video;
	while (e.offsetHeight < 199) {
		a.push(e);
		e = e.parentNode;
	}
	if (a.length > 0) a.pop().style.height = e.offsetHeight + 'px';
	await sleep(99);
	cfg.autoWebFull && !cfg.hostsDisableWF.some(k => host.includes(k)) && dp.fullScreen.request('web');
	// dp.container.scrollIntoView({block:'nearest',behavior:'smooth'});
};
/// v 为iframe节点
const handleMessage = async(v, url, vType='auto') => {
	if (!v) return;
	if (reLZFrame.test(url)) {
		// const r = await fetch(url,{
			// header: {referer:''}
		// });
		// const txt = await r.text();
		// const path = r1(/var main = "(.+?\.m3u8)/, txt);
		// url = `https://${domain}${path}`;
		v.src = url;
		return;
	}
	// yhdmw7.com host为页面域名
	if (/\byhdmw\d+\.com/.test(host)) url = url.replace(/(\.com)\d+/,'$1');

	if (typeof ss == 'string') dom.style({}, ss);
	else if (typeof ss == 'function') ss();

	await sleep(99);
	let p;
	if (host == 'www.yatu.tv') {
		v.src = '';
		v.hidden = true;
		if (dp) {
			if (!cfg.useShaka) vType = vType || 'auto';
			else if (vType !== 'flv' && vType !== 'normal') vType = 'm3u8';
			dp.switchVideo({url, type:vType});
			dp.container.hidden = !1;
			return;
		}

		p = document.createElement('div');
		p.setAttribute('style', 'width:100%;height:97vh;');
		v.after(p);

		v.parentNode.style.height = '100%';
		const e = q('.play_xian');
		e && e.addEventListener('click', ev => {
			if (ev.target.matches('a')) v.hidden = !1;
			if (dp) dp.container.hidden = true;
		});
	}
	else if (/eacg\.net|wsdy\.top/.test(host)) {
		p = q('.mo-head-info');
		if (p) {
			p.classList.remove('mo-part-fixs');
			p.style.cssText = 'position: absolute';
		}
		p = v.parentNode;
		p.innerHTML = p.className = '';
		p.style.cssText = 'width:100%;height:80vh;';
	}
	else if (host == 'ke.qq.com') {
		p = v.parentNode;
		p.innerHTML = '<div style="width:100%;height:100%"></div>';
		p.classList.remove('study-video-wrapper--gray');
		p = p.firstChild;
	}
	else {// padding-bottom --bs-aspect-ratio
		if (!ss && v.closest('.MacPlayer td')) dom.style({}, router['acgndmku.com']);

		let {offsetWidth: w, offsetHeight: h} = v;
		if (h < w*0.5 || h > w*0.7) h = w*0.55;
		p = document.createElement('div');
		// const s = v.matches(':only-child') ? `width:100%;height:100%` : `width:${w}px;height:${h}px`;
		p.setAttribute('style', `width:100%;height:${h}px`);
		v.replaceWith(p);
	}
	while (!window.DPlayer) await sleep(99); //防止hls等库后于DPlayer库加载
	createPlayer(p, url, vType);
};

chrome.runtime.onMessage.addListener((msg, sender) => {
	let v = null;
	switch (msg.id) {
	case 'mv-block':
		v = [].find.call(document.querySelectorAll('object,embed'), isMVFlash);
		break;
	case 'iframe-block':
		v = find(e => e.src === msg.frameUrl) || find(e => e.allowFullscreen);
	}
	handleMessage(v, msg.url, msg.vType || '');
});

(async function (){
	const {default: api} = await import("./config.js");
	cfg = await api.read();
	const {default: cleanAds} = await import("./cleanM3u.js");
	if (cfg.domainsCleanM3u.some(k => host.includes(k))) {
		cleanAds();
	}
	else if (cfg.hostsGM.some(k => host.includes(k))) {
		const fnCode = cleanAds.toString().trim();
		dom.script({},`-${fnCode}();`).remove();
	}
})();