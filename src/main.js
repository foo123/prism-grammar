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
DEFAULTSTYLE = "";
DEFAULTERROR = "";
var Parser = Class({
    constructor: function Parser( grammar, LOC ) {
        var self = this;
        self.DEF = LOC.DEFAULT;
        self.ERR = LOC.ERROR;
        
        self.Tokens = grammar.Parser || [];
        self.cTokens = grammar.cTokens.length ? grammar.cTokens : null;
        self.Style = grammar.Style;
    }
    
    ,ERR: null
    ,DEF: null
    ,cTokens: null
    ,Tokens: null
    ,Style: null

    ,dispose: function( ) {
        var self = this;
        self.ERR = null;
        self.DEF = null;
        self.cTokens = null;
        self.Tokens = null;
        self.Style = null;
        return self;
    }
    
    // Prism compatible
    ,parse: function( code ) {
        code = code || "";
        var self = this, lines = code.split(newline_re), l = lines.length, i, tokens = [], data;
        data = { state: new State( ), tokens: null };
        
        for (i=0; i<l; i++)
        {
            data = self.getLineTokens(lines[i], data.state, i);
            tokens = tokens.concat(data.tokens);
            if (i+1<l) tokens.push("\n");
        }
        return tokens;
    }
    
    // Prism compatible
    ,getLineTokens: function( line, state, row ) {
        
        var self = this, i, rewind, rewind2, ci,
            tokenizer, interleavedCommentTokens = self.cTokens, tokens = self.Tokens, numTokens = tokens.length, 
            prismTokens, token, type, style, currentError = null,
            stream, stack, Style = self.Style, DEFAULT = self.DEF, ERROR = self.ERR
        ;
        
        prismTokens = []; 
        stream = new Stream( line );
        stack = state.stack;
        token = { type: null, content: "" };
        type = null;
        style = null;
        
        // if EOL tokenizer is left on stack, pop it now
        if ( stream.sol() && !stack.isEmpty() && T_EOL === stack.peek().tt ) 
        {
            stack.pop();
        }
        
        while ( !stream.eol() )
        {
            rewind = 0;
            
            if ( DEFAULT === style || ERROR === style )
            {
                if ( token.type ) prismTokens.push( token );
                prismTokens.push( stream.cur(1) );
                token = { type: null, content: "" };
            }
            else if ( style && style !== token.type )
            {
                if ( token.type ) prismTokens.push( token );
                token = { type: style, content: stream.cur(1) };
            }
            else if ( token.type )
            {
                token.content += stream.cur(1);
            }
            style = false;
            
            // check for non-space tokenizer before parsing space
            if ( (stack.isEmpty() || (T_NONSPACE !== stack.peek().tt)) && stream.spc() )
            {
                state.t = type = DEFAULT;
                style = DEFAULT;
                continue;
            }
            
            while ( !stack.isEmpty() && !stream.eol() )
            {
                if ( interleavedCommentTokens )
                {
                    ci = 0; rewind2 = 0;
                    while ( ci < interleavedCommentTokens.length )
                    {
                        tokenizer = interleavedCommentTokens[ci++];
                        state.t = type = tokenizer.get(stream, state);
                        if ( false !== type )
                        {
                            style = Style[type] || DEFAULT;
                            rewind2 = 1;
                            break;
                        }
                    }
                    if ( rewind2 )
                    {
                        rewind = 1;
                        break;
                    }
                }
            
                tokenizer = stack.pop();
                state.t = type = tokenizer.get(stream, state);
            
                // match failed
                if ( false === type )
                {
                    // error
                    if ( tokenizer.ERR || tokenizer.REQ )
                    {
                        // empty the stack
                        stack.empty('sID', tokenizer.sID);
                        // skip this character
                        stream.nxt();
                        // generate error
                        state.t = type = ERROR;
                        style = ERROR;
                        currentError = tokenizer.err();
                        rewind = 1;
                        break;
                    }
                    // optional
                    else
                    {
                        style = false;
                        continue;
                    }
                }
                // found token (not empty)
                else if ( true !== type )
                {
                    style = Style[type] || DEFAULT;
                    // action error
                    if ( tokenizer.ACTER )
                    {
                        // empty the stack
                        stack.empty('sID', tokenizer.sID);
                        // generate error
                        state.t = type = ERROR;
                        style = ERROR;
                        currentError = tokenizer.err();
                    }
                    rewind = 1;
                    break;
                }
            }
            
            if ( rewind ) continue;
            if ( stream.eol() ) break;
            
            for (i=0; i<numTokens; i++)
            {
                tokenizer = tokens[i];
                state.t = type = tokenizer.get(stream, state);
                
                // match failed
                if ( false === type )
                {
                    // error
                    if ( tokenizer.ERR || tokenizer.REQ )
                    {
                        // empty the stack
                        stack.empty('sID', tokenizer.sID);
                        // skip this character
                        stream.nxt();
                        // generate error
                        state.t = type = ERROR;
                        style = ERROR;
                        currentError = tokenizer.err();
                        rewind = 1;
                        break;
                    }
                    // optional
                    else
                    {
                        style = false;
                        continue;
                    }
                }
                // found token (not empty)
                else if ( true !== type )
                {
                    style = Style[type] || DEFAULT;
                    // action error
                    if ( tokenizer.ACTER )
                    {
                        // empty the stack
                        stack.empty('sID', tokenizer.sID);
                        // generate error
                        state.t = type = ERROR;
                        style = ERROR;
                        currentError = tokenizer.err();
                    }
                    rewind = 1;
                    break;
                }
            }
            
            if ( rewind ) continue;
            if ( stream.eol() ) break;
            
            // unknown, bypass
            stream.nxt();
            state.t = type = DEFAULT;
            style = DEFAULT;
        }
        
        if ( DEFAULT === style || ERROR === style )
        {
            if ( token.type ) prismTokens.push( token );
            prismTokens.push( stream.cur(1) );
        }
        else if ( style && style !== token.type )
        {
            if ( token.type ) prismTokens.push( token );
            prismTokens.push( { type: style, content: stream.cur(1) } );
        }
        else if ( token.type )
        {
            token.content += stream.cur(1);
            prismTokens.push( token );
        }
        token = null; //{ type: null, content: "" };
        
        return { state: state, tokens: prismTokens };
    }
});

