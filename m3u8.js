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
const createPlayer = (v, url) => {
	//log('found MV:\n', url, v);
	const dp = new DPlayer({
		video: {
			url: url,
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
	//log(dp); https://raw.githubusercontent.com/MoePlayer/DPlayer/master/dist/DPlayer.min.js
	dp.fullScreen.request('web');
	dp.container.closest('body > *').classList.add('gm-dp-zTop');
};

chrome.runtime.onMessage.addListener((msg, sender) => {
	let v = null;
	switch (msg.id) {
	case 'mv-block':
		v = [].find.call(document.querySelectorAll('object,embed'), isMVFlash);
		break;
	case 'iframe-block':
		v = msg.frameUrl ? find(e => e.src == msg.frameUrl) :
			find(e => e.allowFullscreen) || find(isPlayer);
		break;
	}
	if (v) createPlayer(v, msg.url);
});

const cssList = {
	'www.dyjihe.com': '.dplayer, #PlayContainer{height:503px;padding:0!important}',
	'cn.funtv.cc': '.dplayer-web-fullscreen-fix .hot_banner, #fd_tips, .dplayer-web-fullscreen-fix .foot ul.extra{display:none!important}',
	'www.haitur.com': '.bottom{display:none!important}',
	'www.huaxingui.com': '.dplayer-web-fullscreen-fix #player-sidebar-is{display:none!important}',
	'kan.jinbaozy.com': '.dplayer:not(.dplayer-fulled) video{height:514px!important}',
	'v.qq.com': '.dplayer-web-fullscreen-fix #mod_player~*, .dplayer-web-fullscreen-fix #shortcut, .dplayer-web-fullscreen-fix .site_head{display:none!important}'
};
const ss = cssList[location.hostname];
ss && setTimeout(injectCSS,99,ss);