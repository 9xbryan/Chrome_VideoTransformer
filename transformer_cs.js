if ( `undefined` == typeof globalThis.browser ) globalThis.browser = chrome;
import( browser.runtime.getURL( "./lib/monkeypatch_prototypes/monkeypatch.mjs" ) ).then( monkeypatch => {
	[ 'consoleColors', 'stringify', 'is', 'defer' ].forEach( patch => monkeypatch[ patch ]() );
	import( browser.runtime.getURL( "./lib/monkeypatch_prototypes/monkeypatch_DOM.mjs" ) ).then( monkeypatch_DOM => {
		[ 'ShadowRootTraverse', 'eventListeners', 'preventDefault', 'keyboardEventProperties', 'patchingHTMLElements' ].forEach( patch => monkeypatch_DOM[ patch ]() );

		var regStrip = /^[\r\t\f\v ]+|[\r\t\f\v ]+$/gm;
		var regEndsWithFlags = /\/(?!.*(.).*\1)[gimsuy]*$/;

		const tc = {
			settings: {
				enabled: true, // default enabled
				flip_X_state: false, //some YouTube videos were intentially flipped horizontally, this will allow users to mannually flip;
				flip_Y_state: false, //some YouTube videos were intentially flipped horizontally, this will allow users to mannually flip;
				transformedState: false, // possible states: [false, 'fill', 'fit', 'fill same orientation']
				displayKey: 'v', // default: V
				imageBoolean: false, // default: false
				startHidden: false, // default: false
				controllerOpacity: 0.3, // default: 0.3
				keyBindings: [],
				blacklist: `\
					www.instagram.com
					twitter.com
					vine.co
					imgur.com
					teams.microsoft.com
					`.replace( regStrip, "" )
			},
			mediaElements: []// Holds a reference to all of the IMG/VIDEO DOM elements we've attached to
		};







		// browser.storage.sync.clear(); //need to clear before adding more keyBindings






		browser.storage.sync.get( tc.settings, function ( storage ) {
			tc.settings.keyBindings = storage.keyBindings; // Array
			if ( storage.keyBindings.length == 0 ) {
				tc.settings.keyBindings.push( {
					action: "transform",
					keyCode: Number( storage.escapeKeyCode ) || 27, //keyCode
					code: storage.escapeCode || `Escape`, //physical key, not referenced with mod keys
					key: storage.escapeKey || `Escape`,
					value: storage.escapeValue || 'escape',
					force: false,
					predefined: true,
					execute: storage.untransformPlayer || untransformPlayer
				} );
				tc.settings.keyBindings.push( {
					action: "transform",
					keyCode: Number( storage.fitKeyCode ) || 71, //keyCode
					code: storage.fitCode || `KeyG`, //physical key, not referenced with mod keys
					key: storage.fitKey || `g`,
					value: storage.fitValue || 'fit',
					force: false,
					predefined: true,
					execute: storage.transformPlayer || transformPlayer
				} );
				tc.settings.keyBindings.push( {
					action: "transform",
					keyCode: Number( storage.fillKeyCode ) || 72, //keyCode
					code: storage.fillCode || `KeyH`, //physical key, not referenced with mod keys
					key: storage.fillKey || `h`,
					value: storage.fillValue || 'fill',
					force: false,
					predefined: true,
					execute: storage.transformPlayer || transformPlayer
				} );
				tc.settings.keyBindings.push( {
					action: "transform",
					keyCode: Number( storage.stretchKeyCode ) || 83, //keyCode
					code: storage.stretchCode || `KeyS`, //physical key, not referenced with mod keys
					key: storage.stretchKey || `s`,
					value: storage.stretchValue || 'stretch',
					force: false,
					predefined: true
				} );
				tc.settings.keyBindings.push( {
					action: "flip",
					keyCode: Number( storage.flipKeyCode ) || 89, //keyCode
					code: storage.flipCode || `KeyY`, //physical key, not referenced with mod keys
					key: storage.flipKey || `y`,
					value: storage.flip_X_Value || 'Y',
					force: false,
					predefined: true,
					execute: storage.transformPlayer || transformPlayer
				} );
				tc.settings.keyBindings.push( {
					action: "flip",
					keyCode: Number( storage.flip_X_KeyCode ) || 88, //keyCode
					code: storage.flip_X_Code || `KeyX`, //physical key, not referenced with mod keys
					key: storage.flip_X_Key || `x`,
					value: storage.flip_X_Value || 'X',
					force: false,
					predefined: true,
					execute: storage.transformPlayer || transformPlayer
				} );
				tc.settings.keyBindings.push( {
					action: "updateViewport",
					keyCode: Number( storage.shrinkViewportKeyCode ) || 82, //keyCode
					code: storage.shrinkViewportCode || `KeyR`, //physical key, not referenced with mod keys
					key: storage.shrinkViewportKey || `r`,
					value: storage.shrinkViewportValue || 'shrink' || 'reduce',
					force: false,
					predefined: true,
					execute: storage.transformPlayer || transformPlayer
				} );
				tc.settings.keyBindings.push( {
					action: "updateViewport",
					keyCode: Number( storage.expandViewportKeyCode ) || 69, //keyCode
					code: storage.expandViewportCode || `KeyE`, //physical key, not referenced with mod keys
					key: storage.expandViewportKey || `e`,
					value: storage.expandViewportValue || 'expand',
					force: false,
					predefined: true,
					execute: storage.transformPlayer || transformPlayer
				} );
				tc.settings.keyBindings.push( {
					action: "experiment",
					keyCode: Number( storage.expandViewportKeyCode ) || 69, //keyCode
					code: storage.expandViewportCode || `KeyQ`, //physical key, not referenced with mod keys
					key: storage.expandViewportKey || `q`,
					value: storage.expandViewportValue || 'default',
					force: false,
					predefined: true,
					execute: storage.transformPlayer || transformPlayer
				} );



				tc.settings.version = "0.5.3";
				browser.storage.sync.set( {
					keyBindings: tc.settings.keyBindings,
					version: tc.settings.version,
					enabled: tc.settings.enabled,
					blacklist: tc.settings.blacklist.replace( regStrip, "" )
				} );
			}
			tc.settings.enabled = Boolean( storage.enabled );
			tc.settings.blacklist = String( storage.blacklist );
			initializeWhenReady( document );
		} );
		function defineTransformController() {
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
				tc.mediaElements.push( target );
				this.media = target;
				this.video = target;
				this.parent = target.parentElement || parent;
				this.div = this.initializeControls();
				var observer = new MutationObserver( mutations => {
					mutations.forEach( mutation => {
						if ( mutation.type === "attributes" && ( mutation.attributeName === "src" || mutation.attributeName === "currentSrc" ) ) {
							var transformController = this.div;
							if ( !mutation.target.src && !mutation.target.currentSrc ) transformController.classList.add( "transform-nosource" );
							else transformController.classList.remove( "transform-nosource" );
						}
					} );
				} );
				observer.observe( target, {
					attributeFilter: [ "src", "currentSrc" ]
				} );
			};
			tc.transformController.prototype.remove = function () {
				this?.div.remove();
				// this.video.removeEventListener( "play", this.handlePlay );
				// this.video.removeEventListener( "seek", this.handleSeek );
				delete this.video.transform;
				let idx = tc.mediaElements.indexOf( this.video );
				if ( idx != -1 ) tc.mediaElements.splice( idx, 1 );
			};
			tc.transformController.prototype.initializeControls = function () {
				const doc = this.video.ownerDocument;
				// getBoundingClientRect is relative to the viewport; style coordinates
				// are relative to offsetParent, so we adjust for that here. offsetParent
				// can be null if the video has `display: none` or is not yet in the DOM.
				// const offsetRect = this.video.offsetParent?.getBoundingClientRect();
				const wrapper = doc.createElement( "div" );
				wrapper.classList.add( "transform-controller" );
				if ( !this.video.currentSrc ) wrapper.classList.add( "transform-nosource" );
				if ( tc.settings.startHidden ) wrapper.classList.add( "transform-hidden" );
				const shadow = wrapper.attachShadow( { mode: "open" } );
				const shadowTemplate = `
							<style>
							@import "${ browser.runtime.getURL( "shadow.css" ) }";
							</style>
							<div id="transformController"  data-action="drag" class="draggable" style="position:relative; top:auto; left:auto; opacity:${ tc.settings.controllerOpacity }; text-align:right;">
								<span class="transform" class="draggable">
									<button data-action="transform" data-value="fit">fit</button>
									<button data-action="transform" data-value="fill">fill</button>
									<button data-action="transform" data-value="stretch">stretch</button>
								</span>
								<span id="controls" class="draggable">
									<button data-action="flip" data-value="X">flip X</button>
									<button data-action="flip" data-value="Y">flip Y</button>
								</span>
								<span class="draggable">
									<button data-action="updateViewport" data-value="shrink">shrink Viewport</button>
									<button data-action="updateViewport" data-value="expand">expand Viewport</button>
									<button data-action="experiment" data-value="default">experiment</button>
								</span>
							</div>
						`;
				shadow.innerHTML = shadowTemplate.replace(/\s{2,}/g, ' ');
				shadow.querySelector( ".draggable" ).addEventListener( "drag", e => {
					e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
					run( e.target.dataset[ "action" ], false, e );
				}, true );
				shadow.querySelectorAll( "button" ).forEach( button => {
					button.addEventListener( "click", e => {
						const { action, value } = e.target.dataset;
						run( action, value, e );
						console.pinkBg( { action, value }.stringify( 4 ) )
						e.stopPropagation();
					}, true );
				} );
				shadow.querySelector( "#transformController" ).addEventListener( "click", ( e ) => e.stopPropagation(), false );
				this.speedIndicator = shadow.querySelector( "span" );
				var fragment = document.createDocumentFragment();
				fragment.appendChild( wrapper );
				switch ( true ) {
					case location.hostname == "www.amazon.com":
					case location.hostname == "www.reddit.com":
						// insert before parent to bypass overlay
						// this.parent.parentElement.insertBefore( fragment, this.parent );
						// this.parent.before( fragment ); //this should be the same as above: this.parent.parentElement.insertBefore( fragment, this.parent );
						this.parent.parentElement.appendChild( fragment ); //this should be the same as above: this.parent.parentElement.insertBefore( fragment, this.parent );
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
						// this.parent.parentNode.insertBefore( fragment, this.parent.parentNode.firstChild );
						// this.parent.parentNode.firstChild.before( fragment ); //this should be the same as above: this.parent.parentNode.insertBefore( fragment, this.parent.parentNode.firstChild );
						this.parent.parentNode.appendChild( fragment ); //this should be the same as above: this.parent.parentNode.insertBefore( fragment, this.parent.parentNode.firstChild );
						break;
					default:
						// Note: when triggered via a MutationRecord, it's possible that the
						// target is not the immediate parent. This appends the transformController as
						// the first element of the target, which may not be the parent.
						// this.parent.insertBefore( fragment, this.parent.firstChild );
						this.parent.appendChild( fragment ); //this should be the same as above: this.parent.insertBefore( fragment, this.parent.firstChild );
				}
				return wrapper;
			};
		}
		function isBlacklisted() {
			let blacklisted = false;
			tc.settings.blacklist.split( "\n" ).forEach( ( match ) => {
				match = match.replace( regStrip, "" );
				if ( match.length == 0 ) {
					return;
				}

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
		function refreshCoolDown() {
			if ( refreshCoolDown.timer ) clearTimeout( refreshCoolDown.timer );
			refreshCoolDown.timer = setTimeout( () => { refreshCoolDown.timer = false }, 1000 );
		} refreshCoolDown.timer = false;
		function setupListeners( e ) {
			/**
			 * This function is run whenever a video speed rate change occurs.
			 * It is used to update the speed that shows up in the display as well as save
			 * that latest speed into the local storage.
			 * @param {*} video The video element to update the speed indicators for.
			 */
			if (document.readyState === 'complete') {
				loadHandler()
			} else {
				// window.addEventListener( 'load', loadHandler );
				document.addEventListener( 'readystatechange', e => {
					if ( document.readyState === 'complete' ) loadHandler(e)
				} );
			}
			// window.addEventListener( 'load', loadHandler );
			window.addEventListener( 'resize', restoreTransformedPlayer );
			window.addEventListener( 'transitionend', restoreTransformedPlayer );
			window.addEventListener( 'webkitTransitionEnd', restoreTransformedPlayer );
			window.addEventListener( 'play', restoreTransformedPlayer );
			window.addEventListener( 'fullscreenchange', fullscreenchangeHandler );
			browser.runtime.onMessage.addListener( messageHandler );
		}
		async function loadHandler( e ) {
			document.documentElement.classList.add( `transformLoaded` );
			console.log('loadHandler()')
			await browser.runtime.sendMessage( { action:'popout', data: true}, checkError);
		}
		function messageHandler( e ) { }

		function initializeWhenReady( document ) {
			if ( isBlacklisted() ) return;
			window.addEventListener( 'load', e => initializeNow( window.document ) );
			if ( !document ) return;
			switch ( document.readyState ) {
				case 'complete': initializeNow( document ); break;
				default: document.addEventListener( 'readystatechange', e => { if ( document.readyState === "complete" ) initializeNow( document ); } );
			}
		}
		function initializeNow( document ) {
			if ( !tc.settings.enabled ) return;
			// enforce init-once due to redundant callers
			if ( !document.body || document.body.classList.contains( "transform-initialized" ) ) return;
			try {
				if ( document.readyState === 'complete' ) setupListeners();
				else window.addEventListener( `readystatechange`, e => { if ( document.readyState === 'complete' ) setupListeners( e ) } );
			} catch (e) { /*no operation*/ }
			document.body.classList.add( "transform-initialized" );
			if ( document === window.document ) defineTransformController();
			else {
				var link = document.createElement( "link" );
				link.href = browser.runtime.getURL( "transformer.css" );
				link.type = "text/css";
				link.rel = "stylesheet";
				document.head.appendChild( link );
			}
			var docs = Array( document );
			try {
				if ( inIframe() ) docs.push( window.top.document );
			} catch ( e ) { }
			docs.forEach( doc => doc.addEventListener( "keydown", keydownHandler, true ) );
			function checkForVideo( node, parent, added ) {
				// Only proceed with supposed removal if node is missing from DOM
				if ( !added && document.body?.contains( node ) ) return;

				if (
					node.nodeName === "VIDEO" ||
					( node.nodeName === "IMG" && tc.settings.imageBoolean )
				) {
					if ( added ) node.transform = new tc.transformController( node, parent );
					else {
						if ( node.transform ) node.transform.remove();
					}
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
			var mediaTags = document.querySelectorAll( tc.settings.imageBoolean ? "video,img" : "video" );
			mediaTags.forEach( video => video.transform = new tc.transformController( video ) );
			var frameTags = document.getElementsByTagName( "iframe" );
			var childDocument;
			for ( const frame of frameTags ) {
				try {
					childDocument = frame.contentDocument;
				} catch ( e ) { continue }
				initializeWhenReady( childDocument );
			}
			function inIframe() {
				try {
					return window.self !== window.top;
				} catch ( e ) { return true; }
			}
		}
		function keydownHandler( e ) {
			var { key, code, keyCode, target } = e;
			// Ignore if following modifier is active.
			if ( !e.getModifierState ||
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
			if ( !tc.mediaElements.length ) return false;
			const boundAction = tc.settings.keyBindings.find( i => i.key === key );
			if ( !boundAction ) return false;
			const { action, value, force } = boundAction;
			if ( force === "true" ) {
				// disable websites key bindings
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
			}
			// runAction( action, value );
			run( action, value );
			return false;
		}
		function restoreTransformedPlayer( e ) {
			console.purpleBg( `restoreTransformedPlayer(e)` );
			if ( e.target.nodeName !== "VIDEO" ) return;
			if ( tc.settings.transformedState ) transformPlayer( tc.settings.transformedState );
			else untransformPlayer();
		}
		function fullscreenchangeHandler( e ) {
			document.fullscreenElement ? untransformPlayer() : restoreTransformedPlayer( e );
		}
		function toggleTransformPlayer( mode ) {
			if ( tc.settings.transformedState === mode ) {
				untransformPlayer();
				tc.settings.transformedState = false;
			} else {
				transformPlayer( mode );
				tc.settings.transformedState = mode;
			}
		}
		function untransformPlayer() {
			[ 'primary', 'player' ].forEach( id => {
				let element = document.getElementById( id ); //not sure why querySelector(`#primary`) didn't catch.
				if ( element ) element.classList.remove( 'transform' );
			} );
			[ 'html', 'body', 'ytd-player #container', 'ytd-player video', 'ytd-player DIV.ytp-chrome-bottom' ].forEach( cssSelector => {
				let element = document.querySelector( cssSelector );
				if ( element ) element.classList.remove( 'transform' );
			} )
			let video = document.querySelector( 'ytd-player video' );
			if ( !video ) return;
			// if ( video ) {
			let classesToRemove = `fill fit stretch escape`.split( /\s+/ );
			video.style.transform = '';
			video.classList.remove( ...classesToRemove );
			// }
		}
		function transformPlayer( mode ) {
			/**
			 * this needs to be separated from "untransformPlayer()" in order to have better control, when ad-videos will untransform;
			 */
			let video = document.querySelector( 'ytd-player video' );
			if ( !video ) return;
			let priorTransform = video.style.transform;
			if ( !priorTransform && video.classList.contains( 'transform' ) ) untransformPlayer(); //this occurs when YouTube Ads interfere //removes all "transform" class
			[ 'primary', 'player' ].forEach( id => {
				let element = document.getElementById( id );
				if ( element ) element.classList.add( 'transform' );
			} );
			[ 'html', 'body', 'ytd-player #container', 'ytd-player video', 'ytd-player DIV.ytp-chrome-bottom' ].forEach( cssSelector => {
				let element = document.querySelector( cssSelector );
				if ( element ) element.classList.add( 'transform' );
			} )

			const { width, height } = video.style;
			const { videoWidth, videoHeight } = video; //sometimes the original video sizes are larger than the viewport itself.
			const { innerWidth, innerHeight, outerWidth, outerHeight, offsetWidth, offsetHeight } = window;
			const { rescale, Δx, Δy, rescaleW, rescaleH } = _getParameters_( height, width, innerHeight, innerWidth, 0, 0, mode );
			tc.transform = { rescale, Δx, Δy, rescaleW, rescaleH };
			tc.transform.video = { width, height, videoWidth, videoHeight };
			tc.transform.viewport = { innerWidth, innerHeight, outerWidth, outerHeight, offsetWidth, offsetHeight };

			let videoTransform, className = mode, top = 0, left = 0;
			switch ( mode ) {
				case 'fill': videoTransform = `translate(${ Δx }px, ${ Δy }px) scaleX(${ ( tc.settings.flip_X_state ? -rescale : rescale ) }) scaleY(${ ( tc.settings.flip_Y_state ? -rescale : rescale ) })`; break;
				case 'fit': videoTransform = `translate(${ Δx }px, ${ Δy }px) scaleX(${ ( tc.settings.flip_X_state ? -rescale : rescale ) }) scaleY(${ ( tc.settings.flip_Y_state ? -rescale : rescale ) })`; break;
				case 'stretch': videoTransform = `translate(${ Δx }px, ${ Δy }px) scaleX(${ ( tc.settings.flip_X_state ? -rescaleW : rescaleW ) }) scaleY(${ ( tc.settings.flip_Y_state ? -rescaleH : rescaleH ) })`; break;
				case 'escape': videoTransform = `translate(-50%, -50%) scaleX(${ ( tc.settings.flip_X_state ? -1 : 1 ) }) scaleY(${ ( tc.settings.flip_Y_state ? -1 : 1 ) })`;
					top = '50%'; left = '50%'; break;
			}
			let classesToRemove = `fill fit stretch escape`.replace( className, '' ).split( /\s+/ );
			video.style.transform = videoTransform;
			video.classList.remove( classesToRemove );
			video.classList.add( className );
			return updateDynamicTransformStyle( className, videoTransform, top, left, 'fixed' );




			function _getParameters_( h, w, winH, winW, offsetLeft, offsetTop, slideShowMode ) {
				const adjustFactor = 0.995;
				let func = Math.min;
				w = parseInt( w );
				h = parseInt( h );
				winH = parseInt( winH );
				winW = parseInt( winW );
				const rescaleH = ( winH / h ); //rescale by horizontal dimensions;
				const rescaleW = ( winW / w );
				const re = /(?<mode>(fill|fit|stretch|no scale)((\s(same orientation|x|y|w|h))+)?)?\s?(?<flip>(flip))?/dgi;
				let { mode, flip } = re.exec( slideShowMode )?.groups; //will look for groups: mode:(fill|fit|fill same orientation|fit same orientation) and flip: flip
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
				// console.log(`Δx: ${Δx }, Δy: ${Δy} `)
				return { rescale, Δx, Δy, rescaleW, rescaleH };
			}
		}
		function updateDynamicTransformStyle( className, videoTransform, top, left, position ) {
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

			return new Promise( async resolve => {
				let style = document.querySelector( `#DynamicTransformStyle` );
				if ( !style ) {
					style = document.createElement( `STYLE` );
					style.id = 'DynamicTransformStyle';
					// document.body.after( style );
				}
				style.innerHTML = `
          			#container.transform video, video.${ className } {
						position: ${ position } !important;
						top: ${ top } !important;
						left: ${ left } !important;
						transform: ${ videoTransform } !important;
						transition: all 250ms ease-in-out !important;
					}
					`.replace( /\s{2,}/g, ' ' ); //reduces multiple whitespace characteres to 1.
				document.body.after( style );
				return resolve( style );
			} );
		}
		function flipTransformPlayer( direction ) {
			/**
			 * NOT OPTIMIZED.
			 * this function doesn't work well when the video is in native location.
			 * This only works well when video is in the transformed mode.
			 */
			let video = document.querySelector( 'ytd-player video' );
			let currentTransform = video.style.transform;
			let className = "flip_" + direction;
			tc.settings[ `flip_${ direction }_state` ] = tc.settings[ `flip_${ direction }_state` ] !== true;
			let videoTransform, top = null, left = null, position = 'unset';
			switch ( currentTransform.toString() ) {
				case 'null':
				case 'undefined':
				case '':
				case 'unset':
					video.classList.add( className );
					videoTransform = `scale${ direction }(-1)`;
					video.style.transform = videoTransform;
					updateDynamicTransformStyle( className, videoTransform, top, left, position );
					break; //& when this is unset
				default:
					video.classList.add( className );
					const { translateX, translateY, scaleX, scaleY } = parseTransform( currentTransform.toString() );
					videoTransform = `translate(${ translateX },${ translateY }) scale(${ direction === 'X' ? `${ -scaleX }, ${ scaleY }` : `${ scaleX }, ${ -scaleY }` })`;
					video.style.transform = videoTransform;
					updateDynamicTransformStyle( className, videoTransform, top, left, position );
			}
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
		}
		function getShadow( parent ) {
			let result = [];
			function getChild( parent ) {
				if ( parent.firstElementChild ) {
					var child = parent.firstElementChild;
					do {
						result.push( child );
						getChild( child );
						if ( child.shadowRoot ) {
							result.push( getShadow( child.shadowRoot ) );
						}
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
			tc.mediaElements.forEach( v => run.execute( v, action, value, e, targetController ) ); //run.execute( action, value, e, v, targetController ) );
		}
		run.execute = ( v, action, value, e, targetController ) => {
			var controller = v?.transform?.div;
			if ( e && !targetController.isSameNode( controller ) ) return; //this should be the proper way to compare nodes
			// showController( transformController );
			if ( v.classList.contains( `transform-cancelled` ) ) return;
			switch ( action ) {
				case 'experiment': experiment(value);break;
				case 'transform': toggleTransformPlayer( value ); break;
				case "flip": flipTransformPlayer( value ); break;
				case "updateViewport": updateViewport( value ); break;
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
		function experiment(value) {
			browser.runtime.sendMessage({action:'popup', data:true})
		}
		async function updateViewport( specifier ) {
			let msg = { action: '', data: '' };
			switch ( specifier ) {
				case 'shrink':
					msg.action = 'updateWindowSizeLocation';
					console.blueBg( tc.transform.stringify( 4 ) )
					const { rescale, video, viewport } = tc.transform;
					let deltaWidth = ( parseInt( viewport.innerWidth ) - parseFloat( rescale ) * parseInt( video.width ) );
					let deltaHeight = ( parseInt( viewport.innerHeight ) - parseFloat( rescale ) * parseInt( video.height ) );
					let deltaLeft =
						// msg.data = {width: parseInt(viewport.outerWidth) - parseInt(deltaWidth), height:parseInt(viewport.outerHeight) - parseInt(deltaHeight)};
						msg.data = { deltaWidth: parseInt( -deltaWidth ), deltaHeight: parseInt( -deltaHeight ), deltaLeft: parseInt( deltaWidth / 2 ), deltaTop: parseInt( deltaHeight / 2 ) }
					console.log( msg.data.stringify( 4 ) );
					let response = await browser.runtime.sendMessage( msg, checkError );
					console.log( response )
					break;
				case 'expand': console.log( 'expanding viewport not impolemented' )
			}
		}
		function checkError( msg ) {
			console.log( browser.runtime.lastError, msg )
		}
		function handleDrag( video, e ) {
			const transformController = video.transform.div;
			const shadowController = transformController.shadowRoot.querySelector( "#transformController" );

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

			const stopDragging = () => {
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
		function codeToRunManually() {
			var flattenedNodes = getShadow( document.body );
			var nodes = flattenedNodes.filter( x => ( x.nodeName == "VIDEO" || x.nodeName == "IMG" ) );
			for ( let node of nodes ) {
				console.log( `%cMEDIA FOUND:`, `color:yellow;background-color:darkBlue;`, node.outerHTML.match( /^\<.+>/i )[ 0 ] );
				node.classList.add( "BB_media_" );
				// only add vsc the first time for the apple-tv case (the attribute change is triggered every time you click the vsc)
				// if (node.transform && mutation.target.nodeName === 'APPLE-TV-PLUS-PLAYER') continue;
				if ( node.transform ) node.transform.remove();
				// _checkForVideo(node, node.parentNode || mutation.target, true); //last working
				_checkForMedia( node, node.parentNode, `addedNodes` );
			}
		}
	} );
} );
