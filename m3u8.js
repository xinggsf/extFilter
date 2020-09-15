const router = {
	['www.xiamov.com']() {
		q('head > base[target]').remove();
	},
	/* ['www.nfmovies.com']() {
		dom.meta({
			name: 'referrer',
			content: 'no-referrer'
		});
		dom.meta({
			'http-equiv': 'Access-Control-Allow-Origin',
			content: '*'
		});
		dom.meta({
			'http-equiv': 'Access-Control-Allow-Headers',
			content: "Origin, X-Requested-With, Content-Type, Accept"
		});
	}, */
	['quanwo.com']() {
		dom.script({}, `setTimeout(x => {$('body').unbind('keydown')},99);`);
	},
	'www.dandanzan.com': '.dplayer-web-fullscreen-fix video{max-height:100%!important}',
	'www.dyjihe.com': '.dplayer, #PlayContainer{height:503px;padding:0!important}',
	// 'www.sansuia.com': '.dplayer:not(.dplayer-fulled){height:733px!important} .fed-play-player{padding-top:0!important}',
	'k.jinbaodm.com': '.dplayer:not(.dplayer-fulled){height:503px!important}',
	'www.edu-hb.com': '.dplayer-web-fullscreen-fix .hot_banner, #fd_tips, .dplayer-web-fullscreen-fix .foot ul.extra{display:none!important} #topnav{position: absolute!important}',
	'www.huaxingui.com': '.dplayer-web-fullscreen-fix #player-sidebar-is{display:none!important}',
	'v.qq.com': '.dplayer-web-fullscreen-fix #mod_player~*, .dplayer-web-fullscreen-fix #shortcut, .dplayer-web-fullscreen-fix .site_head{display:none!important}'
};
router['qqkpb.com'] = router['ttmeiju.me'] = router['k.jinbaodm.com'];
router['www.haiouys.com'] = router['www.edu-hb.com'];
router['www.foxiys.com'] = router['www.dyjihe.com'];
router['www.imomoe.in'] = router['www.xxdm5.com'] = router['www.xiamov.com'];
router['www.banlidy.net'] = router['quanwo.com'];
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