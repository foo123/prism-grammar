/**
*
*   PrismGrammar
*   @version: @@VERSION@@
*
*   Transform a grammar specification in JSON format, into a syntax-highlighter for Prism
*   https://github.com/foo123/prism-grammar
*   https://github.com/foo123/editor-grammar
*
**/


var 
isNode = !!(("undefined" !== typeof global) && ("[object global]" === toString.call(global))),
isBrowser = !!(!isNode && ("undefined" !== typeof navigator)),
isWorker = !!(isBrowser && ("function" === typeof importScripts) && (navigator instanceof WorkerNavigator)),
this_path = (function(isNode, isBrowser, isWorker) {
    // Get current filename/path
    var file = null, path = null, base = null, scripts;
    if ( isNode ) 
    {
        // http://nodejs.org/docs/latest/api/globals.html#globals_filename
        // this should hold the current file in node
        file = __filename; path = __dirname; base = __dirname;
    }
    else if ( isWorker )
    {
        // https://developer.mozilla.org/en-US/docs/Web/API/WorkerLocation
        // this should hold the current url in a web worker
        file = self.location.href; path = file.split('/').slice(0, -1).join('/');
    }
    else if ( isBrowser )
    {
        // get last script (should be the current one) in browser
        base = document.location.href.split('#')[0].split('?')[0].split('/').slice(0, -1).join('/');
        if ((scripts = document.getElementsByTagName('script')) && scripts.length)
        {
            file = scripts[scripts.length - 1].src;
            path = file.split('/').slice(0, -1).join('/');
        }
    }
    return { path: path, file: file, base: base };
})(isNode, isBrowser, isWorker),

// browser caches worker source file, even with reset/reload, try to not cache
NOCACHE = '?nocache=' + uuid('nonce') + '_' + (~~(1000*Math.random( ))),

$Prism$ = 'undefined' !== typeof Prism ? Prism : null;

//
// parser factories
var PrismParser = Class(Parser, {
    constructor: function PrismParser( grammar, DEFAULT ) {
        var self = this;
        Parser.call(self, grammar, "", "");
        self.$v$ = 'content';
        self.DEF = DEFAULT || self.$DEF;
        self.ERR = /*grammar.Style.error ||*/ self.$ERR;
    }
    
    ,tokenize: function( stream, mode, row, tokens ) {
        var self = this, token, buf = [], id = null, push = Array.prototype.push,
            raw_content = function( token ) { return token.content; },
            maybe_raw = function( token ) { return self.$DEF === token.type ? token.content : token; }
        ;
        tokens = tokens || [];
        //mode.state.line = row || 0;
        if ( stream.eol() ) { mode.state.line++; if ( mode.state.$blank$ ) mode.state.bline++; }
        else while ( !stream.eol() )
        {
            token = mode.parser.get( stream, mode );
            if ( mode.state.$actionerr$ )
            {
                if ( buf.length ) push.apply( tokens, map( buf, raw_content ) );
                tokens.push( token.content );
                buf.length = 0; id = null;
            }
            else
            {
                if ( id !== token.name )
                {
                    if ( buf.length ) push.apply( tokens, map( buf, maybe_raw ) );
                    buf.length = 0; id = token.name;
                }
                buf.push( token );
            }
        }
        if ( buf.length ) push.apply( tokens, map( buf, maybe_raw ) );
        buf.length = 0; id = null;
        return tokens;
    }
});


function esc_token( i, tokens )
{
    var t = tokens[i];
    if ( t.content ) t.content = esc_html( t.content, 1 );
    else t = esc_html( t, 1 );
    tokens[i] = t;
}

if ( isWorker ) onmessage = grammar_worker;

