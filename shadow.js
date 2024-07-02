let trigger,shelf;

function toggleShelf(e) {
	shelf = document.getElementById('container');
	shelf.classList.toggle('out');
}


function intitialize() {
	trigger = document.getElementById('trigger');
	trigger.addEventListener( 'click', toggleShelf )
}

if ( document.readyState === 'complete' ) intitialize();
else document.addEventListener( 'readystatechange', e => { if ( document.readyState === 'complete' ) intitialize()})
