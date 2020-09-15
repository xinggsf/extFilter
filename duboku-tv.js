const mainAddr = 'https://tv.wedubo.com/';//主视频服务器地址（前缀）
//修正、补全为绝对地址
const fixUrl = s => {
	if (s[0] == "/") return  mainAddr + s;
	return s.startsWith(mainAddr) ? s : mainAddr + s.slice(s.indexOf('/',11));
};
/* 
const checkM3u8Url = async (url) => {
	url = fixUrl(url);
	let resp = await fetch(url);
	let txt = await resp.text();
	const a = txt.split('\n');
	if (a[3].trim() == '') return fixUrl(a[2]);
	return url;
}; */

(async () => {
	let src, v = q('.embed-responsive > script:first-of-type');
	if (!v) return;
	dom.style({}, '.dplayer{height:566px!important}');
	/* 
	new MutationObserver(function(rs) {
		v = find(e => e.matches('td>iframe'));
		if (v) {
			this.disconnect();
			src = v.src;
			v.removeAttribute('src');
		}
	})
	.observe(v.parentNode, {
		childList : true,
		subtree : true
	});
 */
	try {
		let m3u8Url, resp, vid,
		txt = r1(/player_data=(.+?)$/, v.textContent);
		const data = JSON.parse(txt);
		if (data.from == 'iframe') {
			//vid = txt.split('/').pop();
			resp = await fetch(fixUrl(data.url));
			txt = await resp.text();
			txt = r1(/var content\s*=\s*"(.+?)"/, txt);
			if (!txt) {
				alert('视频已经被移除!');
				return;
			}
			const bytes = CryptoJS.AES.decrypt(txt, 'ppvod');
			txt = bytes.toString(CryptoJS.enc.Utf8);
			//pic = r1(/var pic = "(.+?)"/, txt);
			//mainAddr = r1(/var redirecturl = "(.+?)"/, txt);
			m3u8Url = r1(/var main = "(.+?)"/, txt);
		} else m3u8Url = data.url;
		if (!m3u8Url) throw new Error('url error!');

		m3u8Url = fixUrl(m3u8Url);
		resp = await fetch(m3u8Url);
		txt = await resp.text();
		const parser = new m3u8Parser.Parser();
		parser.push(txt);
		parser.end();
		const playlist = parser.manifest.playlists;
		//while (!v) await sleep(30);
		const playcfg = makePlayCfg(v.parentNode, m3u8Url, 'hls');
		if (playlist && playlist.length > 1) {
			const labels = ["标清", "高清", "超清", "蓝光"];
			const qualitys = [];
			for (let i = 0; i < playlist.length; i++) {
				qualitys.push({
					name: labels[i],
					url: fixUrl(playlist[i].uri),
					type: 'hls'
				});
			}
			playcfg.video.quality = qualitys;
			delete playcfg.video.url;
			playcfg.video.defaultQuality = 0;
		}
		createPlayer(playcfg);
	}
	catch (ex) {
		// log(ex);
		// if (v && v.matches('iframe')) v.src = src;
	}
})();