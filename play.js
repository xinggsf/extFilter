import syncApi from "./config.js";

// https://api.dogecloud.com/player/get.flv?vcode=5ac682e6f8231991&userId=17&ext=.flv  https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd
const createPlayer = (v, url, type = 'auto', curTime = 0) => {
	if (!type || type == 'auto') type = uu.getPlayType(url);
	const p = new DPlayer({
		video: { url, type },
		theme: "#00B3FF",
		autoplay: true,
		screenshot: true,
		contextmenu: [
			{
				text: '刷新',
				click(player) {
					const s = new URL(location.href);
					s.searchParams.set('curTime', ~~player.video.currentTime);
					location.replace(s.href);
				}
			}
		],
		container: v
	});
	p.on('loadedmetadata', function() {
		if (p.video.duration == Infinity) return;
		p.speed(+localStorage.mvPlayRate || 1);
		curTime && p.seek(+curTime);
	});
	return p;
};

const mvUrl = location.hash.slice(1);
const ps = new URLSearchParams(location.search);

(async function(){
	uu.hookHls(await syncApi.read({hlsCache:!1,buffSize:60}));
	window.dp = createPlayer(uu.q('#player'), mvUrl, ps.get('vType'), ps.get('curTime'));
})();