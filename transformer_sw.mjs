'use strict';

import * as monkeypatch from "./lib/monkeypatch_prototypes/monkeypatch.mjs";
[ 'consoleColors', 'stringify', 'is', 'defer' ].forEach( patch => monkeypatch[ patch ]() );



// if ( `undefined` == typeof globalThis.browser ) globalThis.browser = chrome;

(async function initialize(browser) {
	var displays;
	// browser.runtime.onInstalled.addListener(installedHandler);
	browser.runtime.onMessage.addListener( messageHandler );
	async function executeScripts() {
		let results = await browser.scripting.executeScript({
			target: {},

		})
	}
	// var rule1 = {
	// 	conditions: [
	// 		new chrome.declarativeContent.PageStateMatcher( {
	// 			pageUrl: { schemes: [ 'https' ] },
	// 			css: [ "video" ]
	// 		} )
	// 	],
	// 	actions: [ chrome.declarativeContent.requestContentScript( {
	// 		allFrames: true,
	// 		css: [ 'transformer.css' ],
	// 		js: [ 'transformer_cs.js' ],
	// 		matchAboutBlank: false
	// 	} ) ]
	// };
	// function installedHandler( details ) {
	// 	//Rules persist across browsing sessions; therefore, during extension installation time you should first use removeRules to clear previously installed rules and then use addRules to register new ones.

	// 	chrome.declarativeContent.onPageChanged.removeRules( undefined, function () {
	// 		chrome.declarativeContent.onPageChanged.addRules( [ rule1 ] );
	// 	} );
	// }
	async function messageHandler( msg, sender, sendResponse ) {
		// const tabId = sender.tab.id;
		const { windowId, id: tabId } = sender.tab
		const { action, data } = msg;
		let tab, win = await browser.windows.getCurrent();
		const { left, top, width, height } = win;
		// console.greenBg( { left, top, width, height }.stringify(4))
		// console.blueBg(msg.stringify(4), sender.stringify(4))
		switch ( action ) {
			case 'updateWindowSizeLocation':
				sendResponse({message: 'recieved'});
				const { workArea } = await getDisplay( win );
				const { deltaLeft, deltaTop, deltaWidth, deltaHeight } = data;
				let specs = { left: Math.min( Math.max( left + deltaLeft, workArea.left ), workArea.left + workArea.width ), top: Math.min( Math.max( top + deltaTop, workArea.top ), workArea.top + workArea.height ), width: Math.min( width + deltaWidth, workArea.width ), height: Math.min( height + deltaHeight, workArea.height ) }
				console.redBg( specs.stringify( 4 ), deltaWidth, deltaHeight )
				browser.windows.update( browser.windows.WINDOW_ID_CURRENT, specs ); break;
			// win = browser.windows.getCurrent();
			case 'popout':
				console.log( 'PopOut' );
				tab = await getCurrentTab(); break;
			// setViewPort(tab, 'popup', data); break;
			case 'popup':
				console.log( 'Popup' );
				tab = await getCurrentTab();
				setViewPort( tab, 'popup', data ); break;
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
				let winVerticalBorder = ( left <= verticalBorder && verticalBorder < right ) ? index : NaN;
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
		console.violetBg( 'setViewPort()' );
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
	// let rule2 = {
	// 	conditions: [
	// 		new chrome.declarativeContent.PageStateMatcher( {
	// 			pageUrl: { hostSuffix: '.google.com', schemes: [ 'https' ] },
	// 			css: [ "input[type='password']" ]
	// 		} )
	// 	],
	// 	actions: [ new chrome.declarativeContent.ShowAction(), new chrome.declarativeContent.setIcon() ]
	// };

})(globalThis.browser || chrome);
