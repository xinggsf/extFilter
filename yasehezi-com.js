(() => {
	let e = document.createElement('meta');
	e.setAttribute('name','referrer');
	e.setAttribute('content','no-referrer');
	document.head.appendChild(e);

	e = document.createElement('script');
	e.textContent = `setTimeout(x => {
		$('body').unbind('keydown');
	}, 990);`;
	document.body.appendChild(e);
})();