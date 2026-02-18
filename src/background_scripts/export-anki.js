import { browser } from '../config';

export async function exportToAnki() {
    // 1. Get Dictionary Data
    const value = await browser.storage.local.get( [
        'dictionary', 
        'origin', 
        'target', 
        'originNativeName', 
        'targetNativeName'
    ] );
    
    const dictionary = value.dictionary ?? {};
    const origin = value.origin;
    const target = value.target;

    // SECURITY: Helper to prevent CSV breaking and HTML injection
    // 1. Replace semicolons (separator)
    // 2. Replace newlines (record breaking)
    // 3. Escape HTML tags ( < > ) to prevent XSS or broken card rendering
    const sanitize = ( text ) => {
        if ( !text ) return "";
        return text
            .replace( /;/g, ',' )
            .replace( /(\r\n|\n|\r)/g, ' ' )
            .replace( /</g, '&lt;' )
            .replace( />/g, '&gt;' );
    };

    // SECURITY: Sanitize deck names to prevent Header Injection (newlines in names)
    // Result: "Progressive Immersion::English -> Spanish"
    const sourceLangName = sanitize( value.originNativeName || origin || "Source" );
    const targetLangName = sanitize( value.targetNativeName || target || "Target" );
    
    const deckName = `Progressive Immersion::${sourceLangName} -> ${targetLangName}`;

    // 3. Build the Content
    let content = '';
    
    // --- ANKI HEADERS ---
    content += `#deck:${deckName}\n`;
    content += `#notetype:Basic (and reversed card)\n`;
    content += `#separator:;\n`;
    content += `#html:true\n`;
    content += `#tags:ProgressiveImmersion\n`;
    
    // Mapping: Front = Foreign Word, Back = Native Meaning
    // This allows Anki to handle duplicate detection via the Foreign Word (Column 1)
    content += `#columns:Front;Back\n`;

    let hasWords = false;

    // 4. Generate Cards
    if ( origin && target && dictionary[origin] && dictionary[origin][target] ) {
        for ( const [ source, translation ] of Object.entries( dictionary[origin][target] ) ) {
            
            // If the source and translation are identical (case-insensitive), skip.
            // This prevents "through"->"through" cards.
            if ( source.trim().toLowerCase() === translation.trim().toLowerCase() ) {
                continue;
            }

            hasWords = true;
            
            const nativeWord = sanitize( source );       // e.g. "Cat"
            const foreignWord = sanitize( translation ); // e.g. "Gato"

            // EXPORT FORMAT: Foreign ; Native
            content += `${foreignWord};${nativeWord}\n`;
        }
    }

    // Fallback: Dump everything if specific language pair isn't found
    if ( !hasWords ) {
        for ( const org in dictionary ) {
            for ( const tgt in dictionary[org] ) {
                for ( const [ source, translation ] of Object.entries( dictionary[org][tgt] ) ) {
                    
                    // Skip 1:1 matches in fallback loop too
                    if ( source.trim().toLowerCase() === translation.trim().toLowerCase() ) {
                        continue;
                    }

                    content += `${sanitize( translation )};${sanitize( source )}\n`;
                }
            }
        }
    }

    if ( content.trim() === '' ) {
        console.warn( "No words to export (or all words were filtered out as duplicates)" );
        return;
    }

    // 5. Download (Manifest V3 Safe)
    const base64Content = btoa( unescape( encodeURIComponent( content ) ) );
    const dataUrl = `data:text/plain;charset=utf-8;base64,${base64Content}`;

    // Update filename to include both ISO codes
    const filename = `progressive-immersion-${origin || 'src'}-${target || 'tgt'}.txt`;

    await browser.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: true
    });
}
