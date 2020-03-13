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

const cssList = {
	'www.dyjihe.com': '.dplayer, #PlayContainer{height:503px;padding:0!important}',
	'cn.funtv.cc': '.dplayer-web-fullscreen-fix .hot_banner, #fd_tips, .dplayer-web-fullscreen-fix .foot ul.extra{display:none!important}',
	'www.haitur.com': '.bottom{display:none!important}',
	'www.huaxingui.com': '.dplayer-web-fullscreen-fix #player-sidebar-is{display:none!important}',
	'kan.jinbaozy.com': '.dplayer:not(.dplayer-fulled) video{height:514px!important}',
	'v.qq.com': '.dplayer-web-fullscreen-fix #mod_player~*, .dplayer-web-fullscreen-fix #shortcut, .dplayer-web-fullscreen-fix .site_head{display:none!important}'
};
const ss = cssList[location.hostname];
ss && setTimeout(injectCSS,39,ss);