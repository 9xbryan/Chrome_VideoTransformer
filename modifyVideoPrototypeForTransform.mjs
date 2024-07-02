export function Media() {
	if ( HTMLMediaElement.prototype.hasOwnProperty( 'rate' ) ) return;
	HTMLMediaElement.prototype.getSpeed = function () { return parseFloat( this.playbackRate ).toFixed( 2 ) };
	HTMLMediaElement.prototype.togglePlay = function () { if ( !this.currentSrc ) return; ( this.ended || this.paused ) ? ( this.play(), this.setAttribute( 'playstate', 'playing' ) ) : ( this.pause(), this.setAttribute( 'playstate', 'paused' ) ) };

	HTMLMediaElement.prototype.play = ( originalFunction => function play() {
		var ret = originalFunction.apply( this, arguments );
		console.log( 'HTMLMediaElement.play() called.' );
		return ret;
	} )( HTMLMediaElement.prototype.play );
	HTMLVideoElement.prototype.play = ( originalFunction => function play() {
		var ret = originalFunction.apply( this, arguments );
		console.log( 'HTMLVideoElement.play() called.' );
		return ret;
	} )( HTMLVideoElement.prototype.play );
	HTMLAudioElement.prototype.play = ( originalFunction => function play() {
		var ret = originalFunction.apply( this, arguments );
		console.log( 'HTMLMediaElement.play() called.' );
		return ret;
	} )( HTMLAudioElement.prototype.play );

	//not standard, should not be used
	Object.defineProperty( HTMLMediaElement.prototype, 'rate', {
		get() { return this.playbackRate },
		set( val ) { this.playbackRate = val; this.setAttribute( 'rate', val ) }
	} );
	Object.defineProperty( HTMLVideoElement.prototype, 'highestContainer', {
		get() {
			var ele = this;
			do { ele = ele.parentElement } while ( ele && ( ele.offsetHeight < this.offsetHeight + 20 && ele.offsetHeight > this.offsetHeight - 20 )
				&& ( ele.offsetWidth < this.offsetWidth + 20 && ele.offsetHeight > this.offsetWidth - 20 ) ); return ele;
		}
	} );
	HTMLVideoElement.prototype.createIndicator = function () {
		if ( this.shaHost ) return this.shaHost;

		function showRecentChange( trg, time = 2000, classN = 'vidcontrol-show' ) {
			if ( !trg ) throw 'target for showRecentChange is not an element.';
			var timer, recentChange;
			recentChange && timer && clearTimeout( timer );
			timer = applyChange( trg );

			function applyChange( target ) {
				target.classList.add( classN ); recentChange = !!1;
				//var previousIndicators = document.qAll(".okaytoremove");
				//	previousIndicators.forEach(i => {i.remove()})
				if ( !target.classList.contains( 'donotremove' ) ) {
					return setTimeout( function () {
						target.classList.remove( classN );
						recentChange = !!0;
					}, time ); //default is 2 seconds
				} else return null;
			}
		}

		var vid = this;// this.video = vid;
		let vidid = vid.dataset[ 'vidid' ];
		//var top = Math.max(vid.offsetTop, 0) + "px", left = Math.max(vid.offsetLeft, 0) + "px";

		vid.shaHost = document.create( 'div' );
		vid.shaHost.dataset[ 'vidid' ] = vidid;
		vid.shaHost.classList.add( '_b_shaHost' );
		vid.shaHost.style.cssText += `z-index: 2147483647;`;// display:block; visibility: visible;`;
		//to find location to place shaHost so that we don't need to rely on z-index;


		//should not be using vmax (viewport maximum)
		var tmplt = `<style>
        * {
            font-family: Arial, Roboto, Geneva, Verdana, sans-serif;
            font-size: 2em;
            user-select: none;}
            #main {
            background: none;
            color: white; opacity: 1;
            text-shadow: 0px 0px 7px #00000;
            } #main:hover { opacity: 0.7 }


        #main {
            position: absolute; top: 0; left: 0;
             z-index: 2147483647;
            pointer-events:none; cursor: default;
            }
        ._b_recentChange {
            opacity: 0.7 !important;
            font-size: 3em;}
        .dragging {
            cursor: -webkit-grabbing;
            opacity: 0.7;
            color: lightgreen; }
        .draggable {
            cursor: -webkit-grab }
        #speedIndicator::after { content: "×"; }
        .draggable:active { cursor: -webkit-grabbing }
        </style>

        <div id="main" style="top:0px; left:0px;" class="draggable">
            <span id="speedIndicator" class="draggable" data-action="drag" style="text-shadow: 0px 0px 7px #00000; opacity: 0.3;">${ vid.getSpeed() }</span>
        </div>`;
		var shadow = vid.shaHost.attachShadow( { mode: 'open' } );
		shadow.innerHTML = tmplt.replace( /[^\S\r\n]{2,}/g, ' ' );



		vid.speedIndicator = shadow.q( '#speedIndicator' );
		if ( vid.speedIndicator ) vid.classList.add( '_b_hasIndicator' );
		//vid.setAttribute('onplay', `this.classList.add('_b_activeVid')`);
		/* 				function addDoNotRemove(e) {
							shaHost.classList.add('donotremove'); vid.speedIndicator.classList.add('donotremove');
							showRecentChange(shaHost); showRecentChange(vid.speedIndicator, 5000, '_b_recentChange');
							//console.log(vid.rate);
						}
						function removeDoNotRemove(e) {
							shaHost.classList.remove('donotremove'); vid.speedIndicator.classList.remove('donotremove');
							vid.speedIndicator.classList.add('okaytoremove');
							showRecentChange(shaHost); showRecentChange(vid.speedIndicator, 5000, '_b_recentChange');
						} */
		//vid.speedIndicator.on('mouseenter', addDoNotRemove);
		//vid.speedIndicator.on('mouseleave', removeDoNotRemove);
		//shaHost.on('mouseenter', addDoNotRemove);
		//shaHost.on('wheel', addDoNotRemove);
		//shaHost.on('mouseleave', removeDoNotRemove);

		/* 				function rateChangeWheel(e) {
							if (e.trg.readyState <= 0) return;
							e.xDefault(); e.xxProp(); e.xProp();
							let change = e.deltaY > 0 ? 0.25 : -0.25;
							curRate += change;//e.deltaY * 0.01;
							//restrict scale;
							curRate = Math.min(Math.max(0.5, curRate), 15);
							curRate = Number((curRate).toFixed(2));
							vid.rate = curRate;
							vid.speedIndicator.textContent = curRate;
							showRecentChange(shaHost); showRecentChange(vid.speedIndicator, 5000, '_b_recentChange');
							//console.log(`inside rateChangeWheel: current rate: ${vid.rate}x.`)
							//restrict rate;
							//vid.rate = Max.min(Math.max(1, newRate),16);
						} */
		function updatePosition( v ) {
			let main = shadow.q( '#main' );
			if ( !main ) return;
			main.style.top = Math.max( v.offsetTop, 0 ) + "px";
			main.style.left = Math.max( v.offsetLeft, 0 ) + "px";
		}
		function showIndicatorHideOthers( exceptionV ) {
			let exceptionId = exceptionV.dataset.vidid;
			document.getElementsByTagName( 'video' ).forEach( ( v ) => {
				let id = v.dataset.vidid;
				let shadowHost = document.querySelector( `div[data-vidid="${ id }"]` );
				if ( !shadowHost ) return;
				id == exceptionId ? shadowHost.classList.remove( 'vsc-hidden' ) : shadowHost.classList.add( 'vsc-hidden' );
				/* if (id == exceptionId) {
					shadowHost.classList.remove('vsc-hidden');
				} else {
					shadowHost.classList.add('vsc-hidden');
				} */
			} );
		}
		function hideIndicator( v ) {
			let id = v.dataset.vidid;
			let shadowHost = document.querySelector( `div[data-vidid="${ id }"]` );
			if ( !shadowHost ) return;
			return shadowHost.classList.add( 'vsc-hidden' );
		}
		let updateSpeed = function ( v ) {
			let liveSpeed = v.getSpeed(); vid.speedIndicator.textContent = liveSpeed;
			vid.shaHost.classList.remove( 'vsc-hidden' );
			showRecentChange( vid.shaHost );
			showRecentChange( vid.speedIndicator, 5000, '_b_recentChange' );
			if ( tc && tc.settings ) tc.settings.speed = liveSpeed;
			if ( chrome && chrome.storage && chrome.storage.sync ) chrome.storage.sync.set( { 'speed': liveSpeed }, function ( e ) { } );
		}
		let curRate = vid.getSpeed();
		//console.log(`current video rate = ${curRate}x. `);
		//const myshaHost = shaHost;
		//shaHost.onwheel = rateChangeWheel;


		//var liveSpeed = vid.getSpeed(); //doesn't seem necessary
		vid.on( 'ratechange', function ( e ) {
			if ( e.target.readyState <= 0 ) return;
			updateSpeed( this );
		}.bind( vid ) );
		let favicon = {
			original: null,
			saveOriginal() {
				if ( !this.original ) {
					this.original = document.querySelector( "link[rel~='icon']" );
					if ( this.original ) {
						if ( this.original.name ) this.original = null;
						else this.original.rel = 'originalFI'
					}
				}
				return this.original;
			},
			play() {
				//this works but not being used for now
				this.saveOriginal();//document.querySelector("link[rel~='icon']");
				let toReplace = document.querySelector( "link[rel~='icon']" );//document.querySelector("link[rel~='icon']");
				if ( !toReplace ) {
					toReplace = document.createElement( 'link' );
					toReplace.rel = 'icon';
					document.getElementsByTagName( 'head' )[ 0 ].appendChild( toReplace );
				}
				toReplace.name = 'play';
				//toReplace.href = 'https://stackoverflow.com/favicon.ico';
				toReplace.href = 'https://static.clubs.nfl.com/seahawks/zadj3ehrnxwhvl6swapk';//seahawk favicon
			},
			pause() {
				//this works but not being used for now
				this.saveOriginal();//document.querySelector("link[rel~='icon']");
				let toReplace = document.querySelector( "link[rel~='icon']" );//document.querySelector("link[rel~='icon']");
				if ( !toReplace ) {
					toReplace = document.createElement( 'link' );
					toReplace.rel = 'icon';
					document.getElementsByTagName( 'head' )[ 0 ].appendChild( toReplace );
				}
				toReplace.name = 'pause';
				toReplace.href = 'https://stackoverflow.com/favicon.ico';
				//oReplace.href = 'https://static.clubs.nfl.com/seahawks/zadj3ehrnxwhvl6swapk';//seahawk favicon
			},
			returnOriginal() {
				if ( this.original ) {
					let toRemove = document.querySelector( "link[rel~='icon']" );
					if ( toRemove && toRemove.name ) toRemove.remove();
					this.original.rel = 'icon';
				}
			}
		}

		function clearTitle() {
			let t = document.title;
			//t = t.replace(/\▶\s*/g, '');
			t = t.replace( /[\⏸|\⏹|\▶|\⏯|\⏚]\s*/g, '' );
			//t = t.replace(/\⏹\s*/g, '');
			//  = t.replace('PLAYING ', '');
			document.title = t;
		}
		function insertPlay() {
			let t = document.title;
			//document.title = `▶ PLAYING ${t}`; //perfect this works when delayed by 1 sec
			if ( !t.contains( `▶` ) ) document.title = `▶ ${ t }`; //perfect this works when delayed by 1 sec
			//favicon.play();
		}

		function insertPause() {
			let t = document.title;
			if ( !t.contains( '⏸' ) ) document.title = `⏸ ${ t }`; //perfect this works when delayed by 1 sec
			//favicon.pause();
		}

		function insertStop() {
			let t = document.title;
			if ( !t.contains( '⏹' ) ) document.title = `⏹ ${ t }`; //perfect this works when delayed by 1 sec
		}

		function forNetflix() {
			clearTitle();
			insertPlay();
			vid.off( 'timeupdate', forNetflix ); //to run once, otherwise this causes unnecessary repeat
			//console.log('for Netflix()');
		}
		vid.on( 'timeupdate', forNetflix );
		vid.on( 'emptied', function ( e ) {
			clearTitle();
			insertStop();
		} );
		vid.on( 'canplay', function ( e ) {
			clearTitle();
			insertStop();
		} );
		vid.on( 'playing', function ( e ) {
			//onplay (same as onplaying) did not work when restarted Netflix.
			//onplaying supersede onplay
			if ( !this.classList.contains( '_b_activeVid' ) ) {
				let actives = this.ownerDocument.qAll( '._b_activeVid' ); //remove other activeVid tags first
				if ( actives ) {
					actives.forEach( ( a ) => { a.classList.remove( '_b_activeVid' ); } );
				}
				this.classList.add( '_b_activeVid' );
			}
			// setTimeout(insertPlay,1e3);
			//removePlay();
			clearTitle();
			insertPlay();
			updatePosition( shadow );
			showIndicatorHideOthers( this );
		}.bind( vid ) );//what is the function of .bind(vid)? so that this points to the video
		vid.on( 'pause', function ( e ) {
			hideIndicator( this );
			clearTitle();
			insertPause();
		}.bind( vid ) );

		switch ( !!1 ) {
			//Element.before(node) => node will be inserted before Element;
			//this section may be moot when z-index is implemented.
			case ( location.hostname == 'www.youtube.com' ): vid.parent.parent.parent.before( vid.shaHost ); break; //so indicator is not hidden with native controls
			case ( location.hostname == 'www.amazon.com' ):
			case ( location.hostname == 'www.reddit.com' ):
			case ( /hbogo\./ ).test( location.hostname ): vid.parent.before( vid.shaHost ); break;
			default: vid.before( vid.shaHost );
		}
		let highestContainer = vid.highestContainer;
		if ( highestContainer ) highestContainer.prepend( vid.shaHost );
		else if ( vid.parentNode.prepend ) vid.parentNode.prepend( vid.shaHost );
		else vid.parentNode.append( vid.shaHost );

		return vid.shaHost;
	};
	HTMLVideoElement.prototype.toggleIndicator = function () {
		if ( !this.shaHost ) return this.createIndicator();
		let isHidden = this.shaHost.hidden; this.shaHost.hidden = this.shaHost.hidden !== true;
	};
	HTMLVideoElement.prototype.showRate = function () { return this.toggleIndicator() };
	Object.defineProperties( HTMLImageElement.prototype, {
		setAlign: {
			configurable: true, enumerable: true,
			value: function ( arg ) {
				//const arg = arguments[0];
				this.align = arg;
				switch ( arg ) {
					case `left`: this.style.cssText += `display:block; max-width:100%; margin: 0 auto 0 0;`; break;
					case `right`: this.style.cssText += `display:block; max-width: 100%; margin: 0 0 0 auto;`; break;
					case `center`:
					default: this.style.cssText += `margin:0 auto; max-width:100%; display:block;`;
				}
				return this;
			}
		}
	} );
}
