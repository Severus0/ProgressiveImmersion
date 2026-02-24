import { browser } from '../config';

export async function exportToAnki( origin, target, originName, targetName ) {
    const value = await browser.storage.local.get( 'dictionary' );
    const dictionary = value.dictionary ?? {};

    const srcName = originName || origin;
    const tgtName = targetName || target;

    const deckName = `Progressive Immersion::${originName} -> ${targetName}`;

    let content = '';
    content += `#deck:${deckName}\n`;
    content += '#notetype:Basic (and reversed card)\n';
    content += '#separator:;\n';
    content += '#html:true\n';
    content += '#tags:ProgressiveImmersion\n';
    content += '#columns:Front;Back\n';

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
        alert( "No words found to export for this dictionary." );
        return;
    }

    const blob = new Blob( [ content ], { type: 'text/plain;charset=utf-8' } );
    const url = URL.createObjectURL( blob );
    const filename = `progressive-immersion-${origin}-${target}.txt`;

    await browser.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
    });
}

export async function importFromAnki( text, origin, target ) {
    const data = await browser.storage.local.get( 'dictionary' );
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
        await browser.storage.local.set( { dictionary } );
    }

    return addedCount;
}
