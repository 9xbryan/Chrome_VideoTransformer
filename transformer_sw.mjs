'use strict';
// const requireWorker = new Worker( "./lib/standard/require.js" ); //!doesn't work
// const myWorker = new SharedWorker( "worker.js" ); //!doesn't work
// importScripts('./lib/standard/require.js'); //!importScripts() is not allowed
import { requirejs, require, define } from "./lib/standard/require.js"; //green: modified
// const require = REQUIREJS.require;
// require( { baseUrl: "./" }, [ "require", "simple", "anon/blue", "func", "anon/green" ],
// function ( require, simple, blue, func, green ) {
// 		postMessage( simple.color );
// 		postMessage( green.name );
// 		postMessage( func() );
// 		postMessage( blue.name );
// 	}
// );
requirejs.config( {
	//By default load any module IDs from js/lib
	baseUrl: './',
	//except, if the module ID starts with "app",
	//load it from the js/app directory. paths
	//config is relative to the baseUrl, and
	//never includes a ".js" extension since
	//the paths config could be for a directory.
	paths: {
		action: './actionPopup',
		icons: './icons',
		monkeypatch: 'lib/monkeypatch_prototypes',
		options:'./options'
	}
} );

/**
 * !!doesn't work, but synchronous importing is not important at this time in the background service worker.
 */
// Start the main app logic.
// requirejs( [ 'monkeypatch/monkeypatch' ],
// 	function ( monkeypatch ) {
// 		monkeypatch[ 'consoleColors' ]();
// 		//jQuery, canvas and the app/sub module are all
// 		//loaded and can be used here now.
// 	} );

import * as monkeypatch from "./lib/monkeypatch_prototypes/monkeypatch.mjs";
[ 'consoleColors', 'stringify', 'is', 'defer' ].forEach( patch => monkeypatch[ patch ]() );
if ( `undefined` == typeof globalThis.browser ) globalThis.browser = chrome;
var displays;
browser.runtime.onMessage.addListener( messageHandler );
async function messageHandler(msg, sender, sendResponse) {
	// const tabId = sender.tab.id;
	const {windowId, id: tabId} = sender.tab
	const {action, data} = msg;
	let tab, win = await browser.windows.getCurrent();
	const {left,top,width,height} = win;
	// console.greenBg( { left, top, width, height }.stringify(4))
	// console.blueBg(msg.stringify(4), sender.stringify(4))
	switch(action) {
		case 'updateWindowSizeLocation':
			// displays ??= await browser.system.display.getInfo();
			const { workArea } = await getDisplay(win);
			const {deltaLeft, deltaTop, deltaWidth, deltaHeight} = data;
			let specs = {left: Math.min(Math.max(left+deltaLeft, workArea.left), workArea.left + workArea.width), top: Math.min(Math.max(top+deltaTop, workArea.top), workArea.top + workArea.height), width: Math.min(width+deltaWidth, workArea.width), height: Math.min(height+deltaHeight, workArea.height)}
			console.redBg(specs.stringify(4), deltaWidth, deltaHeight)
			browser.windows.update( browser.windows.WINDOW_ID_CURRENT, specs ); break;
			// win = browser.windows.getCurrent();
		case 'popout':
			console.log('PopOut');
			tab = await getCurrentTab(); break;
			// setViewPort(tab, 'popup', data); break;
		case 'popup':
			console.log( 'Popup' );
			tab = await getCurrentTab();
		setViewPort(tab, 'popup', data); break;
	}
}

