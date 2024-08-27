const {q, vLib, toByteUnit, getFileName, log} = uu;
const playPage = chrome.runtime.getURL('play.html');
const vKind = { 1:'normal',2:'hls',4:'dash',8:'flv',16:'shaka' };
let tabId, mvList;
const check0ConvertKind = t => {
	if (!t) return '未知';
	if (typeof t == 'number') return vKind[t] || 'auto';
	if (t.startsWith('video')) return 'normal';
	return t;
};
const byteUnit = bytes => { // 数字转换为字节（单位）显示 Number.MAX_SAFE_INTEGER
	if (!bytes) return '未知';
	if (/\D$/.test(bytes)) return bytes;
	return toByteUnit(+bytes) + 'B';
};
const fillTable = a => {
	mvList = a;
	q('dl').innerHTML = a.reduce((affix, k, i, arr) => {
		let lastDD = '播放';
		const kind = check0ConvertKind(k.kind);
		if (kind.startsWith('audio/')) {
			const fn = getFileName(k.url).fname || 'music_xx' + i;
			lastDD = `<a href="${k.url}" download="${fn}">下载</a>`;
		}
		return `${affix}<dd class="idx">${i+1}</dd><dd>类型:${kind}</dd><dd>大小:${byteUnit(k.size)}</dd><dd index="${i}" class="last-col">${lastDD}</dd><dt>${k.url}</dt>`;
	}, '');
};

q('dl').addEventListener('click', ev => {
	const e = ev.target;
	if (e.tagName == 'A') return;
	if (e.tagName == 'DT') {
		navigator.clipboard.writeText(e.textContent);
	}
	else if (e.matches('.last-col')) {
		const i = e.getAttribute('index') | 0;
		let t = check0ConvertKind(mvList[i].kind);
		if (t.startsWith('audio')) return;
		if (!vLib[t]) t = 'auto';
		const url = `${playPage}?vType=${t}#${mvList[i].url}`;
		chrome.tabs.create({url});
	}
});
q('#clearList').addEventListener('click', ev => {
	q('.box').innerHTML = '';
	chrome.runtime.sendMessage({id:'clearMVList', tabId});
});
q('#copyList').addEventListener('click', ev => {
	const a = [...document.querySelectorAll('.box dt')];
	navigator.clipboard.writeText(a.map(k => k.textContent).join('\n'));
});

chrome.tabs.query({currentWindow:true,active:true}, function(tabs) {
	if (tabs[0].url.startsWith('http')) {
		tabId = tabs[0].id;
		chrome.runtime.sendMessage({id:'getMVList', tabId}, fillTable);
	}
});