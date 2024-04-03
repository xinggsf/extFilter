//UBO m3u-prune.js https://en.wikipedia.org/wiki/M3U
export default function() {
	// const reFf0Lz = /\.ts\s+(#EXT-X-DISCONTINUITY).+?\1/gs;
	const itemsHandle = [// 处理逻辑组: 神马云、量子云、非凡云
		/^https:\/\/yzzy\d*\.play-cdn\d*\.com/,
		/^https:\/\/(vip\d*\.lz-?cdn|v\.cdnlz)\d*\./,
		/^https:\/\/(svips)?vip\.ffzy-?(?:play|online|read)\d*\./
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
		for (;lines[i].slice(-8, -7) !== '0';i-=2) {
			lines[i] = lines[i-1] = void 0;
		}
		const m = lines[i].match(/(\d{4})\.ts$/);
		if (!m) return lines.join('\n');

		// const preWord = lines[i].slice(-10,-7); "a00" line[i] : adfa000123.ts
		i -= 6;
		for (const max = +m[1];i > 33;i-=2) {
			const n = +lines[i].slice(-7, -3);
			if (n > max || lines[i].slice(-8, -7) !== '0') lines[i] = lines[i-1] = void 0;
		}
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