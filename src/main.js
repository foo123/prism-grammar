/**
*
*   PrismGrammar
*   @version: @@VERSION@@
*
*   Transform a grammar specification in JSON format, into a syntax-highlighter for Prism
*   https://github.com/foo123/prism-grammar
*
**/


//
// parser factories
DEFAULTSTYLE = ""; DEFAULTERROR = "";
var PrismParser = Class(Parser, {
    constructor: function PrismParser( grammar, LOC ) {
        Parser.call(this, grammar, LOC);
    }
    
    ,tokenize: function( line, state, row ) {
        var self = this, stream = new Stream( line ),
            tokens = [], token, buf = [], id = null,
            just_content = function( token ) { return token.content; },
            maybe_content = function( token ) { return DEFAULTSTYLE === token.type ? token.content : token; }
        ;
        //state.line = row || 0;
        if ( stream.eol() ) state.line++;
        while ( !stream.eol() )
        {
            token = self.token( stream, state );
            if ( state.$actionerr$ )
            {
                if ( buf.length ) tokens = tokens.concat( map( buf, just_content ) );
                tokens.push( token.content );
                buf.length = 0; id = null;
            }
            else
            {
                if ( id !== token.name )
                {
                    tokens = tokens.concat( map( buf, maybe_content ) );
                    buf.length = 0; id = token.name;
                }
                buf.push( token );
            }
        }
        if ( buf.length ) tokens = tokens.concat( map( buf, maybe_content ) );
        buf.length = 0; id = null;
        stream.dispose();
        return tokens;
    }
});

function get_mode( grammar ) 
{
    var parser = new PrismParser(parse_grammar( grammar ), { 
            DEFAULT: DEFAULTSTYLE,
            ERROR: DEFAULTERROR,
            TYPE: 'type',
            TOKEN: 'content'
        }), 
        
        prism_highlighter, is_hooked = 0,
        
        $Prism$,
        
        highlighter$ = {
            'before-highlight': function( env ) {
                // use the custom parser for the grammar to highlight
                // hook only if the language matches
                if ( prism_highlighter.$parser && (prism_highlighter.$lang === env.language) )
                {
                    // avoid double highlight work, set code to ""
                    env._code = env.code;
                    env.code = "";
                }
            },
            
            'before-insert': function( env ) {
                if ( prism_highlighter.$parser && (prism_highlighter.$lang === env.language) )
                {
                    // re-set
                    env.code = env._code;
                    env._code = "";
                    //env._highlightedCode = env.highlightedCode;
                    // tokenize code and transform to prism-compatible tokens
                    env.highlightedCode = $Prism$.Token.stringify( 
                        prism_highlighter.$parser.parse(env.code, TOKENS|ERRORS|FLAT).tokens, 
                    env.language );
                }
            }
        };
    
    // return a plugin that can be hooked-unhooked to Prism under certain language conditions
    prism_highlighter = {
        $id: uuid("prism_grammar_highlighter")
        
        ,$parser: parser
        
        ,$lang: null
        
        ,hook: function( Prism, language ) {
            if ( is_hooked ) prism_highlighter.unhook();
            $Prism$ = Prism;
            prism_highlighter.$lang = language;
            for (var hook in highlighter$ )
            {
                if ( highlighter$[HAS](hook) )
                    $Prism$.hooks.add( hook, highlighter$[hook] );
            }
            is_hooked = 1;
        }
        
        ,unhook: function( ) {
            if ( is_hooked )
            {
                var prism_hooks = $Prism$.hooks.all, hook, this_hook;
                
                for (hook in highlighter$)
                {
                    if ( prism_hooks[HAS](hook) && highlighter$[HAS](hook) )
                    {
                        this_hook = prism_hooks[hook].indexOf( highlighter$[hook] );
                        if ( this_hook > -1 ) prism_hooks[hook].splice(this_hook, 1);
                    }
                }
                is_hooked = 0;
                prism_highlighter.$lang = null;
                $Prism$ = null;
            }
        }
        
        ,dispose: function( ) {
            prism_highlighter.unhook();
            if ( prism_highlighter.$parser ) prism_highlighter.$parser.dispose( );
            prism_highlighter.$parser = null;
            prism_highlighter.$lang = null;
        }
    };
    return prism_highlighter;
}


//
//  Prism Grammar main class
/**[DOC_MARKDOWN]
*
* ###PrismGrammar Methods
*
* __For node:__
*
* ```javascript
* PrismGrammar = require('build/prism_grammar.js').PrismGrammar;
* ```
*
* __For browser:__
*
* ```html
* <script src="build/prism_grammar.js"></script>
* ```
*
[/DOC_MARKDOWN]**/
var PrismGrammar = exports['@@MODULE_NAME@@'] = {
    
    VERSION: "@@VERSION@@",
    
    // clone a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `clone`
    *
    * ```javascript
    * cloned = PrismGrammar.clone( grammar [, deep=true] );
    * ```
    *
    * Clone (deep) a `grammar`
    *
    * Utility to clone objects efficiently
    [/DOC_MARKDOWN]**/
    clone: clone,
    
    // extend a grammar using another base grammar
    /**[DOC_MARKDOWN]
    * __Method__: `extend`
    *
    * ```javascript
    * extendedgrammar = PrismGrammar.extend( grammar, basegrammar1 [, basegrammar2, ..] );
    * ```
    *
    * Extend a `grammar` with `basegrammar1`, `basegrammar2`, etc..
    *
    * This way arbitrary `dialects` and `variations` can be handled more easily
    [/DOC_MARKDOWN]**/
    extend: extend,
    
    // pre-process a grammar (in-place)
    /**[DOC_MARKDOWN]
    * __Method__: `pre_process`
    *
    * ```javascript
    * PrismGrammar.pre_process( grammar );
    * ```
    *
    * This is used internally by the `PrismGrammar` Class `parse` method
    * In order to pre-process, in-place, a `JSON grammar` 
    * to transform any shorthand configurations to full object configurations and provide defaults.
    [/DOC_MARKDOWN]**/
    pre_process: pre_process_grammar,
    
    // parse a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `parse`
    *
    * ```javascript
    * parsedgrammar = PrismGrammar.parse( grammar );
    * ```
    *
    * This is used internally by the `PrismGrammar` Class
    * In order to parse a `JSON grammar` to a form suitable to be used by the syntax-highlighter.
    * However user can use this method to cache a `parsedgrammar` to be used later.
    * Already parsed grammars are NOT re-parsed when passed through the parse method again
    [/DOC_MARKDOWN]**/
    parse: parse_grammar,
    
    // get an ACE-compatible syntax-highlight mode from a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `getMode`
    *
    * ```javascript
    * mode = PrismGrammar.getMode( grammar );
    * ```
    *
    * This is the main method which transforms a `JSON grammar` into a syntax-highlighter for `Prism`.
    [/DOC_MARKDOWN]**/
    getMode: get_mode
};
