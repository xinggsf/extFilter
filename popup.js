const q = (css, p = document) => p.querySelector(css);
const evl = q('#mvList');
const cbCache = q('#cacheMV>input');

q('#power').addEventListener('click', ev => {
    chrome.runtime.sendMessage({id:'power'});
    window.close();
});
chrome.runtime.sendMessage({id:'getState'}, function(enabled) {
    q('#power>input').checked = enabled;
});

chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
	if (tabs[0].url.startsWith('http')) {
		// console.dir(tabs[0])
		const tabId = tabs[0].id;
		// host = tabs[0].url.match(/^https?:\/\/[^/]+/).slice(0);
		chrome.runtime.sendMessage({id:'getMVCount', tabId}, function(n) {
			if (!n) return;
			evl.href = './mvList.html';
			evl.textContent = '已捕获媒体数: '+ n;
		});
		chrome.runtime.sendMessage({id:'isCache', tabId}, function(enabled) {
			cbCache.checked = enabled;
		});
		cbCache.parentNode.addEventListener('click', ev => {
			chrome.runtime.sendMessage({id:'swapCache', tabId});
			cbCache.checked = !cbCache.checked;
		});
	}
	else cbCache.disabled = true;
});

q('#clearCache').addEventListener('click', ev => {
    chrome.browsingData.remove(
		{since:0}, // origins:host,
		{//appcache cookies downloads fileSystems formData history indexedDB localStorage passwords serviceWorkers webSQL
		  cache: true,
		  cacheStorage: true
		},
		alert.bind(null,'已成功删除缓存！')
	);
});