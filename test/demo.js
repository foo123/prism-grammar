function prism_grammar_demo(code, langs)
{
    document.getElementById('editor-version').innerHTML = '1.2.0';
    document.getElementById('grammar-version').innerHTML = PrismGrammar.VERSION;
    var main_lang, main_mode;
    for(var i=0,l=langs.length; i<l; i++)
    {
        if ( 0 === i )
        {
            // main mode
            main_lang = langs[i].language;
            main_mode = PrismGrammar.getMode( langs[i].grammar );
        }
        else
        {
            // submodes
            main_mode.submode(langs[i].language, PrismGrammar.getMode( langs[i].grammar ));
        }
    }
    main_mode.escapeHtml = true; // whether to escape html code to output properly, Prism.version 1.2.0+
    main_mode.hook( main_lang, Prism );
    Prism.highlightElement( code );
}