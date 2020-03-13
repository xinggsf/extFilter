const r1 = (regp, s) => regp.test(s) && RegExp.$1;
const sleep = ms => new Promise(resolve => { setTimeout(resolve, ms) });
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
const iframes = document.getElementsByTagName('iframe');
const find = [].find.bind(iframes);

const makePlayCfg = (v, url, type = 'auto') => {
	//log('found MV:\n', url, v);
	const cfg = {
		video: { url, type },
		autoplay: true,
		screenshot: true,
		theme: '#EC8',
		contextmenu: [
			{
				text: '合金H5扩展BUG反馈',
				link: 'https://bbs.kafan.cn/thread-2162743-1-1.html'
			}
		],
		container: v.parentNode
	};
	v.remove();
	return cfg;
};
const createPlayer = (cfg) => {
	//log(dp); https://raw.githubusercontent.com/MoePlayer/DPlayer/master/dist/DPlayer.min.js
	const dp = new DPlayer(cfg);
	dp.fullScreen.request('web');
	dp.container.closest('body > *').classList.add('gm-dp-zTop');
};