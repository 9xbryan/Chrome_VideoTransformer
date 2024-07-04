if ( `undefined` == typeof globalThis.browser ) globalThis.browser = chrome;
const STORAGE = browser.storage?.local;

function toggleEnabled( enabled, callback ) {
	if ( enabled === null ) {
		const enableButton = document.getElementById( 'enable' );
		enabled = enableButton.classList.contains( 'enabled' ) !== true;
	}

	// console.log('toggleEnabled');
	STORAGE?.set( {}, function () {
			toggleEnabledUI( enabled );
			if ( callback ) callback( enabled );
			console.log('sucessfully saved settings to browser.storage')
		}
	);
	if ( !STORAGE ) {
		toggleEnabledUI( enabled ); //for testing when STORAGE not available
		if ( callback ) callback( enabled );
		console.log( 'Sham: sucessfully saved settings to browser.storage' )
	}
}

function toggleEnabledUI( enabled ) {
	const enableButton = document.getElementById('enable');
	if (enabled === null) enabled = enableButton.classList.contains('enabled') !== true;
	[document.documentElement, enableButton].forEach(element => {
		enableButton.classList.toggle( "enabled", enabled );
		enableButton.classList.toggle( "disabled", !enabled ); //! 2nd parameter is Boolean: true:forceAdd::false:forceRemove
	});

	//change "theme" colors
	var root = document.querySelector( ':root' );

	root.style.setProperty( '--bg', _getColor( enabled? '--enabledBg' : '--disabledBg' ) );
	root.style.setProperty( '--color', _getColor( enabled ? '--enabledColor' : '--disabledColor' ) );


	// document.documentElement.classList.toggle


	( browser.browserAction || browser.action )?.setIcon( {
		path: {
			"19": `../icons/19${ enabled ? "" : "_disabled" }.png`,
			"38": `../icons/38${ enabled ? "" : "_disabled" }.png`,
			"48": `../icons/48${ enabled ? "" : "_disabled" }.png`
		}
	} );

	function _getColor(varName) {
		return getComputedStyle( root ).getPropertyValue( varName );
	}
}

function settingsSavedReloadMessage( enabled ) {
	setStatusMessage(`${ enabled ? "Enabled" : "Disabled" }. Reload page to see changes.` );
}

function setStatusMessage( str ) {
	const status_element = document.getElementById( "status" );
	// status_element.classList.toggle( "hide", false );
	status_element.textContent = str;
	// console.log(str)
}

function initialize() {
	STORAGE?.get( [ 'enabled' ], data => {
		toggleEnabledUI( data.enabled );
	} );
	document.getElementById('grid').addEventListener('click', e =>{
		e.preventDefault(); //not sure why this is required, otherwise the page will automatically reload everytime a button is clicked.
	});

	document.getElementById( 'settings' )?.addEventListener( "click", e => {
		window.open( browser.runtime?.getURL( "../options/options.html" ) || "../options/options.html" );
		console.log('settings clicked')
	} );

	document.getElementById( "about" ).addEventListener( "click", function () {
		window.open( "https://github.com/9xbryan/Chrome_VideoTransformer" );
	} );

	document.getElementById( "feedback" ).addEventListener( "click", function () {
		window.open( "https://github.com/9xbryan/Chrome_VideoTransformer/issues" );
	} );

	document.getElementById( 'reloadExtension' ).addEventListener( 'click', e => browser.runtime?.reload() );

	document.getElementById( "enable" ).addEventListener( "click", function () {
		toggleEnabled( null, settingsSavedReloadMessage );
	} );
}


document.addEventListener("DOMContentLoaded", initialize);
