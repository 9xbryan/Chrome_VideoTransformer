'use strict';

import * as monkeypatch from "./lib/monkeypatch_prototypes/monkeypatch.mjs";
[ 'consoleColors', 'stringify', 'is', 'defer' ].forEach( patch => monkeypatch[ patch ]() );
if ( `undefined` == typeof globalThis.browser ) globalThis.browser = chrome;

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
			const {deltaLeft, deltaTop, deltaWidth, deltaHeight} = data;
			let specs = {left: left+deltaLeft, top: top+deltaTop, width: width+deltaWidth, height: height+deltaHeight}
			console.redBg(specs.stringify(4))
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
