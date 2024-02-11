if (self != top) {
class Hooker {
	static _hookCall(cb) {
		const call = Function.prototype.call;
		Function.prototype.call = function(...args) {
			let ret = call.apply(this, args);
			try {
				if (args && cb(args)) {
					Function.prototype.call = call;
					cb = () => {};
				}
			} catch (err) {
				console.error(err.stack);
			}
			return ret;
		};
		this._hookCall = null;
	}

	static _isEsModule(obj) {
		return obj.__esModule;
	}

	static _isFuction(arg) {
		return 'function' === typeof arg;
	}

	static _isModuleCall(args) { // module.exports, module, module.exports, require
		return args.length === 4 && args[1] && Object.getPrototypeOf(args[1]) === Object.prototype && args[1].hasOwnProperty('exports');
	}

	static _hookModuleCall(cb, pred) {
		const callbacksMap = new Map([[pred, [cb]]]);
		this._hookCall((args) => {
			if (!this._isModuleCall(args)) return;
			const exports = args[1].exports;
			for (const [pred, callbacks] of callbacksMap) {
				if (!pred.apply(this, [exports])) continue;
				callbacks.forEach(cb => cb(exports, args));
				callbacksMap.delete(pred);
				!callbacksMap.size && (this._hookModuleCall = null);
				break;
			}
			return !callbacksMap.size;
		});

		this._hookModuleCall = (cb, pred) => {
			if (callbacksMap.has(pred)) {
				callbacksMap.get(pred).push(cb);
			} else {
				callbacksMap.set(pred, [cb]);
			}
		};
	}
}

const isHls_lib = (exports) => !exports.default && exports.buildAbsoluteURL
	&& exports.buildURLFromParts && exports.parseURL;

Hooker._hookModuleCall((exports, args) => {
	const p = exports.buildAbsoluteURL;
	exports.buildAbsoluteURL = function() {
		top.postMessage({
			id: 'metal-h5-get-frame',
			url: arguments[1],
			vType: 'hls'
		}, '*');
		chrome.runtime.sendMessage({id:'inject-lib',vType:'hls',url: arguments[1]});
		exports.buildAbsoluteURL = p;
		return p.apply(exports,arguments)
	}
}, isHls_lib);
}