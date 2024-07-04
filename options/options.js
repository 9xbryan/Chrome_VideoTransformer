if ( `undefined` == typeof globalThis.browser ) globalThis.browser = chrome;
const STORAGE = browser.storage?.local;
// const STORAGE = chrome.storage.local;
var regStrip = /^[\r\t\f\v ]+|[\r\t\f\v ]+$/gm;
var regEndsWithFlags = /\/(?!.*(.).*\1)[gimsuy]*$/;


function resetStorageCache() {
	return {
		count: 0, initialized: false,
		settings: {
			autoTransformFitWhenPlay: false,
			autoTransformWhenPlay: 'fit',
			enabled: true, // default enabled
			displayKey: 'u', // default: u
			imageBoolean: false, // default: false
			startHidden: false, // default: false
			controllerOpacity: 0.3, // default: 0.3
			hideControlsWhenPaused: false,
			blacklist: `\
					www.instagram.com
					twitter.com
					vine.co
					imgur.com
					teams.microsoft.com
					`.replace( regStrip, "" ),
			keyBindings:
				[ {
					action: 'fixedEdge',
					keyCode: 68, //keyCode
					code: `KeyD`, //physical key, not referenced with mod keys
					key: `d`,
					value: 'right',
					force: false,
					predefined: true,
				}, {
					action: 'fixedEdge',
					keyCode: 65, //keyCode
					code: `KeyA`, //physical key, not referenced with mod keys
					key: `a`,
					value: 'left',
					force: false,
					predefined: true,
				}, {
					action: 'fixedEdge',
					keyCode: 81, //keyCode
					code: `KeyQ`, //physical key, not referenced with mod keys
					key: `q`,
					value: 'top',
					force: false,
					predefined: true,
				}, {
					action: 'fixedEdge',
					keyCode: 90, //keyCode
					code: `KeyZ`, //physical key, not referenced with mod keys
					key: `z`,
					value: 'bottom',
					force: false,
					predefined: true,
				}, {
					action: 'transform',
					keyCode: 27, //keyCode
					code: `Escape`, //physical key, not referenced with mod keys
					key: `Escape`,
					value: 'escape',
					force: false,
					predefined: true,
				}, {
					action: 'transform',
					keyCode: 71, //keyCode
					code: `KeyG`, //physical key, not referenced with mod keys
					key: `g`,
					value: 'fit',
					force: false,
					predefined: true,
				}, {
					action: 'transform',
					keyCode: 72, //keyCode
					code: `KeyH`, //physical key, not referenced with mod keys
					key: `h`,
					value: 'fill',
					force: false,
					predefined: true,
				}, {
					action: 'transform',
					keyCode: 83, //keyCode
					code: `KeyS`, //physical key, not referenced with mod keys
					key: `s`,
					value: 'stretch',
					force: false,
					predefined: true
				}, {
					action: 'flip',
					keyCode: 89, //keyCode
					code: `KeyY`, //physical key, not referenced with mod keys
					key: `y`,
					value: 'Y',
					force: false,
					predefined: true,
				}, {
					action: 'flip',
					keyCode: 88, //keyCode
					code: `KeyX`, //physical key, not referenced with mod keys
					key: `x`,
					value: 'X',
					force: false,
					predefined: true,
				}, {
					action: 'updateViewport',
					keyCode: 82, //keyCode
					code: `KeyR`, //physical key, not referenced with mod keys
					key: `r`,
					value: 'shrink',
					force: false,
					predefined: true,
				}, {
					action: 'updateViewport',
					keyCode: 69, //keyCode
					code: `KeyE`, //physical key, not referenced with mod keys
					key: `e`,
					value: 'expand',
					force: false,
					predefined: true,
				}, {
					action: "experiment",
					keyCode: 84, //keyCode
					code: `KeyT`, //physical key, not referenced with mod keys
					key: `t`,
					value: 'default',
					force: false,
					predefined: true,
				}, {
					action: "display",
					keyCode: 85,
					code: `KeyU`,
					key: 'u',
					value: 'controls',
					force: false,
					predefined: true,
				}, {
					action: "display",
					keyCode: 66,
					code: `KeyB`,
					key: 'b',
					value: 'trigger', //also show/hide trigger button + controls
					force: false,
					predefined: true,
				} ]
		}
	};
}

