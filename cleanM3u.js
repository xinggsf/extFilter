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
	let iItem = -1; // 匹配项
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
		let maxADtime;
		const replacer = (rawStr, g1, g2) => {
			const i = g2.lastIndexOf(',');
			// 掐头去尾以保证split得到纯计时值数组
			const timeLines = g2.slice(8,i).split(/,.{39,77}F:/s); // /,\n\w+\.ts\n#EXTINF:/
			const ADtime = timeLines.reduce((a, b) => +b + a, 0);
			return ADtime < maxADtime ? '' : rawStr.slice(21);
		};
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
			maxADtime = 25;
			console.log('合金HTML5扩展：已删除非凡云的m3u8广告!');
			// #EXTINF:2.233333, 2cf507fe7d7bbeeb898f89cb9b9f47e6.ts 一切片二行~长54，5－8个切片：
			return text.replace(/(#EXT-X-DISCONTINUITY\n)(.{270,455})\1/gs, replacer)
				// .replace(/\s+#EXT-X-DISCONTINUITY/g,'');
		}
		if (iItem < 2) {
			const n = text.lastIndexOf('\n') - text.lastIndexOf(',') - 1; // ts'line.length +1
			// 3、4个相同时长（正则子组2）
			const re = new RegExp(String.raw`(\n#EXT-X-DISCONTINUITY)(.+?,).{${n}}\2.{${n}}\2.{${n},${n*2+22}}\1`,'gs');
			const re2Line = new RegExp(`(\\n#EXT-X-DISCONTINUITY).{${n+11},${n+22}}\\1`,'s');
			console.log('合金HTML5扩展：已删除木耳云的m3u8广告!');
			return text.replace(re2Line,'').replace(re,'')
		}
		if (iItem > 5) {
			maxADtime = 19;
			const n = text.lastIndexOf('#EXT-X-DISCONTINUITY');
			const len = text.length - n - 35;
			const re = new RegExp(String.raw`(#EXT-X-DISCONTINUITY\n)(.{${len}})\1`,'gs');
			console.log('合金HTML5扩展：已删除神马云的m3u8广告!');
			return text.slice(0,n).replace(re, replacer) + '#EXT-X-ENDLIST';
		}

		console.log(`合金HTML5扩展：已删除量子云的m3u8广告!`);
		// return text.replace(/(#EXT-X-DISCONTINUITY\n).{34}ts.{148,260}\1/gs, '');
		//37*4=148,37*7+1=260 #EXT-X-DISCONTINUITY #EXTINF:6.667, 33ebec35ff70821164.ts
		return text.replace(/(#EXT-X-DISCONTINUITY\n)(.{185,259})\1/gs,
			(rawStr, g1, g2) => g2.length % 37 ? rawStr.slice(21) : '');
/*
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
		return lines.filter(Boolean).join('\n'); */
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