async function getDisplay( win ) {
	/**
	 * this works. Will be used to resize/relocate based on the originating monitor.
	 * sometimes the origin (top, left) can be outside of both monitor, need to handle this case too
	 */
	if ( win.windowId ) win = await browser.windows.get( win.windowId ); //this is when tab is passed in
	displays ??= await ( browser.system || chrome.system ).display.getInfo();
	const { left: l, top: t, width: w, height: h } = win;
	const r = l + w, b = t + h;
	const floor = Math.floor;
	return (
		checkCorners( t + floor( h / 2 ), l + floor( w / 2 ), 'center of page' ) ||
		checkCorners( t, l, 'top-left corner' ) ||
		checkCorners( b, r, 'bottom-right corner' ) ||
		checkCorners( b, l, 'bottom-left corner' ) ||
		checkCorners( t, r, 'top-right corner' ) ||
		displays[ 0 ] //defaults to primary monitor if all else failed
	);

	function checkCorners( horizontalBorder, verticalBorder, note ) {
		for ( let index in displays ) {
			displays[ index ].index = index;
			const { left, top, width, height } = displays[ index ].workArea;
			const right = left + width, bottom = top + height;
			// let winHorizontalBorder = ( top + displayOffset.top <= horizontalBorder && horizontalBorder < bottom ) ? index : NaN;
			let winHorizontalBorder = ( top <= horizontalBorder && horizontalBorder < bottom ) ? index : NaN;
			// let winVerticalBorder = ( left + displayOffset.left <= verticalBorder && verticalBorder < right ) ? index : NaN;
			let winVerticalBorder = ( left  <= verticalBorder && verticalBorder < right ) ? index : NaN;
			if ( winVerticalBorder === winHorizontalBorder ) return displays[ index ];
		}
		return null;
	}
}

async function getCurrentTab() {
	const [ tab ] = await browser.tabs.query( { active: true, currentWindow: true } );
	return tab;
}
async function setViewPort( tab, desiredSpecs, forced, targetUrl, desiredState ) {
	/**
	 * type: expecting "normal", "popup", "panel" (deprecated), "app" (deprecated), or "devtools"
	 * state: "normal", "minimized", "maximized", "fullscreen", "lock-fullscreen" (ChomeOS usage only)
	 */
	console.violetBg('setViewPort()');
	return new Promise( async ( resolve, reject ) => {
		if ( !tab || !tab.windowId ) return resolve( 'no tab' );
		let win = await browser.windows.get( tab.windowId ).catch( ( e ) => { console.log( "caught error at get: ", e ); reject( 'cant find window of desiredTab' ) } );
		desiredSpecs ??= 'popup';
		let desiredType = desiredSpecs.is( 'Object' ) ? desiredSpecs.type : desiredSpecs;
		if ( win.type == desiredType && !forced ) return resolve( win ); // expecting type "normal", "popup", "panel", "app", or "devtools"
		const { top: t, left: l, width: w, height: h, state, windowState, type } = win;
		let queryOptions = { type: desiredType, focused: true, state: desiredState ?? state };
		if ( targetUrl ) queryOptions.url = targetUrl;
		else queryOptions.tabId = tab.id;
		if ( desiredState ? `normal` != desiredState : `normal` != state ) queryOptions.state = desiredState ?? state ?? windowState ?? 'normal';
		else {
			queryOptions.top = t;
			queryOptions.left = l;
			queryOptions.width = w;
			queryOptions.height = h;
		}
		let finalSpecs = desiredSpecs.is( 'Object' ) ? { ...queryOptions, ...desiredSpecs } : queryOptions;
		if ( `minimized maximized fullscreen`.includes( finalSpecs.state ) ) {

			delete finalSpecs.left; //these need to be in separate lines in "use strict" mode;
			delete finalSpecs.top;
			delete finalSpecs.width;
			delete finalSpecs.height;
			console.red( finalSpecs.stringify( 4 ) );
		} //these needed to be deleted if the specific states are specified, else browser will throw error.
		return await browser.windows.create( finalSpecs ).then( async newWindow => {
			delete finalSpecs.tabId; delete finalSpecs.type;
			let newW = await browser.windows.update( newWindow.id, finalSpecs ) //required to accurately set height in windows, windows will reduce height when created;
			// addToWinMap( newW, newW.id ); //to remove tab.windowId? or to switch to addToPopMap?
			return resolve( newW );
		} ).catch( e => { console.log( "caught error at browser.windows.create:", e ); return reject( e ) } );;
	} ).catch( e => { return e } );
}
