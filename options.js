import cfg from "./config.js";

const q = (css, p = document) => p.querySelector(css);
let ck;
const skBuf = q('#skBufSize');
const txtList = [...document.getElementsByTagName('textarea')];

(async function(){
	config2UI(await cfg.read());
})();

function importData() {
	if (input.value == '') return;
	input.files[0].text().then(txt => {
		const data = JSON.parse(txt);
	});
}

function exportData(obj) {
	//JSON.stringify 第三个参数是格式符或缩进量
	const blob = new Blob([JSON.stringify(obj, null, 2)], {type : 'application/json'});
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = 'metal-data.json';
	link.style.display = 'none';
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(link.href);
}

function save() {
	const items = { autoWebFull: q('#cbWebFull').checked };
	// -1:禁用  999：随机  0－n:数组某项
	if (!q('#useJX').checked) items.useJX = -1;
	else if (q('#cbRandom').checked) items.useJX = 999;
	else if (ck) items.useJX = ck.closest('tr').rowIndex -1;
	const a = [];
	for (const row of q('table').rows) a.push({
		name: row.cells[1].innerText,
		url: row.cells[2].innerText
	});
	a.shift();
	items.jxUrls = a;
	items.hlsCache = q('#hlsCache').checked;
	items.useShaka = q('#useShaka').checked;
	items.buffSize = +skBuf.value;

	items.domainWhiteList = txtList[0].value.split('\n');
	items.hostsDisableWF = txtList[1].value.split('\n');
	items.domainsCleanM3u = txtList[2].value.split('\n');
	items.hostsGM = txtList[3].value.split('\n');

	cfg.save(items).then(function() {
		confirm('已保存，须重新加载扩展才生效！是否刷新？') &&
		chrome.runtime.reload();
	});
}

function config2UI(items) {
	q(items.useShaka ? '#useShaka' : '#useHls').checked = true;
	q('#numBuf').value = skBuf.value = items.buffSize || 60;
	q('#hlsCache').checked = items.hlsCache;
	txtList[1].readOnly = !items.autoWebFull;
	q('#cbWebFull').checked = items.autoWebFull;
	q('#useJX').checked = items.useJX != -1;
	q('#cbRandom').checked = items.useJX == 999;
	txtList[0].value = items.domainWhiteList.join('\n');
	txtList[1].value = items.hostsDisableWF.join('\n');
	txtList[2].value = items.domainsCleanM3u.join('\n');
	txtList[3].value = items.hostsGM.join('\n');

	let cc = `<tr><th width="3%">...</th><th width="12%" align="middle">名称</th>
		<th width="85%" align="middle">URL</th></tr>`;
	for (const k of items.jxUrls) {
		cc += `<tr><td><input type="checkbox"></input></td><td>${k.name}</td><td>${k.url}</td></tr>`;
	}
	q('#tbJX').innerHTML = cc;
}

const validHost = ev => {
	const s = ev.target.value;
	if (!/^[a-z\d\n\.\-_]+$/.test(s)) alert('输入了无效字符！');
	ev.target.value = s.replace(/[^\S\n]/g,'').replace(/\n{2,}/g,'\n');
};

q('#tbJX').addEventListener('click', ev => {
	const row = ev.target.closest('tr');
	if (!row || !row.rowIndex) return;

	const e = q('input[type=checkbox]', row);
	e.checked = true;
	if (ck) ck.checked = false;
	ck = e;
});
q('#saveSettings').addEventListener('click', save);
q('#defaultCfg').addEventListener('click', ev => {
	config2UI(cfg.raw);
});

skBuf.addEventListener('input', ev => {
	q('#numBuf').value = skBuf.value;
});
q('#numBuf').addEventListener('change', ev => {
	skBuf.value = q('#numBuf').value;
});
q('#delRow').addEventListener('click', ev => {
	if (ck && ck.checked) q('#tableJX').deleteRow(ck.closest('tr').rowIndex);
});
q('#addRow').addEventListener('click', ev => {
	const eu = q('#txtURL');
	if (!eu.checkValidity()) return;
	const name = q('#txtTitle').value.trim();
	if (name) q('#tableJX').insertRow(-1)
		.innerHTML = `<td><input type="checkbox"></input></td><td>${name}</td><td>${eu.value}</td>`;
});

txtList.forEach(e => e.addEventListener('blur', validHost));
q('#cbWebFull').addEventListener('click', ev => {
	txtList[1].readOnly = !ev.target.checked;
});