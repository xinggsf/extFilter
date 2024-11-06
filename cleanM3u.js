//UBO m3u-prune.js https://en.wikipedia.org/wiki/M3U
export default function() {
	const items = [
		'hmrv', 'heimuer', //木耳云
		/^lz-?cdn/,'cdnlz', //量子云
		'ffzy', //非凡云
		'hdzyk','high','play-cdn','vipyz-cdn','yzzy' //神马云 high\d*-playback
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
		if (hasFileExt(url, '.m3u8') && /\.?([\w\-]+)\.[a-z]{2,5}[:\/]/.test(url)) {
			const u = RegExp.$1;
			iItem = items.findIndex(k => k instanceof RegExp ? k.test(u) : u.startsWith(k));
			return true;
		}
	};
	const pruner = (text) => {
		text = text.trim();
		if (!text.startsWith('#EXTM3U') || text.length < 188) return text;
		if (text.slice(66,188).includes('#EXT-X-DISCONTINUITY')) {
			text = text.replace(/\s+#EXT-X-DISCONTINUITY/,'');
		}

		if (iItem == -1) {
			console.log('合金HTML5扩展： Remove ad\'s lines of m3u8!');
			return text.replace(/\s+(#EXT-X-DISCONTINUITY).+?\1/gs,'');
		}
		if (4 == iItem) {//非凡云
			console.log('合金HTML5扩展： Remove ad\'s lines of m3u8!');
			return text.replace(/\s+(#EXT-X-DISCONTINUITY).{188,281}\1/gs,'')
				// .replace(/\s+#EXT-X-DISCONTINUITY/g,'');
		}
		if (iItem < 2) {//木耳云
			console.log('合金HTML5扩展： Remove ad\'s lines of m3u8!');
			return text.replace(/\s+(#EXT-X-DISCONTINUITY).+?\1/s,'')
				// 3或4个相同时长的ts项（正则子组2）
				.replace(/\s+(#EXT-X-DISCONTINUITY)(\n#EXTINF:\d+\.\d+,\n).+\2.+\2.+(\2.+)?\n\1/g,'')
				// .replace(/\s+#EXT-X-DISCONTINUITY/g,'');
		}

		const lines = text.split(/\s+#EXT-X-DISCONTINUITY\s+|\s+/);
		let i = lines.length-2;
		for (;lines[i].slice(-9,-7) !== '00';i-=2) {
			lines[i] = lines[i-1] = void 0;
		}
		const m = lines[i].match(/(\d{4})\.ts$/);
		if (!m) return lines.join('\n');

		// const preWord = lines[i].slice(-10,-7); "a00" line[i] : adfa005123.ts
		i -= 6;
		for (const max = +m[1];i > 33;i-=2) {
			if (lines[i].at(-8) === '0') {
				const n = +lines[i].slice(-7, -3);
				if (n < max) continue;
			}
			lines[i] = lines[i-1] = void 0;
		}
		console.log('合金HTML5扩展： Remove ad\'s lines of m3u8!');
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