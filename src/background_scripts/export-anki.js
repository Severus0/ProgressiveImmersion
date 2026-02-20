import { browser } from '../config';

export async function exportToAnki() {
    const data = await browser.storage.local.get( [
        'dictionary',
        'origin',
        'target',
        'originNativeName',
        'targetNativeName'
    ] );

    const {
        dictionary = {},
        origin,
        target,
        originNativeName,
        targetNativeName
    } = data;

    if ( !origin || !target || !dictionary[origin]?.[target] ) {
        return;
    }

    const sourceLang = originNativeName ?? origin;
    const targetLang = targetNativeName ?? target;
    const deckName = `Progressive Immersion::${sourceLang} -> ${targetLang}`;

    const headers = [
        `#deck:${deckName}`,
        '#notetype:Basic (and reversed card)',
        '#separator:;',
        '#html:true',
        '#tags:ProgressiveImmersion',
        '#columns:Front;Back'
    ].join( '\n' );

    const wordEntries = Object.entries( dictionary[origin][target] );
    
    const cards = wordEntries
        .filter( ( [ src, trn ] ) => src.trim().toLowerCase() !== trn.trim().toLowerCase() )
        .map( ( [ src, trn ] ) => {
            const cleanSrc = src.replace( /;/g, ',' );
            const cleanTrn = trn.replace( /;/g, ',' );
            return `${cleanTrn};${cleanSrc}`;
        } )
        .join( '\n' );

    if ( !cards ) {
        return;
    }

    const fileContent = `${headers}\n${cards}`;

    const dataUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent( fileContent );
    const filename = `progressive-immersion-${origin}-${target}.txt`;

    await browser.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: true
    });
}