// Where we will expose all the data we retrieve from storage.sync.
let storageCache = resetStorageCache();
// Asynchronously retrieve data from storage.sync, then cache it.
async function initializeStorage() {

	const initStorageCache = STORAGE.get().then( data => {
		// delete data.initialized;
		// Copy the data retrieved from storage into storageCache.
		Object.assign( storageCache.settings, data );
		storageCache.initialized = true;
	} );

	try {
		await initStorageCache
	} catch ( e ) {
		//handle error here
	}

	if ( !storageCache.initialized ) {
		console.red( 'storageCache NOT initialized' );
		setTimeout( initializeStorage, 1000 );
	} else {
		storageCache.settings.enabled = true;
		// initializeWhenReady( document );
		initialize();
	}
}

const storageProxyHandler = {
	async set( target, property, value ) {
		console.redBg( `Property ${ property } changed to ${ value }` );
		target[ property ] = value;
		return STORAGE.set( { [ property ]: value } );
	},
}
const settings = new Proxy( storageCache.settings, storageProxyHandler );


var keyBindings = [];

var keyCodeAliases = {
	0: "null",
	null: "null",
	undefined: "null",
	32: "Space",
	37: "Left",
	38: "Up",
	39: "Right",
	40: "Down",
	96: "Num 0",
	97: "Num 1",
	98: "Num 2",
	99: "Num 3",
	100: "Num 4",
	101: "Num 5",
	102: "Num 6",
	103: "Num 7",
	104: "Num 8",
	105: "Num 9",
	106: "Num *",
	107: "Num +",
	109: "Num -",
	110: "Num .",
	111: "Num /",
	112: "F1",
	113: "F2",
	114: "F3",
	115: "F4",
	116: "F5",
	117: "F6",
	118: "F7",
	119: "F8",
	120: "F9",
	121: "F10",
	122: "F11",
	123: "F12",
	186: ";",
	188: "<",
	189: "-",
	187: "+",
	190: ">",
	191: "/",
	192: "~",
	219: "[",
	220: "\\",
	221: "]",
	222: "'"
};

function recordKeyPress( e ) {
	const { keyCode, key, code, target: trg } = e;
	if (
		( keyCode >= 48 && keyCode <= 57 ) || // Numbers 0-9
		( keyCode >= 65 && keyCode <= 90 ) || // Letters A-Z
		keyCodeAliases[ keyCode ] // Other character keys
	) {
		trg.value = key;// keyCodeAliases[ e.keyCode ] || String.fromCharCode( e.keyCode );
		trg.keyCode = keyCode;
		trg.key = key;
		trg.code = code;

		e.preventDefault();
		e.stopPropagation();
	} else if ( key === 'Backspace' || keyCode === 8 ) {// Clear input when backspace pressed
		e.target.value = "";
	} else if ( key === 'Escape' || keyCode === 27 ) {// When esc pressed, clear input
		trg.value = trg.key || '';
	}
}

function inputFilterNumbersOnly( e ) {
	var char = String.fromCharCode( e.keyCode );
	if ( !/[\d\.]$/.test( char ) || !/^\d+(\.\d*)?$/.test( e.target.value + char ) ) {
		e.preventDefault();
		e.stopPropagation();
	}
}

function inputFocus( e ) {
	e.target.value = "";
}

function inputBlur( e ) {
	e.target.value = keyCodeAliases[ e.target.keyCode ] || String.fromCharCode( e.target.keyCode );
}

function updateShortcutInputText( inputId, keyCode ) {
	document.getElementById( inputId ).value =
		keyCodeAliases[ keyCode ] || String.fromCharCode( keyCode );
	document.getElementById( inputId ).keyCode = keyCode;
}

function updateCustomShortcutInputText( inputItem, key ) {
	inputItem.value = key;// keyCodeAliases[ keyCode ] || String.fromCharCode( keyCode );
	// inputItem.keyCode = keyCode;
	inputItem.key = key;
}

