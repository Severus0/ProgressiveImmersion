import { browser } from '../config';

export async function exportToAnki( request ) {
    const value = await browser.storage.local.get( [
        'dictionary',
        'originNativeName',
        'targetNativeName'
    ] );

    const origin = request?.origin ?? 'en';
    const target = request?.target ?? 'es';
    const dictionary = value.dictionary ?? {};

    const sourceLangName = request?.originNativeName ?? value.originNativeName ?? "Source";
    const targetLangName = request?.targetNativeName ?? value.targetNativeName ?? "Target";

    const deckName = `Progressive Immersion::${sourceLangName} -> ${targetLangName}`;

    let content = '';

    content += `#deck:${deckName}\n`;
    content += `#notetype:Basic (and reversed card)\n`;
    content += `#separator:;\n`;
    content += `#html:true\n`;
    content += `#tags:ProgressiveImmersion\n`;
    content += `#columns:Front;Back\n`;

    let hasWords = false;

    if ( dictionary[origin] && dictionary[origin][target] ) {
        for ( const [ source, translation ] of Object.entries( dictionary[origin][target] ) ) {

            if ( source.trim().toLowerCase() === translation.trim().toLowerCase() ) {
                continue;
            }

            hasWords = true;
            const nativeWord = source.replaceAll( ';', ',' ).replace( /[\r\n]+/g, ' ' );
            const foreignWord = translation.replaceAll( ';', ',' ).replace( /[\r\n]+/g, ' ' );

            content += `${foreignWord};${nativeWord}\n`;
        }
    }

    if ( !hasWords ) {
        return;
    }

    const filename = `progressive-immersion-${origin}-${target}.txt`;
    let url;

    if ( typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' ) {
        const blob = new Blob( [ content ], { type: 'text/plain;charset=utf-8' } );
        url = URL.createObjectURL( blob );
    } else {
        url = 'data:text/plain;charset=utf-8,' + encodeURIComponent( content );
    }

    await browser.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
    });
}
