//UBO m3u-prune.js https://en.wikipedia.org/wiki/M3U
export default function() {
	// const reFf0Lz = /\.ts\s+(#EXT-X-DISCONTINUITY).+?\1/gs;
	const itemsHandle = [// 处理逻辑组: 神马云、量子云、非凡云
		/^https:\/\/cdn\d*\.vipyz-cdn\d*\.com/,
		/^https:\/\/(yzzy|hdzy|vip|tudou)\d*\.play-cdn\d*\.com/,
		/^https:\/\/v\d*\.yzzy\d*-play\.com/,
		/^https:\/\/(vip|hd)\d*\.lz-?cdn\d*\.com/,
		/^https:\/\/v\d*\.cdnlz\d*\.com/,
		/^https:\/\/(svips)?vip\.ffzy-?(?:play|online|read)\d*\./,
		//暴风云 /^https:\/\/s\d*\.bfengbf\.com/ /(#EXT-X-DISCONTINUITY\n).{11,388}\1/gs
	];
	const urlFromArg = arg => {
		if ( typeof arg === 'string' ) { return arg; }
		if ( arg instanceof Request ) { return arg.url; }
		return String(arg);
	};
	const matchM3u = url => url.endsWith('.m3u8') && itemsHandle.some(k => k.test(url));
	const pruner = (text) => {
		if (/^\s*#EXTM3U/.test(text) === !1) return text;
		const lines = text.trim().split('\n').filter(l => l !== '#EXT-X-DISCONTINUITY');
		let i = lines.length-2;
		if (i < 22) return lines.join('\n');
		// const idx = lines[i].length-7;
		// console.log('index: %i ; char: %s ; ID string: %s',idx,lines[i][idx],lines[i].slice(idx));
		for (;lines[i].slice(-9,-7) !== '00';i-=2) {
			lines[i] = lines[i-1] = void 0;
		}
		const m = lines[i].match(/(\d{4})\.ts$/);
		// console.log('last line %i: %s', i, lines[i]);
		if (!m) return lines.join('\n');

		// const preWord = lines[i].slice(-10,-7); "a00" line[i] : adfa005123.ts
		// const len = lines[i].length;
		i -= 6;
		for (const max = +m[1];i > 33;i-=2) {
			if (lines[i].at(-8) === '0') { // && len === lines[i].length
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