function get_mode( grammar ) 
{
    var parser = new Parser( parse_grammar( grammar ), { 
            DEFAULT: DEFAULTSTYLE,
            ERROR: DEFAULTERROR
        }), _Prism, isHooked = 0, hookedLanguage = null, 
        
        thisHooks = {
            'before-highlight': function( env ) {
                // use the custom parser for the grammar to highlight
                // hook only if the language matches
                if ( hookedLanguage === env.language )
                {
                    // avoid double highlight work, set code to ""
                    env._code = env.code;
                    env.code = "";
                    //env.parser = parser;
                }
            },
            
            'before-insert': function( env ) {
                if ( hookedLanguage === env.language )
                {
                    // re-set
                    env.code = env._code;
                    env._code = "";
                    //env._highlightedCode = env.highlightedCode;
                    // tokenize code and transform to prism-compatible tokens
                    env.highlightedCode = _Prism.Token.stringify( parser.parse(env.code), env.language );
                }
            }
        };
    
    // return a plugin that can be hooked-unhooked to Prism under certain language conditions
    return {
        hook: function( Prism, language ) {
            if ( !isHooked )
            {
                _Prism = Prism;
                hookedLanguage = language;
                for (var hookname in thisHooks )
                {
                    if ( thisHooks[HAS](hookname) )
                        _Prism.hooks.add( hookname, thisHooks[hookname] );
                }
                isHooked = 1;
            }
        },
        
        unhook: function( ) {
            if ( isHooked )
            {
                var hooks = _Prism.hooks.all, hookname, thishook;
                
                for (hookname in thisHooks)
                {
                    if ( hooks[HAS](hookname) && thisHooks[HAS](hookname) )
                    {
                        thishook = hooks[hookname].indexOf( thisHooks[hookname] );
                        if ( thishook > -1 ) hooks[hookname].splice(thishook, 1);
                    }
                }
                isHooked = 0;
            }
        }
    };
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
