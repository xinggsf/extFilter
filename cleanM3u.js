//UBO m3u-prune.js https://en.wikipedia.org/wiki/M3U
export default function() {
	// const reFf0Lz = /\.ts\s+(#EXT-X-DISCONTINUITY).+?\1/gs;// 量子云、非凡云
	const itemsHandle = [// 处理逻辑组
		{
			reUrl: /^https:\/\/(vip\d*\.lz-?cdn|v\.cdnlz)\d*\./,
			reAds: /(#EXT-X-DISCONTINUITY\s+)#EXTINF:6\.666667,\n.+(\n#EXTINF:3\.333333,\n).+\2.+\2[^]+?\1/g, rpl: ''
		}, {
			reUrl: /^https:\/\/vip\.ffzy-?(?:play|online|read)\d*\./,
			reAds: /(#EXT-X-DISCONTINUITY\s+)#EXTINF:7\.300000,\n.+\n#EXTINF:3\.100000,\n.+\n#EXTINF:3\.333333[^]+?\1/g, rpl: ''
		}
	];
	const urlFromArg = arg => {
		if ( typeof arg === 'string' ) { return arg; }
		if ( arg instanceof Request ) { return arg.url; }
		return String(arg);
	};
	const matchM3u = url => url.endsWith('.m3u8') && itemsHandle.find(k => k.reUrl.test(url));
	const pruner = (text,item) => {
		if (/^\s*#EXTM3U/.test(text) === !1) return text;
		const lines = text.trim().split('\n').filter(l => l !== '#EXT-X-DISCONTINUITY');
		let m, i = lines.length-2;
		if (i < 22) return lines.join('\n');
		for (;m = lines[i].match(/(\d{4})\.ts$/),!m;i--);

		// const preWord = lines[i].slice(-10,-7); "a00" line[i] : adfa000123.ts
		i -= 22;
		for (const max = +m[1];i > 33;i-=2) {
			const n = +lines[i].slice(-7, -3);
			if (!n || n > max) lines[i] = lines[i-1] = void 0;
		}
		return lines.filter(l => l !== void 0).join('\n');
	};
	const realFetch = self.fetch;
	self.fetch = new Proxy(self.fetch, {
		apply(target, thisArg, args) {
			const item = matchM3u(urlFromArg(args[0]));
			if (!item) {
				return Reflect.apply(target, thisArg, args);
			}
			return realFetch(...args).then(realResponse =>
				realResponse.text().then(text =>
					new Response(pruner(text,item), {
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
			const item = matchM3u(urlFromArg(args[1]));
			item && thisArg.addEventListener('readystatechange', function() {
				if ( thisArg.readyState !== 4 ) { return; }
				const type = thisArg.responseType;
				if ( type !== '' && type !== 'text' ) { return; }
				const textin = thisArg.responseText;
				const textout = pruner(textin,item);
				if ( textout === textin ) { return; }
				Reflect.defineProperty(thisArg, 'response', { value: textout });
				Reflect.defineProperty(thisArg, 'responseText', { value: textout });
			});
			return Reflect.apply(target, thisArg, args);
		}
	});
}