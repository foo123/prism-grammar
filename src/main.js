    
    //
    //  Prism Grammar main class
    /**[DOC_MARKDOWN]
    *
    * ###PrismGrammar Methods
    *
    * __For node with dependencies:__
    *
    * ```javascript
    * PrismGrammar = require('build/prism_grammar.js').PrismGrammar;
    * // or
    * PrismGrammar = require('build/prism_grammar.bundle.js').PrismGrammar;
    * ```
    *
    * __For browser with dependencies:__
    *
    * ```html
    * <script src="../build/prism_grammar.bundle.js"></script>
    * <!-- or -->
    * <script src="../build/classy.js"></script>
    * <script src="../build/regexanalyzer.js"></script>
    * <script src="../build/prism_grammar.js"></script>
    * <script> // PrismGrammar.getMode(..) , etc.. </script>
    * ```
    *
    [/DOC_MARKDOWN]**/
    DEFAULTSTYLE = -1;
    DEFAULTERROR = -1;
    var self = {
        
        VERSION : "@@VERSION@@",
        
        // extend a grammar using another base grammar
        /**[DOC_MARKDOWN]
        * __Method__: *extend*
        *
        * ```javascript
        * extendedgrammar = PrismGrammar.extend(grammar, basegrammar1 [, basegrammar2, ..]);
        * ```
        *
        * Extend a grammar with basegrammar1, basegrammar2, etc..
        *
        * This way arbitrary dialects and variations can be handled more easily
        [/DOC_MARKDOWN]**/
        extend : extend,
        
        // parse a grammar
        /**[DOC_MARKDOWN]
        * __Method__: *parse*
        *
        * ```javascript
        * parsedgrammar = PrismGrammar.parse(grammar);
        * ```
        *
        * This is used internally by the PrismGrammar Class
        * In order to parse a JSON grammar to a form suitable to be used by the syntax-highlight parser.
        * However user can use this method to cache a parsedgrammar to be used later.
        * Already parsed grammars are NOT re-parsed when passed through the parse method again
        [/DOC_MARKDOWN]**/
        parse : parseGrammar,
        
        // get an ACE-compatible syntax-highlight mode from a grammar
        /**[DOC_MARKDOWN]
        * __Method__: *getMode*
        *
        * ```javascript
        * mode = PrismGrammar.getMode(grammar);
        * ```
        *
        * This is the main method which transforms a JSON grammar into a syntax-highlighter for Prism.
        [/DOC_MARKDOWN]**/
        getMode : getMode
    };
