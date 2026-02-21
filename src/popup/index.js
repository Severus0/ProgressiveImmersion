import {
	DEFAULT_UPDATE_FREQUENCY,
	NEVER_UPDATE_FREQUENCY,
	browser
} from '../config';

document.getElementById( 'settingsButton' ).addEventListener( 'click', () => {
	browser.runtime.openOptionsPage();
});

// ON/OFF

let state;
browser.storage.local.get( 'state' ).then( ( value ) => {
	state = value.state;
	if ( state === undefined ){
		state = false;
		browser.storage.local.set({ state: state });
	}

	document.getElementById( 'onSwitch' ).checked = state;
	updateBadgeState();
});

function updateBadgeState (){
	if ( state ){
		browser.action.setBadgeText({ text: 'On' });
		browser.action.setBadgeBackgroundColor({ color: 'green' });
	} else {
		browser.action.setBadgeText({ text: 'Off' });
		browser.action.setBadgeBackgroundColor({ color: 'red' });
	}
}

document.getElementById( 'onSwitch' ).addEventListener( 'click', () => {
	state = document.getElementById( 'onSwitch' ).checked;
	updateBadgeState();
	browser.storage.local.set({ state: state });
});


// Update Slider

browser.storage.local.get( 'updateFrequency' ).then( ( value ) => {
	const freq = ( value.updateFrequency !== undefined ) ? value.updateFrequency : DEFAULT_UPDATE_FREQUENCY;
	document.getElementById( 'updateSlider' ).value = freq;
	if ( freq >= NEVER_UPDATE_FREQUENCY ) {
		document.getElementById( 'updateSliderText' ).innerHTML = 'New words: Never';
	} else {
		document.getElementById( 'updateSliderText' ).innerHTML = `New words every ${freq} hours`;
	}

	if ( value.updateFrequency === undefined ) {
		browser.storage.local.set({ updateFrequency: DEFAULT_UPDATE_FREQUENCY });
	}
});

document.getElementById( 'updateSlider' ).oninput = () => {
	const updateFrequency = parseFloat( document.getElementById( 'updateSlider' ).value );
	if ( updateFrequency >= NEVER_UPDATE_FREQUENCY ) {
		document.getElementById( 'updateSliderText' ).innerHTML = 'New words: Never';
	} else {
		document.getElementById( 'updateSliderText' ).innerHTML = `New words every ${updateFrequency.toPrecision( 3 )} hours`;
	}

	browser.storage.local.set({ updateFrequency: updateFrequency });
};


// Language Selection

browser.storage.local.get( 'originNativeName' ).then( ( value ) => {
	document.getElementById( 'originButton' ).innerHTML = value.originNativeName;
});

browser.storage.local.get( 'targetNativeName' ).then( ( value ) => {
	document.getElementById( 'targetButton' ).innerHTML = value.targetNativeName;
});