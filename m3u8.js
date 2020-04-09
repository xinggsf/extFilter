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

const router = {
	['www.xiamov.com']() {
		q('head > base[target="_blank"]').remove();
	},
	['www.yasehezi.com']() {
		let e = document.createElement('meta');
		e.setAttribute('name','referrer');
		e.setAttribute('content','no-referrer');
		document.head.appendChild(e);

		e = document.createElement('script');
		e.textContent = `setTimeout(x => { $('body').unbind('keydown'); }, 990);`;
		document.body.appendChild(e);
	},
	['www.banlidy.net']() {
		const e = document.createElement('script');
		e.textContent = `setTimeout(x => { $('body').unbind('keydown'); }, 990);`;
		document.body.appendChild(e);
	},
	'www.dyjihe.com': '.dplayer, #PlayContainer{height:503px;padding:0!important}',
	'kan.jinbaozy.com': '.dplayer{height:503px!important}',
	//'kan.jinbaozy.com': '.dplayer:not(.dplayer-fulled) video{height:514px!important}',
	'cn.funtv.cc': '.dplayer-web-fullscreen-fix .hot_banner, #fd_tips, .dplayer-web-fullscreen-fix .foot ul.extra{display:none!important}',
	'www.haitur.com': '.bottom{display:none!important}',
	'www.huaxingui.com': '.dplayer-web-fullscreen-fix #player-sidebar-is{display:none!important}',
	'v.qq.com': '.dplayer-web-fullscreen-fix #mod_player~*, .dplayer-web-fullscreen-fix #shortcut, .dplayer-web-fullscreen-fix .site_head{display:none!important}'
};
router['qqkpb.com'] = router['ttmeiju.me'] = router['kan.jinbaozy.com'];
const ss = router[location.hostname];
if (typeof ss == 'string') setTimeout(injectCSS,99,ss);
else if (typeof ss == 'function') document.addEventListener('DOMContentLoaded',ss);