const rawConfig = {
	"domainWhiteList": [
		".ixigua.com",".appinn.com","bimiacg4.net",".dj92cc.net",
		".gamersky.com","netflix.",".novipnoad.net",
		".olevod.com",".youzhidy.com",".zhihu.com",".zhlhh.com"
	],
	"useJX": 999,
	"jxUrls": [
		{"name":"盒子","url":"https://jx.jsonplayer.com/player/?url="},
		{"name":"88看","url":"https://vip.sp-flv.com:8443/?url="},
		{"name":"咸鱼","url":"https://jx.xyflv.com/?url="},
		{"name":"虾米","url":"https://jx.xmflv.com/?url="}
	],
	"useShaka": true,
	"buffSize": 80,
	"hlsCache": false,
	"autoWebFull": false,
	"hostsDisableWF": [".yatu.tv","weixin.qq.com"],
	"domainsCleanM3u": [".agedm.org",".yatu.tv",".xyhdmw.",".xyhdm.cc","yhdm002.com","yhdm95.com","yhdmw7.com",".mgtvys.",".ddzvod.com",".nnvod.com"],
	"hostsGM": [".douban.com","dandanzan.net","nunuyy5.com","nnyy.in",".btnull."]
};

function promisifyNoFail(thisArg, fnName, outFn = r => r) {
    const fn = thisArg[fnName];
    return function() {
        return new Promise(resolve => {
            fn.call(thisArg, ...arguments, function() {
                if ( chrome.runtime.lastError instanceof Object ) {
                    void chrome.runtime.lastError.message;
                }
                resolve(outFn(...arguments));
            });
        });
    };
}

function promisify(thisArg, fnName) {
    const fn = thisArg[fnName];
    return function() {
        return new Promise((resolve, reject) => {
            fn.call(thisArg, ...arguments, function() {
                const lastError = chrome.runtime.lastError;
                if ( lastError instanceof Object ) {
                    return reject(lastError.message);
                }
                resolve(...arguments);
            });
        });
    };
}

const cfg = {
	raw: rawConfig,
	save: promisify(chrome.storage.sync, 'set'),
	read: promisify(chrome.storage.sync, 'get'),
	async init() {
		const items = await this.read();
		if (items?.hostsGM) this.value = items;
		else {
			// 安装或更新后补齐缺省设置
			this.value = {...rawConfig, ...items};
			this.save(this.value);
		}
	}
};
if (chrome.webNavigation) {
	cfg.getFrame = promisify(chrome.webNavigation, 'getFrame');
	cfg.getAllFrames = promisify(chrome.webNavigation, 'getAllFrames');
}

export default cfg;