function prism_grammar_demo(code, lang, grammar, escapeHtml)
{
    document.getElementById('editor-version').innerHTML = '1.2.0';
    document.getElementById('grammar-version').innerHTML = PrismGrammar.VERSION;
    var mode = PrismGrammar.getMode( grammar );
    mode.escapeHtml = true; // whether to escape html code to output properly, Prism.version 1.2.0+
    mode.hook( lang, Prism );
    Prism.highlightElement( code );
}