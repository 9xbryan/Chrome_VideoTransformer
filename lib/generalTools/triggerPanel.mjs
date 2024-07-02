/**
 * the DOM will be the central data storage.
 */

export function defineCustomElementPanel('tagName') {
	class Panel extends HTMLElement {
		static observedAttributes = [ "color", "size" ];
		constructor () {
			super();
			this._internals = this.attachInternals(); //to register psuedo-class, and selectable in css;
		}


		get collapsed() {
			return this._internals.states.has( "hidden" );
		}

		set collapsed( flag ) {
			if ( flag ) {
				// Existence of identifier corresponds to "true"
				this._internals.states.add( "hidden" );
			} else {
				// Absence of identifier corresponds to "false"
				this._internals.states.delete( "hidden" );
			}
		}


		connectedCallback() { //runs when an element is added to the DOM
			// Create a shadow root
			// The custom element itself is the shadow host
			const shadow = this.attachShadow( { mode: "open" } );

			// create the internal implementation
			const svg = document.createElementNS( "http://www.w3.org/2000/svg", "svg" );
			const circle = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"circle",
			);
			circle.setAttribute( "cx", "50" );
			circle.setAttribute( "cy", "50" );
			circle.setAttribute( "r", "50" );
			circle.setAttribute( "fill", this.getAttribute( "color" ) );
			svg.appendChild( circle );

			shadow.appendChild( svg );
		}

		connectedCallback() {
			console.log( "Custom element added to page." );
		}

		disconnectedCallback() {
			console.log( "Custom element removed from page." );
		}

		adoptedCallback() {
			console.log( "Custom element moved to new page." );
		}

		attributeChangedCallback( name, oldValue, newValue ) {
			console.log( `Attribute ${ name } has changed from ${ oldValue } to ${ newValue}.` );
		}
	}

	customElements.define( tagName, Panel );

}

export function createTriggerPanel() {
	const host = document.createElement('div');
}
