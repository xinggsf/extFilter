//UBO m3u-prune.js https://en.wikipedia.org/wiki/M3U
export default function() {
	const items = [
		'hmrv', 'heimuer', //木耳云
		/^lz-?cdn/,'cdnlz',/^lz\d*uu/,  //量子云
		'ffzy', //非凡云
		/^high\d*-p/,'hdzyk',/^y[yz]zy/,'vipyz-' //神马云 high\d*-playback play-cdn
	];
	const hasFileExt = (url, ex) => {
		return url.endsWith(ex) || url.includes(ex +'?', 22);
	};
	const urlFromArg = arg => {
		if ( typeof arg === 'string' ) { return arg; }
		if ( arg instanceof Request ) { return arg.url; }
		return String(arg);
	};
	let iItem = 0; // 匹配项
	const matchM3u = url => {
		if (!hasFileExt(url, '.m3u8')) return !1;
		const m = url.match(/^https?:\/\/([\w\-]+)\.([\w\-]+)(\.?)/);
		if (m[1].startsWith('yzzy')) iItem = 9;//神马云
		else {
			const u = m[3] ? m[2] : m[1];
			iItem = items.findIndex(k => k instanceof RegExp ? k.test(u) : u.startsWith(k));
		}
		return true;
	};
	const pruner = (text) => {
		text = text.trim();
		if (
			text.length < 211 ||
			!text.startsWith('#EXTM3U') ||
			!text.endsWith('#EXT-X-ENDLIST')
		) return text;
		if (text.slice(22,188).includes('#EXT-X-DISCONTINUITY')) {
			text = text.replace(/\s+#EXT-X-DISCONTINUITY/,'');
		}

		if (iItem == -1) {
			console.log('合金HTML5扩展： Remove ad\'s lines of m3u8!');
			return text.replace(/\s+(#EXT-X-DISCONTINUITY).+?\1/gs,'');
		}
		if (5 == iItem) {
			console.log('合金HTML5扩展：已删除非凡云的m3u8广告!');
			return text.replace(/(\n#EXT-X-DISCONTINUITY)[^]{200,333}#EXTINF:3\.3{6},\n.+?\n#EXTINF:\d\.\d66667,\n.+?\1/g,'')
				// .replace(/\s+#EXT-X-DISCONTINUITY/g,'');
		}
		if (iItem < 2) {
			console.log('合金HTML5扩展：已删除木耳云的m3u8广告!');
			return text.replace(/(\n#EXT-X-DISCONTINUITY)\n.+\n.+\1/,'')
				// 3或4个相同时长的ts项（正则子组2）
				.replace(/(\n#EXT-X-DISCONTINUITY)(\n.+\n).+\2.+\2.+(\2.+)?\1/g,'')
				// .replace(/\s+#EXT-X-DISCONTINUITY/g,'');
		}
		if (iItem > 5) {//神马云
			const n = text.lastIndexOf('#EXT-X-DISCONTINUITY');
			console.log('合金HTML5扩展：已删除神马云的m3u8广告!');
			return text.slice(0, n)
				.replace(/(#EXT-X-DISCONTINUITY\n)#EXTINF:6\.666667,\n.+\n#EXTINF:3\.3{6},[^]+?\1/g,'')
				+ '#EXT-X-ENDLIST';
		}

		const lines = text.split(/\s+#EXT-X-DISCONTINUITY\s+|\s+/);
		let i = lines.length-2;
		// for (;!/^0\d+$/.test(lines[i].slice(-9,-3));i-=2) {
			// lines[i] = lines[i-1] = void 0;
		// }
		const max = +lines[i].slice(-8,-3);// -9位断定为 0
		const llen = lines[i].length;
		// const preWord = lines[i].slice(-12,-9); "dfa" line[i] : adfa005123.ts
		for (i-=6;i > 33;i-=2) {
			if (llen == lines[i].length && +lines[i].slice(-9,-3) < max) continue;
			lines[i] = lines[i-1] = void 0;
		}
		console.log(`合金HTML5扩展：已删除量子云的m3u8广告!`);
		return lines.filter(l => l !== void 0).join('\n');
	};
	const realFetch = self.fetch;
	self.fetch = new Proxy(self.fetch, {
		apply(target, thisArg, args) {
			if (!matchM3u(urlFromArg(args[0]))) {
				return Reflect.apply(target, thisArg, args);
			}
			return realFetch(...args).then(realResponse =>
				realResponse.text().then(text =>
					new Response(pruner(text), {
						status: realResponse.status,
						statusText: realResponse.statusText,
						headers: realResponse.headers,
					})
				)
			);
		}
	});
	self.XMLHttpRequest.prototype.open = new Proxy(self.XMLHttpRequest.prototype.open, {
		apply: async (target, thisArg, args) => {
			const url = urlFromArg(args[1]);
			if (matchM3u(url)) thisArg.addEventListener('readystatechange', function() {
				// thisArg.finalUrl && matchM3u(thisArg.finalUrl);
				if ( thisArg.readyState !== 4 ) { return; }
				const type = thisArg.responseType;
				if ( type !== '' && type !== 'text' ) { return; }
				const textin = thisArg.responseText;
				const textout = pruner(textin);
				if ( textout === textin ) { return; }
				Reflect.defineProperty(thisArg, 'response', { value: textout });
				Reflect.defineProperty(thisArg, 'responseText', { value: textout });
			});
			return Reflect.apply(target, thisArg, args);
		}
	});
}