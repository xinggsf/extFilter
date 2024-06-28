//UBO m3u-prune.js https://en.wikipedia.org/wiki/M3U
export default function() {
	const items = [
		/^lz-?cdn/,'cdnlz', //量子云
		'ffzy', //非凡云
		'hdzyk','play-cdn','vipyz-cdn','yzzy',/playback$/, //神马云 high\d*-playback
	];
	const urlFromArg = arg => {
		if ( typeof arg === 'string' ) { return arg; }
		if ( arg instanceof Request ) { return arg.url; }
		return String(arg);
	};
	let curItem = null; // 匹配项
	const matchM3u = url => {
		if (url.endsWith('.m3u8') && /\.?([\w\-]+)\.com/.test(url)) {
			const u = RegExp.$1;
			curItem = items.find(k => k instanceof RegExp ? k.test(u) : u.startsWith(k));
			return true;
		}
	};
	const pruner = (text) => {
		text = text.trim();
		if (!text.startsWith('#EXTM3U') || text.length < 122) return text;
		if (!curItem) {
			if (text.slice(91,133).includes('#EXT-X-DISCONTINUITY')) {
				text = text.replace(/\s+#EXT-X-DISCONTINUITY/,'');
			}
			console.log('合金HTML5扩展： Remove ad\'s lines of m3u8!');
			return text.replace(/\s+(#EXT-X-DISCONTINUITY).+?\1/gs,'');
		}

		const lines = text.split(/\s+#EXT-X-DISCONTINUITY\s+|\s+/);
		let i = lines.length-2;
		if (i < 55) return lines.join('\n');
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