// List of custom actions for which customValue should be disabled
// var customActionsNoValues = [ "pause", "muted", "mark", "jump", "display" ];

function add_shortcut() {
	var html = `<select class="customAction">
    <option value="slower">Decrease speed</option>
    <option value="faster">Increase speed</option>
    <option value="rewind">Rewind</option>
    <option value="advance">Advance</option>
    <option value="reset">Reset speed</option>
    <option value="fast">Preferred speed</option>
    <option value="muted">Mute</option>
    <option value="pause">Pause</option>
    <option value="mark">Set marker</option>
    <option value="jump">Jump to marker</option>
    <option value="display">Show/hide controller</option>
    </select>
    <input class="customKey" type="text" placeholder="press a key"/>
    <input class="customValue" type="text" placeholder="value (0.10)"/>
    <select class="customForce">
    <option value="false">Do not disable website key bindings</option>
    <option value="true">Disable website key bindings</option>
    </select>
    <button class="removeParent">X</button>`;
	var div = document.createElement( "div" );
	div.setAttribute( "class", "row customs" );
	div.innerHTML = html;
	var customs_element = document.getElementById( "customs" );
	customs_element.insertBefore(
		div,
		customs_element.children[ customs_element.childElementCount - 1 ]
	);
}

function createKeyBindings( item ) {
	const action = item.querySelector( ".customAction" ).value;
	const customKeyElement = item.querySelector( ".customKey" );
	const {keyCode, code, value:key} = customKeyElement;
	const value = item.querySelector( ".customValue" ).value;
	const force = item.querySelector( ".customForce" ).value;
	const predefined = !!item.id; //item.id ? true : false;

	keyBindings.push( {action,keyCode, code, key,value,force,predefined});
}

// Validates settings before saving
function validate() {
	var valid = true;
	var status = document.getElementById( "status" );
	var blacklist = document.getElementById( "blacklist" );

	blacklist.value.split( "\n" ).forEach( ( match ) => {
		match = match.replace( regStrip, "" );

		if ( match.startsWith( "/" ) ) {
			try {
				var parts = match.split( "/" );

				if ( parts.length < 3 )
					throw "invalid regex";

				var flags = parts.pop();
				var regex = parts.slice( 1 ).join( "/" );

				var regexp = new RegExp( regex, flags );
			} catch ( err ) {
				status.textContent =
					"Error: Invalid blacklist regex: \"" + match + "\". Unable to save. Try wrapping it in foward slashes.";
				valid = false;
				return;
			}
		}
	} );
	return valid;
}

// Saves options to chrome.storage
function save_options() {
	if ( validate() === false ) return;

	const blacklist = document.getElementById( "blacklist" );
	blacklist.value = blacklist.value.replace( regStrip, '' );
	[ 'enabled', 'imageBoolean', 'startHidden', 'controllerOpacity', 'hideControlsWhenPaused', 'blacklist' ].forEach( id => {
		let element = document.getElementById( id );
		console.log(id, element.checked, element.value);
		storageCache.settings[ id ] = element.value === 'on' ? element.checked : element.value;
	} );
	const autoTransform = document.getElementById( 'autoTransformWhenPlay' );
	storageCache.settings[ 'autoTransformWhenPlay' ] = autoTransform.checked ? document.getElementById( 'autoTransformWhenPlay_options').value : false;
	keyBindings = [];
	Array.from( document.querySelectorAll( ".customs" ) ).forEach( item => createKeyBindings( item ) );
	storageCache.settings.keyBindings = keyBindings;

	STORAGE.set( storageCache.settings, showStatus.bind('Saved options successfully'));
}