// worker factory
function grammar_worker( e )
{
    var msg = e ? e.data : null;
    if ( !msg ) return;
    if ( msg.init ) 
    {        
        var parser = grammar_worker.parser = new PrismGrammar.Parser( parse_grammar( msg.grammar ) );
        if ( msg.subgrammars )
        {
            var langs = Object.keys(msg.subgrammars);
            for(var i=0,l=langs.length; i<l; i++)
                parser.subparser( langs[i], new PrismGrammar.Parser( parse_grammar( msg.subgrammars[langs[i]] ) ) );
        }
    }
    else if ( msg.tokenize )
    {
        if ( grammar_worker.parser )
            postMessage( {tokenize:1, tokens:grammar_worker.parser.parse(msg.code, TOKENS|ERRORS|FLAT).tokens} );
    }
}
grammar_worker.parser = null;

function WorkerMirror( grammar, subgrammars )
{
    var self = this, worker = null, pending = [];
    worker = new Worker( this_path.file );
    worker.postMessage({init:1, grammar:grammar, subgrammars:subgrammars});
    worker.onMessage = function( e ) {
        if ( !pending || !pending.length ) return;
        var msg = e.data || {}, cb;
        if ( msg.tokenize )
        {
            cb = pending.shift( );
            cb( msg.tokens );
        }
    };
    
    self.tokenize = function( code, cb ) {
        if ( !worker ) return cb( null );
        pending.push( cb );
        worker.postMessage({tokenize:1, code:code});
    };
    
    self.dispose = function( ) {
        pending = null;
        if ( worker ) worker.terminate( );
        worker = null;
        return self;
    };
}

