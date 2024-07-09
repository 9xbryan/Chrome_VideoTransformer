
'use strict';
// if ( `undefined` == typeof globalThis.browser ) globalThis.browser = chrome;

function initialize( browser ) {

	const regStrip = /^[\r\t\f\v ]+|[\r\t\f\v ]+$/gm;
	const regEndsWithFlags = /\/(?!.*(.).*\1)[gimsuy]*$/;

	const STORAGE = browser.storage.local; //so that we can switch .local vs .sync easily, during development

	function resetStorageCache() {
		return {
			count: 0, initialized: false,
			settings: {
				restoreTransformWhenPlay: false,
				enabled: true, // default enabled
				imageBoolean: false, // default: false
				audioBoolean: false,
				startHidden: false, // default: false
				controllerOpacity: 0.3, // default: 0.3
				hideControlsWhenPaused: false,
				rememberSpeed: false,
				forceLastSavedSpeed:false,
				lastSpeed: 1.0,
				speeds: {},  // empty object to hold speed for each source
				blacklist: `\
					www.instagram.com
					twitter.com
					vine.co
					imgur.com
					teams.microsoft.com
					`.replace( regStrip, "" ),
				keyBindings:
					[
						{
							action: "setPicture",
							keyCode: 79,
							code: `KeyO`,
							key:`o`,
							value: 'togglePictureInPicture',
							force: false,
							predefined: true
						},
						{
							action: "setPlayback",
							keyCode: 75,
							code: `KeyK`,
							key: `k`,
							value: `toggle`, //doesn' matter
							force: false,
							predefined: true
						},
						{
							action: "setPlayPosition",
							keyCode: 76,
							code: `KeyL`,
							key: `l`,
							value: { type: 'relative', amplitude: +10 },
							force: false,
							predefined: true
						},
						{
							action: "setPlayPosition",
							keyCode: 74,
							code: `keyJ`,
							key: `j`,
							value: { type: 'relative', amplitude: -10 },
							force: false,
							predefined: true
						},
						{
							action: "setPlayRate",
							keyCode: 221,
							code: `BracketRight`,
							key: `]`,
							value: { type: 'relative', amplitude: +0.25 },
							force: false,
							predefined: true
						},
						{
							action: "setPlayRate",
							keyCode: 219, //keyCode
							code: `BracketLeft`, //physical key
							key: `[`,
							value: { type: 'relative', amplitude: -0.25 },
							force: false,
							predefined: true
						}, {
							action: "setPlayRate",
							keyCode: 80,
							code: `KeyP`,
							key: `p`,
							value: { type: 'absolute', amplitude: 1.0 },
							force: false,
							predefined: true
						}, {
							action: "setPlayRate",
							keyCode: 220,
							code: `Backslash`,
							key: `\\`,
							value: { type: 'absolute', amplitude: 1.75 },
							force: false,
							predefined: true
						},
						{
							action: 'transformPicture',
							keyCode: 68, //keyCode
							code: `KeyD`, //physical key, not referenced with mod keys
							key: `d`,
							value: { type: 'translate', direction: 'fixRightEdge' },
							force: false,
							predefined: true,
						}, {
							action: 'transformPicture',
							keyCode: 65, //keyCode
							code: `KeyA`, //physical key, not referenced with mod keys
							key: `a`,
							value: { type: 'translate', direction: 'fixLeftEdge' },
							force: false,
							predefined: true,
						}, {
							action: 'transformPicture',
							keyCode: 81, //keyCode
							code: `KeyQ`, //physical key, not referenced with mod keys
							key: `q`,
							value: { type: 'translate', direction: 'fixTopEdge' },
							force: false,
							predefined: true,
						}, {
							action: 'transformPicture',
							keyCode: 90, //keyCode
							code: `KeyZ`, //physical key, not referenced with mod keys
							key: `z`,
							value: { type: 'translate', direction: 'fixBottomEdge' },
							force: false,
							predefined: true,
						}, {
							action: 'transformPicture',
							keyCode: 27, //keyCode
							code: `Escape`, //physical key, not referenced with mod keys
							key: `Escape`,
							value: { type: 'escape' },
							force: false,
							predefined: true,
						}, {
							action: 'transformPicture',
							keyCode: 71, //keyCode
							code: `KeyG`, //physical key, not referenced with mod keys
							key: `g`,
							value: { type: 'scale', amplitude: 'fit' },
							force: false,
							predefined: true,
						}, {
							action: 'transformPicture',
							keyCode: 72, //keyCode
							code: `KeyH`, //physical key, not referenced with mod keys
							key: `h`,
							value: { type: 'scale', amplitude: 'fill' },
							force: false,
							predefined: true,
						}, {
							action: 'transformPicture',
							keyCode: 83, //keyCode
							code: `KeyS`, //physical key, not referenced with mod keys
							key: `s`,
							value: { type: 'scale', amplitude: 'stretch' },
							force: false,
							predefined: true
						}, {
							action: 'transformPicture',
							keyCode: 89, //keyCode
							code: `KeyY`, //physical key, not referenced with mod keys
							key: `y`,
							value: { type: 'flip', direction: 'Y'},
							force: false,
							predefined: true,
						}, {
							action: 'transformPicture',
							keyCode: 88, //keyCode
							code: `KeyX`, //physical key, not referenced with mod keys
							key: `x`,
							value: { type: 'flip', direction: 'X' },
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
							action: "reveal",
							keyCode: 85,
							code: `KeyU`,
							key: 'u',
							value: 'controls',
							force: false,
							predefined: true,
						}, {
							action: "reveal",
							keyCode: 86,
							code: `KeyV`,
							key: 'v',
							value: 'controlTrigger', //also show/hide trigger button + controls
							force: false,
							predefined: true,
						}, {
							action: "reveal",
							keyCode: 66,
							code: `KeyB`,
							key: 'b',
							value: 'nativeControls', //also show/hide trigger button + controls
							force: false,
							predefined: true,
						} ],
				defaultLogLevel: 4,
				logLevel: 3
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
			initializeWhenReady( document );
		}
	}

	initializeStorage(); //main initializer

	const storageProxyHandler = {
		async set( target, property, value ) {
			// console.redBg( `Property ${ property } changed to ${ value }` );
			if ( property === 'restoreTransformWhenPlay' && value.toString() === 'true' ) value = tc.states.transformed || 'fit';
			target[ property ] = value;
			return STORAGE.set( { [ property ]: value }, () => { console.redBg( `updated storage:`, `Property ${ property } changed to ${ value }` ) } );
		},
	}
	const settings = new Proxy( storageCache.settings, storageProxyHandler );

	// green: new initial values:
	/* Log levels (depends on caller specifying the correct level)
	  1 - none
	  2 - error
	  3 - warning
	  4 - info
	  5 - debug
	  6 - debug high verbosity + stack trace on each message
	*/
	function log( message, level ) {
		globalThis.verbosity = settings.logLevel;
		if ( typeof level === "undefined" ) {
			globalThis.level = settings.defaultLogLevel;
		}
		if ( verbosity >= level ) {
			if ( level === 2 ) {
				console.log( "ERROR:" + message );
			} else if ( level === 3 ) {
				console.log( "WARNING:" + message );
			} else if ( level === 4 ) {
				console.log( "INFO:" + message );
			} else if ( level === 5 ) {
				console.log( "DEBUG:" + message );
			} else if ( level === 6 ) {
				console.log( "DEBUG (VERBOSE):" + message );
				console.trace();
			}
		}
	}

	if ( !browser.storage.onChanged.hasListener( storageChangedHandler ) ) browser.storage.onChanged.addListener( storageChangedHandler );
	function storageChangedHandler( changes, namespace ) {
		for ( let [ key, { oldValue, newValue } ] of Object.entries( changes ) ) {
			console.green(
				`Storage key "${ key }" in namespace "${ namespace }" changed.`,
				`Old value was "${ oldValue }", new value is "${ newValue }".`
			);
			if ( storageCache.settings.hasOwnProperty( key ) && newValue.is( 'Boolean' ) ) {
				if ( key === 'restoreTransformWhenPlay' && newValue.toString() === 'true' ) newValue = tc.states.transformed || 'fit';
				storageCache.settings[ key ] = newValue;
				let shadowRootContainer = document.querySelector( `.transform-controller` );
				// let shadowRoot = shadowRootContainer.shadowRoot.querySelector(`form#container`);
				let keyedItem = shadowRootContainer?.shadowRoot.querySelector( `#` + key );
				if ( keyedItem ) {
					keyedItem.checked = newValue;
					console.greenBg( `updated UI for memory change;` )
				}
			} else {
				console.log( 'ERROR: something might be wrong' );
			}
			if ( key === 'hideControlsWhenPaused' ) hideControlsWhenPaused();
		}
	}
	const cachedMediaElements = [];



	function inIframe() {
		try {
			return window.self !== window.top;
		} catch ( e ) { return true; }
	}

	const tc = {

		states: { //session-based. doesn't need to be synced
			flipped: '',
			transformed: ''
		},
		/**
		 * some of these are currently not being used right now.
		 */

		shadowRootHosts: [],
		transformed: {
			states: {},
			videoContainer: null,
			video: null,
			scaleX: null,
			scaleY: null,
			translateX: null,
			translateY: null,
			style: {
				left: null,
				top: null,
				width: null,
				height: null,
				transform: null
			}
		},
		untransformed: {
			style: {
				left: null,
				top: null,
				width: null,
				height: null,
				transform: null
			}
		},
		transform: {},
		eventTracker: {
			mousedown: false,
			resizing: false,
			mouseup: false,
		}
	};
	function videoListeners( e ) {
		const { type, target: video } = e;
		if ( !video || video.nodeName !== 'VIDEO' ) return;
		let controller;
		let classesToRemove = [ 'playing', 'paused', 'waiting', 'ended', 'emptied', 'suspend', 'stalled', 'loadedmetadata', 'loadeddata', 'canplay' ];
		video.classList.remove( ...classesToRemove );
		switch ( type ) {
			case 'play':
			case 'playing':
				if ( !video.transform ) video.transform = new tc.transformController( video );
				else {
					controller = video.transform.div;
					if ( controller.classList.contains( "transform-nosource" ) ) controller.classList.remove( "transform-nosource" );
				}
				Array.from( video.ownerDocument.querySelectorAll( `.hideControlsWhenPaused` ) ).forEach( element => element.classList.remove( 'hideControlsWhenPaused' ) )
				updateControllerCoordinatesWhenUntransformed( video );
				video.classList.add( 'playing' );
				if ( settings.restoreTransformWhenPlay ) restoreTransformedPlayer( video );//transformPlayer( video, tc.states.transformed || 'fit' );
				break;
			case 'pause':
				updateControllerCoordinatesWhenUntransformed( video );
				video.classList.add( 'paused' );
				hideControlsWhenPaused( video );
				break;
			case 'ended':
				video.classList.add( 'paused' );
				untransformPlayer( video ); break;
			default:
				video.classList.add( type ); break;
		}
	}
	function hideControlsWhenPaused( video ) {
		// console.log('hideControlsWhenPaused(video)')
		const doc = video ? video.ownerDocument : document;
		// const layer = parseInt(element.dataset.layer);
		if ( settings.hideControlsWhenPaused ) {
			Array.from( doc.querySelectorAll( `ytd-player#ytd-player *[data-layer]` ) ).forEach( element => {
				if ( parseInt( element.dataset.layer ) > 0 ) element.classList.add( 'hideControlsWhenPaused' );
			} );
		} else {
			Array.from( doc.querySelectorAll( `.hideControlsWhenPaused` ) ).forEach( element => {
				if ( parseInt( element.dataset.layer ) > 0 ) element.classList.remove( 'hideControlsWhenPaused' );
			} );
		}
	}
	function defineVideoController() {
		// console.log('defineVideoController')
		// Data structures
		// ---------------
		// transformController (JS object) instances:
		//   video = IMG/VIDEO DOM element
		//   parent = A/V DOM element's parentElement OR
		//            (A/V elements discovered from the Mutation Observer)
		//            A/V element's parentNode OR the node whose children changed.
		//   div = transformController's DOM element (which happens to be a DIV)
		//   speedIndicator = DOM element in the transformController of the speed indicator
		// added to IMG / VIDEO DOM elements
		//    vsc = reference to the transformController
		tc.transformController = function ( target, parent ) {
			if ( target.transform ) return target.transform;
			cachedMediaElements.push( target );
			this.media = target;
			this.video = target;
			this.parent = target.parentElement || parent;
			let storedSpeed = settings.speeds[ target.currentSrc ];
			if ( !settings.rememberSpeed ) {
				if ( !storedSpeed ) storedSpeed = 1.0;
				// setKeyBindings( "reset", getKeyBindings( "fast" ) ); //!! resetSpeed = fastSpeed
			} else {
				log( "Recalling stored speed due to rememberSpeed being enabled", 5 );
				storedSpeed = settings.lastSpeed;
			}
			log( "Explicitly setting playbackRate to: " + storedSpeed, 5 );
			target.playbackRate = storedSpeed;
			this.div = this.initializeControls();

			var mediaEventAction = function ( event ) {
				let storedSpeed = settings.speeds[ event.target.currentSrc ];
				if ( !settings.rememberSpeed ) {
					if ( !storedSpeed ) {
						log( "Overwriting stored speed to 1.0 (rememberSpeed not enabled)", 4 );
						storedSpeed = 1.0;
					}
					// resetSpeed isn't really a reset, it's a toggle
					log( "Setting reset keybinding to fast", 5 );
					//setKeyBindings( "reset", getKeyBindings( "fast" ) ); // resetSpeed = fastSpeed
				} else {
					log(
						"Storing lastSpeed into settings.speeds (rememberSpeed enabled)",
						5
					);
					storedSpeed = settings.lastSpeed;
				}
				// TODO: Check if explicitly setting the playback rate to 1.0 is
				// necessary when rememberSpeed is disabled (this may accidentally
				// override a website's intentional initial speed setting interfering
				// with the site's default behavior)
				log( "Explicitly setting playbackRate to: " + storedSpeed, 4 );
				// setSpeed( event.target, storedSpeed );
			};

			[ 'play', 'playing', 'pause', 'waiting', 'ended', 'emptied', 'suspend', 'stalled', 'loadedmetadata', 'loadeddata', 'canplay' ].forEach( eventType => target.addEventListener( eventType, videoListeners ) );


			target.addEventListener( "play", ( this.handlePlay = mediaEventAction.bind( this ) ) );
			target.addEventListener( "seeked", ( this.handleSeek = mediaEventAction.bind( this ) ) );

			var observer = new MutationObserver( mutations => {
				mutations.forEach( mutation => {
					if ( mutation.type === "attributes" && ( mutation.attributeName === "src" || mutation.attributeName === "currentSrc" ) ) {
						log( "mutation of A/V element", 5 );
						var transformController = this.div;
						if ( !mutation.target.src && !mutation.target.currentSrc ) transformController.classList.add( "transform-nosource" );//didne't work all the time.
						else transformController.classList.remove( "transform-nosource" );
					}
				} );
			} );
			observer.observe( target, { attributeFilter: [ "src", "currentSrc" ] } );
		};

		tc.transformController.prototype.remove = function () {
			this?.div.remove();
			this.video.removeEventListener( "play", this.handlePlay );
			this.video.removeEventListener( "seek", this.handleSeek );
			delete this.video.transform;
			const idx = cachedMediaElements.indexOf( this.video );
			if ( idx != -1 ) cachedMediaElements.splice( idx, 1 );
		};
		tc.transformController.prototype.initializeControls = function () {
			log( "initializeControls Begin", 5 );
			const doc = this.video.ownerDocument;
			const speed = this.video.playbackRate.toFixed( 2 );

			const videoBoundingRect = this.video.getBoundingClientRect();
			// getBoundingClientRect is relative to the viewport; style coordinates
			// are relative to offsetParent, so we adjust for that here. offsetParent
			// can be null if the video has `display: none` or is not yet in the DOM.
			const offsetParentRect = this.video.offsetParent?.getBoundingClientRect();
			const top = Math.max( videoBoundingRect.top - ( offsetParentRect?.top || 0 ), 0 );
			const height = Math.max( videoBoundingRect.height, offsetParentRect?.height || 0 );
			const left = Math.max( videoBoundingRect.left - ( offsetParentRect?.left || 0 ), 0 );
			const width = Math.max( videoBoundingRect.width, offsetParentRect?.width || 0 );

			log( "Speed variable set to: " + speed, 5 );

			const wrapper = doc.createElement( "div" );
			wrapper.dataset.layer = 1;
			wrapper.classList.add( "transform-controller" );

			if ( !this.video.currentSrc ) wrapper.classList.add( "transform-nosource" );
			if ( settings.startHidden ) wrapper.classList.add( "transform-hidden" );

			const shadow = wrapper.attachShadow( { mode: "open" } );
			const keyBindingsMap = {}
			settings.keyBindings.forEach( entry => keyBindingsMap[ entry.action + '_' + entry.value ] = entry.key );
			const shadowTemplate = `
					<style>
					@import "${ browser.runtime.getURL( "shadow.css" ) }";
					</style>
					<div id="controller" style="top:${ top }; left:${ left }; opacity:${ settings.controllerOpacity
				}">
          <span data-action="drag" class="draggable">${ speed }</span>
         <!-- <span id="controls">
            <button data-action="rewind" class="rw">«</button>
            <button data-action="slower">&minus;</button>
            <button data-action="faster">&plus;</button>
            <button data-action="advance" class="rw">»</button>
            <button data-action="display" class="hideButton">&times;</button>
          </span>
        </div> -->
					<form id="container" data-action="drag" class="shelf out" style="top: ${ parseInt( height / 2 ) }px; left: ${ parseInt( width / 2 ) }px; transform:translate(-50%,-50%)">
							<button data-action='transform' data-value="fit" style="grid-area: fit">fit<br>( ${ keyBindingsMap[ 'transform_fit' ] } )</button>
							<button data-action='transform' data-value="fill" style="grid-area: fill">fill<br>( ${ keyBindingsMap[ 'transform_fill' ] } )</button>
							<button data-action='transform' data-value="stretch" style="grid-area: stretch">stretch<br>( ${ keyBindingsMap[ 'transform_stretch' ] } )</button>
							<button data-action='flip' data-value="X" style="grid-area: flipX">flip X<br>( ${ keyBindingsMap[ 'flip_X' ] } )</button>
							<button data-action='flip' data-value="Y" style="grid-area: flipY">flip Y<br>( ${ keyBindingsMap[ 'flip_Y' ] } )</button>
							<button data-action='updateViewport' data-value="shrink" style="grid-area: shrinkVP">shrink<br>Win ( ${ keyBindingsMap[ 'updateViewport_shrink' ] } )</button>
							<button data-action='updateViewport' data-value="expand" style="grid-area: expandVP">expand<br>Win ( ${ keyBindingsMap[ 'updateViewport_expand' ] } )</button>
						<div class="button" style="grid-area: hideOnPause; width:85%; height:90%">
							<input type="checkbox" id="hideControlsWhenPaused" ${ settings.hideControlsWhenPaused ? 'checked' : '' }>
							<label for="hideControlsWhenPaused">hide controls<br>when paused</label>
						</div>
							<button data-action='transform' data-value="escape" style="grid-area: escape">Escape<br>( ${ keyBindingsMap[ 'transform_escape' ] } )</button>
							<button data-action="experiment" data-value="default" style="grid-area: experiment">experiment<br>PopOut Tab</button>
							<button data-action="experiment" data-value="2" style="grid-area: experiment2">experiment 2<br>clear Storage</button>
							<button data-action="experiment" data-value="3" style="grid-area: experiment3">experiment 3<br>save Storage</button>
							<button data-action="experiment" data-value="4" style="grid-area: experiment4">experiment 4<br>get Storage<button>
							<button data-action="experiment" data-value="5" style="grid-area: experiment5">experiment 5<br>display storageCache</button>
							<button data-action="experiment" data-value="6" style="grid-area: experiment6">experiment 6<br>reset storageCache</button>
							<button data-action="experiment" data-value="7" style="grid-area: experiment7">experiment 7<br>( ${ keyBindingsMap[ 'experiment_7' ] } )</button>
							<button data-action="experiment" data-value="8" style="grid-area: experiment8">experiment 8<br>( ${ keyBindingsMap[ 'experiment_8' ] } )</button>
							<button data-action="experiment" data-value="9" style="grid-area: experiment9">experiment 9<br>( ${ keyBindingsMap[ 'experiment_9' ] } )</button>
							<button data-action="experiment" data-value="10" style="grid-area: experiment10">experiment 10<br>( ${ keyBindingsMap[ 'experiment_10' ] } )</button>
						<div class="button" style="grid-area: autoTransformFit; width:85%; height:90%">
							<input type="checkbox" id="restoreTransformWhenPlay" ${ settings.restoreTransformWhenPlay ? 'checked' : '' }>
							<label for="restoreTransformWhenPlay">auto Transform<br>on play</label>
						</div>
					</form>
					<button id="trigger">trigger</button>
					`;


			shadow.innerHTML = shadowTemplate.replace( /\s{2,}/g, ' ' );


			shadow.addEventListener( 'click', shadowClickHandler );
			shadow.addEventListener( 'input', shadowInputHandler );

			// shadow.querySelector( ".draggable" ).addEventListener( "mousedown", e => {
			// 	// runAction(e.target.dataset["action"], false, e);
			// 	run( e.target.dataset[ "action" ], false, e );
			// 	e.stopPropagation(); e.preventDefault()
			// }, true );
			// shadow.querySelectorAll( "button" ).forEach( button => {
			// 	button.addEventListener( "click", e => {
			// 		// run( e.target.dataset[ "action" ], getKeyBindings( e.target.dataset[ "action" ] ), e );
			// 		e.preventDefault()
			// 		e.stopPropagation();
			// 	}, true );
			// } );

			// shadow.querySelector( "#controller" ).addEventListener( "click", ( e ) => e.stopPropagation(), false );
			// shadow.querySelector( "#controller" ).addEventListener( "mousedown", ( e ) => e.stopPropagation(), false );


			this.speedIndicator = shadow.querySelector( "span" );


			var fragment = document.createDocumentFragment();
			fragment.appendChild( wrapper );
			switch ( true ) {
				case location.hostname == "www.amazon.com":
				case location.hostname == "www.reddit.com":
					// insert before parent to bypass overlay
					this.parent.parentElement.insertBefore( fragment, this.parent );
					// this.parent.before( fragment ); //this should be the same as above: this.parent.parentElement.insertBefore( fragment, this.parent );
					//    this.parent.parentElement.appendChild( fragment ); //this should be the same as above: this.parent.parentElement.insertBefore( fragment, this.parent );
					break;
				case location.hostname == "www.facebook.com":
					// this is a monstrosity but new FB design does not have *any*
					// semantic handles for us to traverse the tree, and deep nesting
					// that we need to bubble up from to get transformController to stack correctly
					let p = this.parent.parentElement.parentElement.parentElement
						.parentElement.parentElement.parentElement.parentElement;
					p.insertBefore( fragment, p.firstChild );
					break;
				case location.hostname == "tv.apple.com":
					// insert before parent to bypass overlay
					this.parent.parentNode.appendChild( fragment ); //this should be the same as above: this.parent.parentNode.insertBefore( fragment, this.parent.parentNode.firstChild );
					break;
				default:
					// Note: when triggered via a MutationRecord, it's possible that the
					// target is not the immediate parent. This appends the transformController as
					// the first element of the target, which may not be the parent.
					// this.parent.insertBefore( fragment, this.parent.firstChild );
					this.parent.appendChild( fragment ); //this should be the same as above: this.parent.insertBefore( fragment, this.parent.firstChild );
			}
			initializeShadow( shadow );
			return wrapper;
		};
	}
	function initializeShadow( shadow ) {
		let trigger = shadow.querySelector( '#trigger' );
		trigger.addEventListener( 'click', toggleShelf );
		function toggleShelf( e ) {
			let shelf = shadow.querySelector( 'form#container' );
			shelf.classList.toggle( 'out' );
		}
	}
	async function shadowInputHandler( e ) {
		const trg = e.target;
		const { id, type } = trg;
		if ( id && type ) {
			e.stopPropagation(); e.preventDefault(); e.stopImmediatePropagation();
		}
		if ( type === 'checkbox' ) {
			settings[ id ] = trg.checked;
			STORAGE.set( { [ id ]: trg.checked } ); //green:this works!!
		}
	}
	function shadowClickHandler( e ) {
		const trg = e.target;
		if ( 'BUTTON'.includes( trg.nodeName ) ) {
			e.stopPropagation(); e.preventDefault(); e.stopImmediatePropagation();
		}
		switch ( trg.nodeName ) {
			case 'BUTTON': triggerHandler.bind( trg )( e ); break;
			case 'DIV':
				if ( trg.classList.contains( 'button' ) ) {
					let input = trg.querySelector( 'input[type="checkbox"]' );
					input.checked = input.checked != true;
					e.preventDefault();
				} else if ( trg.id === 'container' ) {
					e.preventDefault();
				} break;
		}
	}
	function triggerHandler( e ) {
		const trg = this ?? e.target;
		if ( trg.id === 'trigger' ) {
			let shelf = trg.ownerDocument.getElementById( 'container' );
			shelf.classList.toggle( 'out' );
			// trg.ownerDocument.getElementById( 'container' )?.classList.toggle( 'out' );
			trg.textContent = shelf.classList.contains( 'out' ) ? 'show' : 'hide';
			return;

			// return shelf.classList.toggle( 'out' );
		}
		const { action, value } = trg.dataset;
		run( action, value, e );
	}
	function isBlacklisted() {
		let blacklisted = false;
		settings.blacklist.split( "\n" ).forEach( ( match ) => {
			match = match.replace( regStrip, "" );
			if ( match.length == 0 ) return;
			if ( match.startsWith( "/" ) ) {
				try {
					var parts = match.split( "/" );
					if ( regEndsWithFlags.test( match ) ) {
						var flags = parts.pop();
						var regex = parts.slice( 1 ).join( "/" );
					} else {
						var flags = "";
						var regex = match;
					}
					var regexp = new RegExp( regex, flags );
				} catch ( err ) {
					return;
				}
			} else {
				var regexp = new RegExp( escapeStringRegExp( match ) );
			}

			if ( regexp.test( location.href ) ) {
				blacklisted = true;
				return;
			}
		} );
		return blacklisted;
		function escapeStringRegExp( str ) {
			// matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
			// return str.replace( matchOperatorsRe, "\\$&" );
			var escapeChar_original = /[|\\{}()[\]^$+*?.]/g;
			var escapeChar = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;
			return str.replace( escapeChar, "\\$&" );
		}
	}
	function refreshCoolDown( time ) {
		if ( refreshCoolDown.timer ) clearTimeout( refreshCoolDown.timer );
		refreshCoolDown.timer = setTimeout( () => { refreshCoolDown.timer = false }, time || 1000 );
	} refreshCoolDown.timer = false;
	function setupListeners( e ) {
		/**
		 * This function is run whenever a video speed rate change occurs.
		 * It is used to update the speed that shows up in the display as well as save1
		 * that latest speed into the local storage.
		 * @param {*} video The video element to update the speed indicators for.
		 */

		function updateSpeedFromEvent( video ) {
			// It's possible to get a rate change on a VIDEO/AUDIO that doesn't have
			// a video controller attached to it.  If we do, ignore it.
			if ( !video.vsc )
				return;
			var speedIndicator = video.vsc.speedIndicator;
			var src = video.currentSrc;
			var speed = Number( video.playbackRate.toFixed( 2 ) );

			log( "Playback rate changed to " + speed, 4 );

			log( "Updating controller with new speed", 5 );
			speedIndicator.textContent = speed.toFixed( 2 );
			settings.speeds[ src ] = speed;
			log( "Storing lastSpeed in settings for the rememberSpeed feature", 5 );
			settings.lastSpeed = speed;
			log( "Syncing chrome settings for lastSpeed", 5 );
			browser.storage.sync.set( { lastSpeed: speed }, function () {
				log( "Speed setting saved: " + speed, 5 );
			} );
			// show the controller for 1000ms if it's hidden.
			// runAction( "blink", null, null );
		}

		window.addEventListener( `visibilitychange`, visibilityHandler );

		document.addEventListener( "ratechange", function ( event ) {
			if ( refreshCoolDown.timer ) {
				log( "Speed event propagation blocked", 4 );
				event.stopImmediatePropagation();
			}
			var video = event.target;

			/**
			 * If the last speed is forced, only update the speed based on events created by
			 * video speed instead of all video speed change events.
			 */
			if ( settings.forceLastSavedSpeed ) {
				if ( event.detail && event.detail.origin === "videoSpeed" ) {
					video.playbackRate = event.detail.speed;
					updateSpeedFromEvent( video );
				} else {
					video.playbackRate = settings.lastSpeed;
				}
				event.stopImmediatePropagation();
			} else {
				updateSpeedFromEvent( video );
			}
		},
			true
		);

		// window.addEventListener( 'transitionend', transitionendHandler );
		window.addEventListener( 'fullscreenchange', fullscreenchangeHandler );

		const resizeObserver = new ResizeObserver( resizeObserverHandler );
		resizeObserver.observe( document.documentElement );
	}
	async function resizeObserverHandler( entries ) {
		/**
		 * this new API is more efficient than the 'resize' event;
		 */
		for ( const entry of entries ) {
			// Do something with the entry
			let { width, left } = entry.contentRect;
			// console.green( `bodyWidth: ${ width }px` );
			tc.eventTracker.resizing = true;
			restoreTransformedPlayer( entry.target?.querySelector( `ytd-player video` ) );
			if ( resizeObserverHandler.readyToExecute ) {
				resizeObserverHandler.readyToExecute = false;
				// console.greenBg( `bodyWidth: ${ width }px` );
				if ( resizeObserverHandler.coolTimer ) clearTimeout( resizeObserverHandler.coolTimer )
				resizeObserverHandler.coolTimer = setTimeout( () => resizeObserverHandler.readyToExecute = true, 1500 );
			}

		}

		return true;
	} resizeObserverHandler.readyToExecute = true;
	async function loadHandler( e ) {
		document.documentElement.classList.add( `transformLoaded` );
		// await browser.runtime.sendMessage( { action: 'popout', data: true }, checkError );
	}
	function transitionendHandler( e ) {
		if ( e.target?.nodeName !== 'VIDEO' || !transitionendHandler.readyToExecute ) return false;
		transitionendHandler.readyToExecute = false;
		restoreTransformedPlayer( e.target );
		if ( transitionendHandler.coolTimer ) clearTimeout( transitionendHandler.coolTimer )
		transitionendHandler.coolTimer = setTimeout( () => transitionendHandler.readyToExecute = true, 500 );
		return true;
	} transitionendHandler.readyToExecute = true;
	async function mouseHandler( e ) {
		const { type } = e;
		console.purple( type );
		switch ( type ) {
			case 'mouseup':
				if ( tc.eventTracker.resizing ) {
					tc.eventTracker.resizing = false;
					let trg = e.target.querySelector( `ytd-player video` );
					await updateControllerCoordinatesWhenUntransformed( trg );
					restoreTransformedPlayer( trg );
					return trg;
				}
				break;
			case 'mousedown':
		}
	}
	async function windowResizeHandler( e ) {
		tc.eventTracker.resizing = true;
		console.violetBg( `Window innerWidth: ${ window.innerWidth }px` );
		// let trg = e.target.document.querySelector( `ytd-player video` );
		// let video = await updateControllerCoordinatesWhenUntransformed( trg );
		// return video;
	}
	function messageHandler( e ) { }



	function initializeWhenReady( document ) {
		log( "Begin initializeWhenReady", 5 );
		if ( isBlacklisted() ) return;
		window.onload = () => {
			initializeNow( window.document );
		};
		if ( !document ) return;
		if ( document.readyState === "complete" ) initializeNow( document );
		else document.addEventListener( 'readystatechange', e => { if ( document.readyState === "complete" ) initializeNow( document ); } );
		log( "End initializeWhenReady", 5 );
	}



	function initializeNow( document ) {
		log( "Begin initializeNow", 5 );
		if ( !settings.enabled ) return;
		settings.enabled = false;
		// enforce init-once due to redundant callers
		if ( !document.body || document.body.classList.contains( "transform-initialized" ) ) return;
		try {
			setupListeners();
		} catch ( e ) { /*no operation*/ }
		document.body.classList.add( "transform-initialized" );

		log( "initializeNow: vsc-initialized added to document body", 5 );

		if ( document === window.document ) defineVideoController();
		else {
			var link = document.createElement( "link" );
			link.href = browser.runtime.getURL( "transformer.css" );
			link.type = "text/css";
			link.rel = "stylesheet";
			document.head.appendChild( link );
		}
		var docs = Array( document );
		try {
			if ( inIframe() ) {
				docs.push( window.top.document );
				document.body?.classList.add( 'transform-note-iframe' );
			}
		} catch ( e ) {/*no operation*/ }

		docs.forEach( doc => doc.addEventListener( "keydown", keydownHandler, true ) );

		function checkForVideo( node, parent, added ) {
			// Only proceed with supposed removal if node is missing from DOM
			if ( !added && document.body?.contains( node ) ) return;
			if ( node.nodeName === "VIDEO" ||
				( node.nodeName === "IMG" && settings.imageBoolean ) ||
				( node.nodeName === "AUDIO" && settings.audioBoolean ) ) {
				if ( added ) node.transform = new tc.transformController( node, parent );
				else if ( node.transform ) node.transform.remove();
			} else if ( node.children != undefined ) {
				for ( var i = 0; i < node.children.length; i++ ) {
					const child = node.children[ i ];
					checkForVideo( child, child.parentNode || parent, added );
				}
			}
		}


		var observer = new MutationObserver( function ( mutations ) {
			// Process the DOM nodes lazily
			requestIdleCallback(
				( _ ) => {
					mutations.forEach( function ( mutation ) {
						switch ( mutation.type ) {
							case "childList":
								mutation.addedNodes.forEach( function ( node ) {
									if ( typeof node === "function" ) return;
									if ( node === document.documentElement ) {
										// This happens on sites that use document.write, e.g. watch.sling.com
										// When the document gets replaced, we lose all event handlers, so we need to reinitialize
										log( "Document was replaced, reinitializing", 5 );
										initializeWhenReady( document );
										return;
									}
									checkForVideo( node, node.parentNode || mutation.target, true );
								} );
								mutation.removedNodes.forEach( function ( node ) {
									if ( typeof node === "function" ) return;
									checkForVideo( node, node.parentNode || mutation.target, false );
								} );
								break;
							case "attributes":
								if (
									( mutation.target.attributes[ "aria-hidden" ] &&
										mutation.target.attributes[ "aria-hidden" ].value == "false" )
									|| mutation.target.nodeName === 'APPLE-TV-PLUS-PLAYER'
								) {
									var flattenedNodes = getShadow( document.body );
									var nodes = flattenedNodes.filter(
										( x ) => x.nodeName == "VIDEO"
									);
									for ( let node of nodes ) {
										// only add vsc the first time for the apple-tv case (the attribute change is triggered every time you click the vsc)
										if ( node.transform && mutation.target.nodeName === 'APPLE-TV-PLUS-PLAYER' )
											continue;
										if ( node.transform )
											node.transform.remove();
										checkForVideo( node, node.parentNode || mutation.target, true );
									}
								}
								break;
						}
					} );
				},
				{ timeout: 1000 }
			);
		} );
		observer.observe( document, {
			attributeFilter: [ "aria-hidden", "data-focus-method" ],
			childList: true,
			subtree: true
		} );


		var mediaTags = document.querySelectorAll( settings.imageBoolean ? "video,img" : "video" );
		mediaTags.forEach( video => video.transform = new tc.transformController( video ) );
		var frameTags = document.getElementsByTagName( "iframe" );
		var childDocument;
		for ( const frame of frameTags ) {
			try {
				childDocument = frame.contentDocument;
			} catch ( e ) { continue }
			initializeWhenReady( childDocument );
		}
		settings.enabled = false; //will this stop the code from loading in iframes??
	}
	function keydownHandler( e ) {
		var { key, code, keyCode, target, type } = e;
		if ( type !== 'keydown' ) return;
		// console.pinkBg( key );
		if ( !e.getModifierState ||// Ignore if following modifier is active.
			e.getModifierState( "Alt" ) ||
			e.getModifierState( "Control" ) ||
			e.getModifierState( "Fn" ) ||
			e.getModifierState( "Meta" ) ||
			e.getModifierState( "Hyper" ) ||
			e.getModifierState( "OS" )
		) return;
		// Ignore keydown event if typing in an input box
		if ( target.isContentEditable || "INPUT TEXTAREA".includes( target.nodeName ) ) return false;
		// Ignore keydown event if typing in a page without vsc
		if ( !cachedMediaElements.length ) return false;
		const boundAction = settings.keyBindings.find( i => i.key === key );
		if ( key === 'Escape' ) console.redBg( ( boundAction || settings.keyBindings ).stringify( 4 ) )
		if ( !boundAction ) return false;
		const { action, value, force } = boundAction;
		if ( force === "true" ) {// disable websites key bindings
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
		}
		// console.pink( `run("${ action }", "${ value }")` );
		run( action, value );
		return false;
	}
	function restoreTransformedPlayer( video ) {
		video ??= document.querySelector( `ytd-player video` );
		if ( !tc.states.transformed && !tc.states.flipped ) untransformPlayer( video );
		else {
			transformPlayer( video, tc.states.transformed );
		}

	}
	function fixedEdge( video, edge ) {
		console.redBg( `fixedEdge(${ edge })` );
		return;
	}
	function fullscreenchangeHandler( e ) {
		document.fullscreenElement ? untransformPlayer() : restoreTransformedPlayer( e );
	}
	function toggleTransformPlayer_old( video, mode, flip ) {
		console.violet( `toggleTransformPlayer(video, "${ mode }", "${ flip }")` );
		video ??= tc.transform.video ?? document.querySelector( 'ytd-player video' );
		/**
		 * only 1 value (mode or flip) will change at a time.
		 */
		if ( mode === 'escape' ) {
			tc.states.transformed = '';
			tc.states.flipped = '';
			untransformPlayer( video );
		} else if ( mode === 'reset' ) {
			untransformPlayer( video );
			tc.states.transformed = '';
			tc.states.flipped = '';
		} else if ( tc.states.transformed === mode ) {
			tc.states.transformed = ''; //necessary, because it gets called twice
			untransformPlayer( video );
		} else if ( null === mode && flip ) {
			transformPlayer( video, null, flip );
		} else if ( `fill fit stretch`.includes( mode ) ) {
			transformPlayer( video, mode );
		}
	}
	function toggleTransformPlayer( video, value ) {
		// console.violet( `toggleTransformPlayer(video, "${ mode }", "${ flip }")` );
		video ??= tc.transform.video ?? document.querySelector( 'ytd-player video' );
		/**
		 * only 1 value (mode or flip) will change at a time.
		 */
		const {type, amplitude, direction} = value;
		if ( type === 'escape' ) {
			tc.states.transformed = '';
			tc.states.flipped = '';
			untransformPlayer( video );
		} else if ( type === 'reset' ) {
			untransformPlayer( video );
			tc.states.transformed = '';
			tc.states.flipped = '';
		} else if (type === 'scale' && tc.states.transformed === amplitude ) {
			tc.states.transformed = ''; //necessary, because it gets called twice
			untransformPlayer( video );
		} else if ( type === 'flip' ) {
			transformPlayer( video, null, direction );
		} else if ( type === 'scale' && `fill fit stretch`.includes( amplitude ) ) {
			transformPlayer( video, amplitude );
		}
	}
	let count = 0;
	async function untransformPlayer( video ) {
		/**
		 * not sure why this gets called twice
		 */
		count++;
		console.blue( `untransformPlayer(video);`, count );
		video ??= tc.transform.video ?? document.querySelector( 'ytd-player video' );
		if ( !video || !video.transform ) return;
		let allTransformed = Array.from( document.querySelectorAll( `.transform` ) );
		console.log( allTransformed );
		allTransformed.forEach( element => {
			element.classList.remove( 'transform' )
		}
		);

		const shadowContainer = video.transform.div;
		[ "#container" ].forEach( cssSelector => {
			shadowContainer.shadowRoot.querySelector( cssSelector )?.classList.remove( 'transform' );
		} );
		let classesToRemove = [ 'fill', 'fit', 'stretch', 'flipX', 'flipY', 'flipXY', 'flipYX' ];
		video.classList.remove( ...classesToRemove );
		document.querySelector( `#DynamicTransformStyle` )?.remove();
		let success = await updateControllerCoordinatesWhenUntransformed( video );
		return success;
	}
	function updateControllerCoordinatesWhenUntransformed( video ) {
		return new Promise( ( resolve, reject ) => {
			// console.log( `updateControllerCoordinatesWhenUntransformed` );
			video ??= tc.transform.video ?? document.querySelector( 'ytd-player video' );
			if ( !video ) return resolve( 'no video found' && false );
			const videoBoundingRect = video.getBoundingClientRect();
			const offsetParentRect = video.offsetParent?.getBoundingClientRect();
			const controller = video.transform.div.shadowRoot.querySelector( `#container` );
			if ( !controller ) reject( 'video exists, but cant find controller' );
			controller.style.left = parseInt( Math.max( offsetParentRect?.width || 0, videoBoundingRect.width ) / 2 ) + 'px';
			controller.style.top = parseInt( Math.max( offsetParentRect?.height || 0, videoBoundingRect.height ) / 2 ) + 'px';
			resolve( video );
		} )
	}
	function addTransformClass( video ) {
		video ??= tc.transform?.video ?? document.querySelector( 'ytd-player video' ); //need to track active video in the future for generic videoplatforms and not just youTube;
		if ( !video || !video.style || !video.classList ) return; //sometimes we get into a state that video is not loaded yet.
		[ 'primary', 'player', 'movie_player' ].forEach( id => {
			document.getElementById( id )?.classList.add( 'transform' );
		} );
		[ 'html', 'body', 'ytd-player #container', 'ytd-player video', 'ytd-player DIV.ytp-chrome-bottom' ].forEach(
			cssSelector => document.querySelector( cssSelector )?.classList.add( 'transform' ) );
	}
	async function transformPlayer( video, mode, flip ) {
		video ??= tc.transform?.video ?? document.querySelector( 'ytd-player video' ); //need to track active video in the future for generic videoplatforms and not just youTube;
		if ( !video || !video.style || !video.classList ) return; //sometimes we get into a state that video is not loaded yet.

		// flip ??= tc.states.flipped;
		if ( flip ) {
			flip.split( '' ).forEach( letter => {
				if ( tc.states.flipped.includes( letter ) ) tc.states.flipped = tc.states.flipped.replace( letter, '' );
				else tc.states.flipped = tc.states.flipped + letter;
			} );
		}
		flip = tc.states.flipped; //flip can be ['','X','Y','YX','XY']; //if flip not specified, we won't change it
		if ( mode ) {
			if ( 'fit fill stretch'.includes( mode ) ) tc.states.transformed = mode;
			else {
				//if it's "reset", "escape"
				//don't update
			}
		} else mode = tc.states.transformed;


		addTransformClass( video );

		const { width, height } = video.style; //these are native/original/untransformed values;
		// const { videoWidth, videoHeight } = video; //sometimes the original video sizes are larger than the viewport itself.
		const { innerWidth, innerHeight, /* outerWidth, outerHeight, offsetWidth, offsetHeight*/ } = window; //don't need the extra parameters for now
		let { rescale, Δx, Δy, rescaleW, rescaleH } = _getParameters_( height, width, innerHeight, innerWidth, 0, 0, mode, flip );

		tc.transform = { rescale, Δx, Δy, rescaleW, rescaleH, width, height, innerWidth, innerHeight, video };
		// tc.states = {transformed: mode, flipped: flip}; //update states
		let newTransformValue;
		let className = mode, top = 0, left = 0;
		switch ( mode ) {
			case 'fit':
			case 'fill': newTransformValue = `translate(${ Δx }px, ${ Δy }px) scale(${ flip?.includes( 'X' ) ? "-" : '' }${ rescale }, ${ flip?.includes( 'Y' ) ? "-" : '' }${ rescale });`; break;
			case 'stretch': newTransformValue = `translate(${ Δx }px, ${ Δy }px) scale(${ flip?.includes( 'X' ) ? "-" : '' }${ rescaleW }, ${ flip?.includes( 'Y' ) ? "-" : '' }${ rescaleH });`; break;
		}

		let classesToRemove = [ 'fill', 'fit', 'stretch', 'flipX', 'flipY', 'flipXY', 'flipYX' ];//.remove(className);

		// video.style.transform = videoTransform;
		video.classList.remove( ...classesToRemove );
		if ( flip ) video.classList.add( mode );
		if ( flip ) video.classList.add( `flip` + flip );
		let results = await updateDynamicTransformStyle( className, newTransformValue, top, left, 'fixed' );

		const transformController = video.transform.div;
		[ "form#container" ].forEach( async cssSelector => {
			let element = transformController.shadowRoot.querySelector( cssSelector );
			if ( !element ) return;
			element.classList.add( 'transform' );
			await updateDynamicControllerStyle( transformController.shadowRoot, 'transform', innerWidth, innerHeight );
		} );




		function _getParameters_( h, w, winH, winW, offsetLeft, offsetTop, newMode, newFlip ) {
			const adjustFactor = 0.995;
			let func = Math.min;
			w = parseInt( w );
			h = parseInt( h );
			winH = parseInt( winH );
			winW = parseInt( winW );
			offsetLeft = parseInt( offsetLeft );
			offsetTop = parseInt( offsetTop );
			const rescaleH = ( winH / h ); //rescale by horizontal dimensions;
			const rescaleW = ( winW / w );
			const re = /(?<mode>(fill|fit|stretch|no scale)((\s(same orientation|x|y|w|h))+)?)?\s?(?<flip>(flip))?/dgi;
			let { mode, flip } = re.exec( newMode )?.groups; //will look for groups: mode:(fill|fit|fill same orientation|fit same orientation) and flip: flip
			mode ??= `no scale`;
			switch ( mode ) {
				case `fill`: func = Math.max; break;
				case `fill same orientation`: func = ( winW > winH ) === ( w > h ) ? Math.max : Math.min; break; //to hide outlines
				case `fit`: func = Math.min; break;
				case `no rescale`: func = () => 1 / adjustFactor; //  --> 1 --> no adjustment
			}
			const rescale = func( rescaleW, rescaleH ) * adjustFactor;
			const Δx = parseInt( ( winW - w ) / 2 - offsetLeft );// + window.top.scrollX;
			const Δy = parseInt( ( winH - h ) / 2 - offsetTop );// + window.top.scrollY;
			return { rescale, Δx, Δy, rescaleW, rescaleH };
		}
	}

	function updateDynamicTransformStyle( className, videoTransform, top, left, position ) {
		return new Promise( async ( resolve, reject ) => {
			//save new values
			if ( className ) updateDynamicTransformStyle.className = className;
			if ( videoTransform ) updateDynamicTransformStyle.videoTransform = videoTransform;
			if ( top !== null ) updateDynamicTransformStyle.top = top;
			if ( left !== null ) updateDynamicTransformStyle.left = left;
			if ( position ) updateDynamicTransformStyle.position = position;
			//use old values when not provided
			className ??= updateDynamicTransformStyle.className;
			videoTransform ??= updateDynamicTransformStyle.videoTransform;
			top ??= updateDynamicTransformStyle.top;
			left ??= updateDynamicTransformStyle.left;
			position ??= updateDynamicTransformStyle.position;

			let style = document.querySelector( `#DynamicTransformStyle` );
			if ( !style ) {
				style = document.createElement( `STYLE` );
				style.id = 'DynamicTransformStyle';
				document.body.after( style );
			}
			style.innerHTML = `
          			#container.transform video, video.${ className } {
						position: ${ position } !important;
						top: ${ top }px !important;
						left: ${ left }px !important;
						transform: ${ videoTransform } !important;
						transition: all 250ms ease-in-out !important;
					}`.replace( /\s{2,}/g, ' ' ); //reduces multiple whitespace characteres to 1.
			return resolve( style );
		} );
	}
	function updateDynamicControllerStyle( shadowRoot, className, innerWidth, innerHeight ) {
		return new Promise( resolve => {
			//save new values
			if ( shadowRoot ) updateDynamicControllerStyle.shadowRoot = shadowRoot;
			if ( className ) updateDynamicControllerStyle.className = className;
			if ( innerWidth ) updateDynamicControllerStyle.innerWidth = innerWidth;
			if ( innerHeight ) updateDynamicControllerStyle.innerHeight = innerHeight;
			//use old values when not provided
			shadowRoot ??= updateDynamicControllerStyle.shadowRoot;
			className ??= updateDynamicControllerStyle.className;
			innerWidth ??= updateDynamicControllerStyle.innerWidth;
			innerHeight ??= updateDynamicControllerStyle.innerHeight;

			let style = shadowRoot.querySelector( `#DynamicControllerStyle` );
			if ( !style ) {
				let frag = document.createDocumentFragment();
				style = document.createElement( `STYLE` );
				style.id = 'DynamicControllerStyle';
				frag.appendChild( style );
				shadowRoot.appendChild( frag );
			}
			style.innerHTML = `
          			#container.${ className } {
						position: fixed !important;
						top: ${ parseInt( innerHeight / 2 ) }px !important;
						left: ${ parseInt( innerWidth / 2 ) }px !important;
						transition: all 250ms ease-in-out !important;
					}
					`.replace( /\s{2,}/g, ' ' ); //reduces multiple whitespace characteres to 1.
			return resolve( style );
		} );
	}
	async function flipTransformPlayer( video, direction ) {

		if ( !flipTransformPlayer.readyToExecute ) return false;
		flipTransformPlayer.readyToExecute = false;
		/**
		 * NOT OPTIMIZED.
		 * this function doesn't work well when the video is in native location.
		 * This only works well when video is in the transformed mode.
		 */
		video ??= document.querySelector( 'ytd-player video' );
		let currentTransform = video.style.transform;

		tc.states.flipped = tc.states.flipped === direction ? false : direction;
		let videoTransform, top = null, left = null, position = tc.states.transformed ? 'fixed' : 'unset';
		let className = "flip" + direction;
		let classesToRemove = [ direction === 'X' ? 'flipY' : 'flipX' ];
		switch ( currentTransform ) {
			case 'null':
			case 'undefined':
			case '':
			case 'unset':
				videoTransform = `scale${ direction }(-1)`;
				break; //& when this is unset
			default:
				const { translateX, translateY, scaleX, scaleY } = parseTransform( currentTransform.toString() );
				videoTransform = `translate(${ translateX },${ translateY }) scale(${ direction === 'X' ? `${ -scaleX }, ${ scaleY }` : `${ scaleX }, ${ -scaleY }` })`;
		}
		video.classList.remove( ...classesToRemove )
		video.classList.add( className );
		video.style.transform = videoTransform;
		let success = await updateDynamicTransformStyle( className, videoTransform, top, left, position );
		if ( success ) {
			if ( flipTransformPlayer.coolTimer ) clearTimeout( flipTransformPlayer.coolTimer );
			flipTransformPlayer.coolTimer = setTimeout( () => flipTransformPlayer.readyToExecute = true, 750 );
		}

		return

		function parseTransform( metastring ) {
			const re_translateX = /(\s*translateX[( ]+(?<translateX>\-?\d+(\w+|\%))[ )]+)|(\s*translate[( ]+(?<translateX>\-?\d+(\w+|\%))[, ]+\-?\d+(\w+|\%)[ )]+)|(\s*translate[( ]+(?<translateX>\-?\d+(\w+|\%))[ )]+)/dgi;
			const re_translateY = /(\s*translateY[( ]+(?<translateY>\-?\d+(\w+|\%))[ )]+)|(\s*translate[( ]+\-?\d+(\w+|\%)[, ]+(?<translateY>\-?\d+(\w+|\%))[ )]+)|(\s*translate[( ]+(?<translateY>\-?\d+(\w+|\%))[ )]+)/dgi;
			const re_scaleX = /(\s*scaleX[( ]+(?<scaleX>[-.\d]+)[ )]+)|(\s*scale[( ]+(?<scaleX>[-.\d]+)[, ]+[-.\d]+[ )]+)|(\s*scale[( ]+(?<scaleX>[-.\d]+)[ )]+)/dgi;
			const re_scaleY = /(\s*scaleY[( ]+(?<scaleY>[-.\d]+)[ )]+)|(\s*scale[( ]+[-.\d]+[, ]+(?<scaleY>[-.\d]+)[ )]+)|(\s*scale[( ]+(?<scaleY>[-.\d]+)[ )]+)/dgi;
			const result_translateX = re_translateX.exec( metastring )?.groups || { translateX: '0px' };
			const result_translateY = re_translateY.exec( metastring )?.groups || { translateY: '0px' };
			const result_scaleX = re_scaleX.exec( metastring )?.groups || { scaleX: 1 };
			const result_scaleY = re_scaleY.exec( metastring )?.groups || { scaleY: 1 };
			return { ...result_translateX, ...result_translateY, ...result_scaleX, ...result_scaleY };
		}
	} flipTransformPlayer.readyToExecute = true;
	function getShadow( parent ) {
		let result = [];
		function getChild( parent ) {
			if ( parent.firstElementChild ) {
				var child = parent.firstElementChild;
				do {
					result.push( child );
					getChild( child );
					if ( child.shadowRoot ) result.push( getShadow( child.shadowRoot ) );
					child = child.nextElementSibling;
				} while ( child );
			}
		}
		getChild( parent );
		return result.flat( Infinity );
	}
	function run( action, value, e ) {
		var targetController;
		// Get the controller that was used if called from a button press event e
		if ( e ) targetController = e.target.getRootNode().host;
		cachedMediaElements.forEach( v => run.execute( v, action, value, e, targetController ) ); //run.execute( action, value, e, v, targetController ) );
	}
	run.execute = function ( v, action, value, e, targetController ) {
		var controller = v?.transform?.div;
		if ( e && targetController !== controller ) return; //this should be the proper way to compare nodes
		if ( v.classList.contains( `transform-cancelled` ) ) return;
		switch ( action ) {
			case 'fixedEdge': fixedEdge( v, value ); break;
			case 'experiment': experiment( v, value ); break;
			case 'transform': toggleTransformPlayer_old( v, value ); break;
			case 'transformPicture': toggleTransformPlayer( v, value ); break;
			case 'flip': toggleTransformPlayer_old( v, null, value ); break;//flipTransformPlayer( v, value ); break;
			case 'updateViewport': updateViewport( v, value ); break;
			case `manuallyExecute`: codeToRunManually(); break;
			case `display`: controller.classList.add( "transform-manual" );
				controller.classList.toggle( "transform-hidden" ); break;
			case `blink`:// if controller is hidden, show it briefly to give the use visual feedback that the action is excuted.
				if ( !controller.classList.contains( "transform-hidden" ) && !controller.blinkTimeOut ) break;
				clearTimeout( controller.blinkTimeOut );
				controller.classList.remove( "transform-hidden" );
				controller.blinkTimeOut = setTimeout( () => {
					controller.classList.add( "transform-hidden" );
					controller.blinkTimeOut = undefined;
				}, value || 5000 ); break;
			case `drag`: handleDrag( v, e ); break;
		}
	}
	async function experiment( video, value ) {
		switch ( value.toString() ) {
			case 'default': browser.runtime.sendMessage( { action: 'popup', data: true } ); break;
			case '2': STORAGE.clear(); console.red( 'cleared storage' ); break;
			case '3': STORAGE.set( storageCache.settings ); console.pink( 'set storage' ); break;
			case '4': console.green( ( await STORAGE.get() ).stringify( 4 ) ); break;
			case '5': console.orange( storageCache.stringify( 4 ) ); break;
			case '6': storageCache = resetStorageCache(); console.pink( storageCache.stringify( 4 ) ); break;
			case '7': window.open( browser.runtime.getURL( "./options/options.html" ), "_blank" ); break;
		}
	}
	async function updateViewport( video, specifier ) {
		video ??= tc.transform?.video ?? document.querySelector( 'ytd-player video' );
		if ( !video?.classList.contains( 'transform' ) ) return;
		// window.removeEventListener('resize', restoreTransformedPlayer);
		let currentState = tc.states.transformed;
		// untransformPlayer( video );
		let msg = { action: 'updateWindowSizeLocation', data: '' };
		const { rescale, innerWidth, innerHeight, width, height } = tc.transform;
		let deltaWidth = ( parseInt( innerWidth ) - parseFloat( rescale ) * parseInt( width ) );
		let deltaHeight = ( parseInt( innerHeight ) - parseFloat( rescale ) * parseInt( height ) );;
		msg.data = { deltaWidth: parseInt( -deltaWidth ), deltaHeight: parseInt( -deltaHeight ), deltaLeft: parseInt( deltaWidth / 2 ), deltaTop: parseInt( deltaHeight / 2 ) }
		browser.runtime.sendMessage( msg, response => {
			if ( browser.runtime.lastError ) console.log( response );

			transformPlayer( video, 'stretch' );
			tc.states.transformed = currentState;
		} );

	}
	function checkError( msg ) {
		console.log( browser.runtime.lastError, msg )
	}
	function handleDrag( video, e ) {
		const transformController = video.transform?.div;
		const shadowController = transformController.shadowRoot.querySelector( "#container" );
		// Find nearest parent of same size as video parent.
		var parentElement = transformController.parentElement;
		while (
			parentElement.parentNode &&
			parentElement.parentNode.offsetHeight === parentElement.offsetHeight &&
			parentElement.parentNode.offsetWidth === parentElement.offsetWidth
		) {
			parentElement = parentElement.parentNode;
		}
		video.classList.add( "transform-dragging" );
		shadowController.classList.add( "dragging" );
		const initialMouseXY = [ e.clientX, e.clientY ];
		const initialControllerXY = [
			parseInt( shadowController.style.left ),
			parseInt( shadowController.style.top )
		];
		const startDragging = ( e ) => {
			let style = shadowController.style;
			let dx = e.clientX - initialMouseXY[ 0 ];
			let dy = e.clientY - initialMouseXY[ 1 ];
			style.left = initialControllerXY[ 0 ] + dx + "px";
			style.top = initialControllerXY[ 1 ] + dy + "px";
		};
		const stopDragging = ( e ) => {
			parentElement.removeEventListener( "mousemove", startDragging );
			parentElement.removeEventListener( "mouseup", stopDragging );
			parentElement.removeEventListener( "mouseleave", stopDragging );
			shadowController.classList.remove( "dragging" );
			video.classList.remove( "transform-dragging" );
		};
		parentElement.addEventListener( "mouseup", stopDragging );
		parentElement.addEventListener( "mouseleave", stopDragging );
		parentElement.addEventListener( "mousemove", startDragging );
	}




	//!! these are not working

	if ( !HTMLVideoElement.prototype.hasOwnProperty( 'modifiedPlay' ) ) {
		Object.defineProperty( HTMLVideoElement.prototype, "modifiedPlay", {
			value: true
		} )
		console.blueBg( 'modified HTMLVideoElement .play()' );
		HTMLVideoElement.prototype.play = ( originalFunction => function play() {
			const video = this;
			const ret = originalFunction.apply( video, arguments );
			console.blue( 'HTMLVideoElement.play() called.' );

			if ( !video.transform ) video.transform = new tc.transformController( video );
			else {
				controller = video.transform.div;
				if ( controller.classList.contains( "transform-nosource" ) ) controller.classList.remove( "transform-nosource" );
			}
			return ret;
		} )( HTMLMediaElement.prototype.play || HTMLVideoElement.prototype.play );
	}

	if ( !HTMLMediaElement.prototype.hasOwnProperty( 'modifiedPlay' ) ) {
		Object.defineProperty( HTMLMediaElement.prototype, "modifiedPlay", {
			value: true
		} )
		console.blueBg( 'modified HTMLMediaElement .play()' );
		HTMLMediaElement.prototype.play = ( originalFunction => function play() {
			const video = this;
			const ret = originalFunction.apply( video, arguments );
			console.blue( 'HTMLMediaElement.play() called.' );

			if ( !video.transform ) video.transform = new tc.transformController( video );
			else {
				controller = video.transform.div;
				if ( controller.classList.contains( "transform-nosource" ) ) controller.classList.remove( "transform-nosource" );
			}
			return ret;
		} )( HTMLMediaElement.prototype.play || HTMLVideoElement.prototype.play );
	}
}


( async function ( browser ) { //required to use "top-level" await
	const [ monkeypatch, monkeypatch_DOM, videoModules ] = [
		browser.runtime.getURL( "./lib/monkeypatch_prototypes/monkeypatch.mjs" ),
		browser.runtime.getURL( "./lib/monkeypatch_prototypes/monkeypatch_DOM.mjs" ),
		browser.runtime.getURL( "./modifyVideoPrototypeForTransform.mjs" ) ];

	const MONKEYPATCH = import( monkeypatch ); //declaration import is blocked for content scripts  in chrome browser
	MONKEYPATCH.then(mkp => {
		[ 'consoleColors', 'stringify', 'is', 'defer' ].forEach( patch => {
			function execute() {
				if ( mkp[ patch ] && mkp[ patch ] instanceof Function ) mkp[ patch ]();
				else setTimeout(execute, 1000);
			}

			execute(); //weird sometimes this get ''Uncaught (in promise) TypeError: MONKEYPATCH[patch] is not a function''
		} );
	}, err => console.log(err));

	// const MONKEYPATCH_DOM = await import( monkeypatch_DOM );
	// [ 'ShadowRootTraverse', 'eventListeners', 'preventDefault', 'keyboardEventProperties', 'patchingHTMLElements' ].forEach( patch => MONKEYPATCH_DOM[ patch ]() );


	const MONKEYPATCH_DOM = import( monkeypatch_DOM );
	MONKEYPATCH_DOM.then( mkp_DOM => {
		[ 'ShadowRootTraverse', 'eventListeners', 'preventDefault', 'keyboardEventProperties', 'patchingHTMLElements' ].forEach( patch => {
			function execute() {
				if ( mkp_DOM[ patch ] && mkp_DOM[ patch ] instanceof Function ) mkp_DOM[ patch ]();
				else setTimeout( execute, 1000 );
			}

			execute(); //weird sometimes this get ''Uncaught (in promise) TypeError: MONKEYPATCH[patch] is not a function''
		} );//appears that this method solves the issue above.
	}, err => console.log( err ) );



	// const VIDEOMODULES = await import( videoModules );
	// [ 'Media' ].forEach( patch => VIDEOMODULES[ patch ]() );

	const VIDEOMODULES = import( videoModules );
	VIDEOMODULES.then( vidModules => {
		[ 'Media' ].forEach( patch => {
			function execute() {
				if ( vidModules[ patch ] && vidModules[ patch ] instanceof Function ) {
					vidModules[ patch ]();
					initialize( browser );
				}
				else setTimeout( execute, 1000 );
			}
			execute(); //weird sometimes this get ''Uncaught (in promise) TypeError: MONKEYPATCH[patch] is not a function''
		} );//appears that this method solves the issue above.
	}, err => console.log( err ) );






} )( globalThis.browser || chrome );
