const router = {
	['www.xiamov.com']() {
		q('head > base[target="_blank"]').remove();
	},
	['www.yasehezi.com']() {
		dom.meta({
			name: 'referrer',
			content: 'no-referrer'
		});
	},
	['www.banlidy.net']() {
		//const e = q('head > script[src$="system.js"]'); onload
		dom.script({}, `setTimeout(x => {$('body').unbind('keydown')},99);`);
	},
	'www.dyjihe.com': '.dplayer, #PlayContainer{height:503px;padding:0!important}',
	'kan.jinbaozy.com': '.dplayer:not(.dplayer-fulled){height:503px!important}',
	'cn.funtv.cc': '.dplayer-web-fullscreen-fix .hot_banner, #fd_tips, .dplayer-web-fullscreen-fix .foot ul.extra{display:none!important}',
	'www.haitur.com': '.bottom{display:none!important}',
	'www.huaxingui.com': '.dplayer-web-fullscreen-fix #player-sidebar-is{display:none!important}',
	'v.qq.com': '.dplayer-web-fullscreen-fix #mod_player~*, .dplayer-web-fullscreen-fix #shortcut, .dplayer-web-fullscreen-fix .site_head{display:none!important}'
};
router['qqkpb.com'] = router['ttmeiju.me'] = router['kan.jinbaozy.com'];
router['www.haiouys.com'] = router['www.edu-hb.com'] = router['cn.funtv.cc'];
const ss = router[location.hostname];
ss && document.addEventListener('DOMContentLoaded',x => {
	if (typeof ss == 'string') dom.style({}, ss);
	else ss();
});

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
	if (v) createPlayer(makePlayCfg(v, msg.url));
});
/*
fetch('https://iqiyi.cdn9-okzy.com/20200222/6555_b7230a0b/1000k/hls/index.m3u8', {
	headers: {
		'cache-control': 'public',
		'referer': 'https://iqiyi.cdn9-okzy.com/share/6fae4e7975cfb72a356e6a8682456c6e',
	}
}).then(t => r.text()) */