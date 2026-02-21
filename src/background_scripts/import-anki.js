import { browser } from '../config';

export async function importFromAnki ( text, request ) {
	const data = await browser.storage.local.get( [ 'dictionary', 'origin', 'target' ] );
	const origin = request?.origin ?? data.origin;
	const target = request?.target ?? data.target;
	const dictionary = data.dictionary ?? {};

	if ( !origin || !target ) {
		return 0;
	}

	dictionary[origin] ??= {};
	dictionary[origin][target] ??= {};

	const currentDict = dictionary[origin][target];

	const separator = text.includes( '#separator:;' ) ? ';' : '\t';
	const lines = text.split( /[\r\n]+/ );

	let addedCount = 0;

	for ( const line of lines ) {
		if ( line.startsWith( '#' ) || !line.trim() ) {
			continue;
		}

		const parts = line.split( separator );

		if ( parts.length >= 2 ) {
			const foreignWord = parts[0].trim().toLowerCase();
			const nativeWord = parts[1].trim().toLowerCase();

			if ( foreignWord && nativeWord ) {
				currentDict[nativeWord] = foreignWord;
				addedCount++;
			}
		}
	}

	if ( addedCount > 0 ) {
		await browser.storage.local.set({ dictionary });
	}

	return addedCount;
}