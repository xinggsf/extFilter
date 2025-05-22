// 下二个函数引用UBO代码，无错中断执行~类似运行期断言
function getExceptionToken() {
    const token =
        String.fromCharCode(Date.now() % 26 + 97) +
        Math.floor(Math.random() * 982451653 + 982451653).toString(36);
    const oe = self.onerror;
    self.onerror = function(msg, ...args) {
        if ( typeof msg === 'string' && msg.includes(token) ) { return true; }
        if ( oe instanceof Function ) {
            return oe.call(this, msg, ...args);
        }
    }.bind();
    return token;
}

const uu = {
	reHost: /^https?:\/\/([^/:]+)/,
	r1: (regp, s) => regp.test(s) && RegExp.$1,
	sleep: ms => new Promise(resolve => { setTimeout(resolve, ms) }),
	log: console.log.bind(console),
	q: (css, p = document) => p.querySelector(css),
	vLib: { normal:1,hls:2,dash:4,flv:8,shaka:16,auto:-1 },
	abort() {
		throw new ReferenceError(getExceptionToken());
	},
	dom: new Proxy({}, {
		get(target, tag) {
			return function (attrs = {}, ...children) {
				const el = document.createElement(tag);
				Object.assign(el, attrs);
				for (let child of children) {
					if (typeof child === 'string') {
						child = document.createTextNode(child);
					}
					el.appendChild(child);
				}
				(document.head || document.documentElement).appendChild(el);
				return el;
			}
		}
	}),
	getExtName(url) {
		let i, n = url.indexOf('?', 21);
		if (-1 != n) i = n-3;
		else {
			i = url.length - 3;
			n = void 0;
		}
		i = url.lastIndexOf('.',i) +1;
		if (i) return url.slice(i, n);
	},
	getFileName(url) {
		let i, n = url.indexOf('?',33);
		if (-1 != n) i = n-3;
		else {
			i = url.length - 4;
			n = void 0;
		}
		i = url.lastIndexOf('.',i) +1;
		if (!i) return;
		i = url.lastIndexOf('/',i-3) +1;
		return {pos: i, fname: url.slice(i, n)};
	},
	getPlayType(url) {
		const ext = uu.getExtName(url);
		if (/mp4|ogg|webm/.test(ext)) return 'normal';
		if (ext == 'm3u8') return 'hls';
		if (ext == 'mpd') return 'dash';
		if (url.includes('/hls/', 11) || url.includes('m3u8', 7)) return 'hls';
		if (url.includes('.mp4', 25)) return 'normal';
		if (url.includes('.mpd', 25)) return 'dash';
		return 'auto';
	},
	getPlayOrd: (url) => uu.vLib[uu.getPlayType(url)] || 2,
	toByteUnit(bytes,len=0) {
		if (bytes < 1024) return bytes;
		const symbols = Array.from('BKMGTPEZYB');
		const exp = ~~(Math.log(bytes)/Math.log(2));
		const i = ~~(exp / 10);
		bytes /= 2 ** (10 * i);
		bytes = bytes.toFixed(2);
		if (len !== 0) bytes = bytes.slice(0,len-1);
		return bytes.replace(/\.?0*$/,'') + symbols[i];
	},
	hookHls({buffSize,hlsCache}) {
		if (self.Hls?.isSupported()) Hls = new Proxy(Hls, {
			construct(target, args, newTarget) {
				const opts = {
					maxBufferSize: 36 << 20, // 36MB
					maxBufferLength: buffSize,
					maxMaxBufferLength: buffSize + 9,
					backBufferLength: hlsCache ? Infinity : 9
				};
				args[0] = Object.assign(args[0] || {}, opts);
				return new target(...args);
			}
		});
		/*
		if (!Hls?.isSupported()) return;
		const fn = Hls.prototype.loadSource;
		Hls.prototype.loadSource = function(...args) {
			Object.assign(this.config, {
				maxBufferSize: 36 << 20, // 36MB
				maxBufferLength: 6,
				maxMaxBufferLength: buffSize,
				backBufferLength: hlsCache ? Infinity : 9
			});
			return fn.apply(this, args);
		}; */
	},
	copyToClipboard(textToCopy) {
		// navigator clipboard 需要https等安全上下文
		if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(textToCopy);

		const textArea = document.createElement("textarea");
		textArea.value = textToCopy;
		textArea.style.position = "absolute";
		textArea.style.top = "-999999px";
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		return new Promise((res, rej) => {
			document.execCommand('copy') ? res() : rej();
			textArea.remove();
		});
	}
};