function get_mode( grammar, Prism ) 
{
    Prism = Prism || $Prism$; // pass Prism reference if not already available
    
    var PrismHighlighter, is_hooked = 0,
    
    highlighter$ = {
        'before-highlight': function( env ) {
            // use the custom parser for the grammar to highlight
            // hook only if the language matches
            if ( PrismHighlighter.$parser && (PrismHighlighter.language === env.language) )
            {
                // avoid double highlight work, set code to ""
                env._code = env.code;
                env.code = "";
            }
        },
        
        'before-insert': function( env ) {
            if ( PrismHighlighter.$parser && (PrismHighlighter.language === env.language) )
            {
                // re-set
                env.code = env._code;
                env._code = "";
                env.highlightedCode = Prism.Token.stringify(
                    PrismHighlighter.tokenize( env.code, PrismHighlighter.escapeHtml ),
                    env.language
                );
            }
        }
    };
    
    // return a plugin that can be hooked-unhooked to Prism under certain language conditions
    PrismHighlighter = {
         $id: uuid("prism_grammar_highlighter")
        
        ,$grammar: grammar
        ,$parser: new PrismGrammar.Parser( parse_grammar( grammar ) )
        ,$worker: null
        ,language: null
        // have escapeHtml flag true by default
        ,escapeHtml: true
        
        ,tokenize: function( code, escapeHtml, workerCb ) {
            var self = this;
            if ( 'function' === typeof workerCb )
            {
                // use async tokenization in worker
                if ( !self.$worker ) self.$worker = new WorkerMirror( self.$grammar, self.getSubgrammars() );
                self.$worker.tokenize( code, function( tokens ){
                    // html-escape code
                    if ( tokens && escapeHtml ) iterate( esc_token, 0, tokens.length-1, tokens );
                    workerCb( tokens );
                });
            }
            else
            {
                // tokenize code and transform to prism-compatible tokens
                var tokens = self.$parser.parse(code, TOKENS|ERRORS|FLAT).tokens;
                // html-escape code
                if ( escapeHtml ) iterate( esc_token, 0, tokens.length-1, tokens );
                return tokens;
            }
        }
        
        ,hook: function( language, prism ) {
            var self = this;
            if ( is_hooked ) self.unhook();
            if ( T_STR & get_type(prism) )
            {
                // arguments given in different order
                var tmp = language;
                language = prism;
                prism = tmp;
            }
            Prism = prism || Prism;
            self.language = language;
            for (var hook in highlighter$ )
            {
                if ( HAS.call(highlighter$,hook) )
                    Prism.hooks.add( hook, highlighter$[hook] );
            }
            is_hooked = 1;
        }
        
        ,unhook: function( prism ) {
            var self = this;
            Prism = prism || Prism;
            if ( is_hooked )
            {
                var prism_hooks = Prism.hooks.all, hook, this_hook;
                
                for (hook in highlighter$)
                {
                    if ( HAS.call(prism_hooks,hook) && HAS.call(highlighter$,hook) )
                    {
                        this_hook = prism_hooks[hook].indexOf( highlighter$[hook] );
                        if ( this_hook > -1 ) prism_hooks[hook].splice(this_hook, 1);
                    }
                }
                is_hooked = 0;
                self.language = null;
                //Prism = null;
            }
        }
        
        ,getSubgrammars: function( ) {
            var self = this, parser = self.$parser,
                langs = Object.keys(parser.$subgrammars),
                subgrammars = {};
            for(var i=0,l=langs.length; i<l; i++) subgrammars[langs[i]] = parser.$subgrammars[langs[i]].Mode.$grammar;
            return subgrammars;
        }
        ,submode: function( lang, mode ) {
            this.$parser.subparser( lang, mode.$parser );
        }
        
        ,dispose: function( ) {
            var self = this;
            self.unhook( );
            if ( self.$worker ) self.$worker.dispose( );
            if ( self.$parser ) self.$parser.dispose( );
            self.$parser = self.$worker = self.language = Prism = null;
        }
    };
    // store a reference to Mode here
    PrismHighlighter.$parser.Mode = PrismHighlighter;
    return PrismHighlighter;
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
* PrismGrammar = require('build/prism_grammar.js');
* ```
*
* __For browser:__
*
* ```html
* <script src="build/prism_grammar.js"></script>
* ```
*
[/DOC_MARKDOWN]**/
var PrismGrammar = {
    
    VERSION: "@@VERSION@@",
    
    // clone a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `clone`
    *
    * ```javascript
    * cloned_grammar = PrismGrammar.clone( grammar [, deep=true] );
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
    * extended_grammar = PrismGrammar.extend( grammar, basegrammar1 [, basegrammar2, ..] );
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
    * pre_processed_grammar = PrismGrammar.pre_process( grammar );
    * ```
    *
    * This is used internally by the `PrismGrammar` Class `parse` method
    * In order to pre-process a `JSON grammar` (in-place) to transform any shorthand configurations to full object configurations and provide defaults.
    * It also parses `PEG`/`BNF` (syntax) notations into full (syntax) configuration objects, so merging with other grammars can be easier if needed.
    [/DOC_MARKDOWN]**/
    pre_process: preprocess_and_parse_grammar,
    
    // parse a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `parse`
    *
    * ```javascript
    * parsed_grammar = PrismGrammar.parse( grammar );
    * ```
    *
    * This is used internally by the `PrismGrammar` Class
    * In order to parse a `JSON grammar` to a form suitable to be used by the syntax-highlighter.
    * However user can use this method to cache a `parsedgrammar` to be used later.
    * Already parsed grammars are NOT re-parsed when passed through the parse method again
    [/DOC_MARKDOWN]**/
    parse: parse_grammar,
    
    // get a Prism-compatible syntax-highlighter from a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `getMode`
    *
    * ```javascript
    * mode = PrismGrammar.getMode( grammar );
    * ```
    *
    * This is the main method which transforms a `JSON grammar` into a syntax-highlighter for `Prism`.
    [/DOC_MARKDOWN]**/
    getMode: get_mode,
    
    // make Parser class available
    /**[DOC_MARKDOWN]
    * __Parser Class__: `Parser`
    *
    * ```javascript
    * Parser = PrismGrammar.Parser;
    * ```
    *
    * The Parser Class used to instantiate a highlight parser, is available.
    * The `getMode` method will instantiate this parser class, which can be overriden/extended if needed, as needed.
    * In general there is no need to override/extend the parser, unless you definately need to.
    [/DOC_MARKDOWN]**/
    Parser: PrismParser
};
