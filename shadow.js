let trigger,shelf;

function toggleShelf(e) {
	trigger ??= this ?? document.getElementById('trigger');
	shelf = document.getElementById('container');
	shelf.classList.toggle('out');
	trigger.innerHTML = shelf.classList.contains('out') ? 'show transform controls' : 'hide transform controls';
	window.top.console.log('toggleShelf()');
}


function intitialize() {
	trigger = document.getElementById('trigger');
	trigger.addEventListener( 'click', toggleShelf.bind(trigger) )
}

if ( document.readyState === 'complete' ) intitialize();
else document.addEventListener( 'readystatechange', e => { if ( document.readyState === 'complete' ) intitialize()})