// update options from chrome.storage
async function update_options(data) {
	data ??= await STORAGE.get();
	[ 'enabled', 'imageBoolean', 'startHidden', 'controllerOpacity', 'hideControlsWhenPaused','blacklist' ].forEach( id => {
		if ( typeof data[ id ] === 'boolean' ) document.getElementById( id ).checked = data[ id ];
		else document.getElementById( id ).value = data[ id ];
	} );
	if ( data.autoTransformWhenPlay ) {
		document.getElementById( 'autoTransformWhenPlay' ).checked = true;
		const autoTransfrom_options = document.getElementById( 'autoTransformWhenPlay_options' );
		autoTransfrom_options.value = data.autoTransformWhenPlay;
		autoTransfrom_options.disabled = false;
	}

	let container, customKey, customValue, customForce;
	for ( const item of ( data.keyBindings || settings.keyBindings ) ) {
		// console.log(JSON.stringify(item, null, 4))
		const { action, keyCode, code, key, value, force, predefined } = item;
		if ( predefined ) {
			// console.log( action, key, value, force, predefined )
			const elementId = action + value?.charAt( 0 ).toUpperCase() + value?.slice( 1 ); //cap first letter of value;
			container = document.getElementById( elementId );
			if ( !container ) continue; //some options are not implemented in the options page yet
			customKey = container.querySelector( '.customKey' );
			if ( customKey ) {
				customKey.value = key;
				customKey.code = code;
				customKey.keyCode = keyCode;
				customValue = container.querySelector( `.customValue` );
				if ( customValue ) customValue.value = value;
				customForce = container.querySelector( `.customForce` );
				if ( customForce ) customForce.value = force;
			}
		} else {
			// new ones
			add_shortcut();
			const dom = document.querySelector( ".customs:last-of-type" );
			dom.querySelector( ".customAction" ).value = action;
			dom.querySelector( ".customKey" ).key = key;
			dom.querySelector( ".customValue" ).value = value;
			dom.querySelector( ".customForce" ).value = force;
		}
	}
}

function restore_defaults() {
	STORAGE.clear();
	storageCache = resetStorageCache();
	STORAGE.set(storageCache.settings, () => {
		update_options( storageCache.settings );
		document.querySelectorAll('.removeParent').forEach(button => button.click());
		// document.getElementById('status').textContent = 'Default options restored';
		showStatus( 'Default options restored' );
	})
}

function toggleExperimental() {
	const hidden = document.querySelector('.customForce').style.display === 'none';
	document.querySelectorAll('.customForce').forEach(element => element.style.display = hidden? 'inline-block':'none');
	showStatus( hidden ? 'showing experimental' : 'hiding experimental' );
	// document.getElementById( 'status' ).textContent = hidden? 'showing experimental' : 'hiding experimental';
}

function initialize() {

	update_options();

	const functionPairs = [
		// ['add',add_shortcut],
		['save', save_options],
		['restore', restore_defaults],
		['experimental', toggleExperimental],
		['clearStorage', e => STORAGE.clear()],
		// [ 'showStorage', async e => {
		// 	let data = await STORAGE.get();
		// 	document.getElementById( "blacklist" ).value = JSON.stringify( data, null, 4 );
		// } ],
		// [ 'saveStorage', e => STORAGE.set( storageCache.settings ) ]
	]
	functionPairs.forEach(([id,func]) => document.getElementById(id).addEventListener('click', func));

	[ 'keydown', 'keypress', 'focus', 'blur', 'click' ].forEach(e => document.addEventListener(e, eventHandler));

	showStatus( 'initialized' );
}

function showStatus(msg) {
	/**
	 * usage: // showStatus.bind( 'showing bound text' )( 'showing msg text' );
	 */
	if (showStatus.timer) clearTimeout(showStatus.timer);
	const status= document.getElementById( 'status' );
	status.textContent = ( this.constructor.name === 'String' ) ? this : msg;
	showStatus.timer = setTimeout( () => status.textContent = '', 60000 );
} showStatus.timer = null

function eventHandler(e) {
	const {type, target:trg} = e;
	switch (type) {
		case 'keydown': if ( trg.classList.contains( 'customKey' ) ) recordKeyPress( e ); break;
		case 'keypress': if ( trg.classList.contains( 'customValue' ) ) inputFilterNumbersOnly(e); break;
		case 'focus': if ( trg.classList.contains( 'customKey' ) ) inputFocus(e); break;
		case 'blur': if ( trg.classList.contains( 'customKey' ) ) inputBlur( e ); break;
		case 'click': if ( trg.classList.contains( 'removeParent' ) ) trg.parentNode.remove(); break;
	}
}

document.addEventListener( "DOMContentLoaded", initializeStorage );
