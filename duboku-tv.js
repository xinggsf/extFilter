const checkM3u8Url = async (url, mainAddr = '') => {
	if (url[0] == "/") url = mainAddr + url;
	else if (!mainAddr){
		const u = new URL(url);
		mainAddr = u.protocol + '//'+ u.host;
	}
	let resp = await fetch(url);
	let txt = await resp.text();
	const a = txt.split('\n');
	if (a[3].trim() == '') {
		let ret = a[2];
		if (ret[0] == "/") ret = mainAddr + ret;
		return ret;
	}
	return url;
};

(async () => {
	let v, mainAddr = 'https://v.zdubo.com';
	v = q('.embed-responsive > script:first-of-type');
	if (!v) return;
	new MutationObserver(function(rs) {
		v = find(e => e.matches('td>iframe'));
		if (v) {
			this.disconnect();
			v.removeAttribute('src');
		}
	})
	.observe(v.parentNode, {
		childList : true,
		subtree : true
	});

	let m3u8Url, resp, addr, txt = v.textContent;
	txt = r1(/player_data=(.+?)$/, txt);
	const playData = JSON.parse(txt);
	if (playData.from == 'iframe') {
		addr = playData.url;
		if (!addr.startsWith(mainAddr)){
			let n = txt.indexOf('/', 11);
			addr = mainAddr + addr.slice(n);
		}
		const vid = txt.split('/').pop();
		resp = await fetch(addr);
		txt = await resp.text();
		txt = r1(/var content\s*=\s*"(.+?)"/, txt);
		if (!txt) {
			alert('视频已经被移除!');
			return;
		}
		const bytes = CryptoJS.AES.decrypt(txt, 'ppvod');
		txt = bytes.toString(CryptoJS.enc.Utf8);
		mainAddr = r1(/var redirecturl = "(.+?)"/, txt);
		m3u8Url = r1(/var main = "(.+?)"/, txt);
	} else m3u8Url = playData.url;
	if (!m3u8Url) return;
	m3u8Url = await checkM3u8Url(m3u8Url, mainAddr);
	resp = await fetch(m3u8Url);
	txt = await resp.text();
	const parser = new m3u8Parser.Parser();
	parser.push(txt);
	parser.end();
	const playlist = parser.manifest.playlists;
/*
	if (!txt || txt.endsWith('.html')) {
		chrome.runtime.onMessage.addListener((msg, sender) => {
			checkM3u8Url(msg.url).then(r => createPlayer(v,r,'hls'));
		});
		return;
	} */
	while (!v) await sleep(30);
	const playcfg = makePlayCfg(v, m3u8Url, 'hls');
	if (playlist && playlist.length > 1) {
		const labels = ["标清", "高清", "超清", "蓝光"];
		const qualitys = [];
		for (let i = 0; i < playlist.length; i++) {
			let surl = playlist[i].uri;
			if (surl[0] == "/") surl = mainAddr + surl;
			qualitys.push({
				name: labels[i],
				url: surl,
				type: 'hls'
			});
		}
		playcfg.video.quality = qualitys;
		delete playcfg.video.url;
		playcfg.video.defaultQuality = 0;
	}
	log(playcfg);
	createPlayer(playcfg);
})();