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
        
        self.$grammar = grammar;
        self.DEF = LOC.DEFAULT;
        self.ERR = LOC.ERROR;
    }
    
    ,$grammar: null
    ,DEF: null
    ,ERR: null

    ,dispose: function( ) {
        var self = this;
        self.$grammar = null;
        self.DEF = null;
        self.ERR = null;
        return self;
    }
    
    // Prism compatible
    ,parse: function( code, parse_type ) {
        code = code || "";
        var self = this, lines = code.split(newline_re), l = lines.length, i, 
            tokens = null, data, parse_errors, parse_tokens, ret;
        
        parse_type = parse_type || TOKENS;
        parse_errors = !!(parse_type&ERRORS);
        parse_tokens = !!(parse_type&TOKENS);
        
        data = {state:new State(0, 0, parse_type), tokens:null};
        
        if ( parse_tokens )
        {
            tokens = [];
            for (i=0; i<l; i++)
            {
                data.state.line = i;
                data = self.getLineTokens(lines[i], data.state, i);
                tokens = tokens.concat(data.tokens);
                if (i+1<l) tokens.push("\r\n");
            }
        }
        else //if ( parse_errors )
        {
            for (i=0; i<l; i++)
            {
                data.state.line = i;
                data = self.getLineTokens(lines[i], data.state, i);
            }
        }
        if ( parse_tokens && parse_errors ) ret = {tokens:tokens, errors:data.state.err};
        else if ( parse_tokens ) ret = tokens;
        else ret = data.state.err;
        data.state.dispose();
        return ret;
    }
    
    // Prism compatible
    ,getLineTokens: function( line, state, row ) {
        var self = this, grammar = self.$grammar, Style = grammar.Style, DEFAULT = self.DEF, ERR = self.ERR,
            interleaved_comments = grammar.$interleaved, tokens = grammar.$parser, nTokens = tokens.length, 
            i, rewind, rewind2, ci, tokenizer, action, id, prismTokens, 
            token, type, style, pos, lin, cur, ACTIONERR, stream, stack
        ;
        
        prismTokens = []; 
        stream = new Stream( line );
        stack = state.stack;
        if ( 0 === state.line ) state.status |= T_SOF;
        else state.status &= ~T_SOF;
        token = {id:null, type:null, content:""};
        type = null; style = null; id = null;
        
        // if EOL tokenizer is left on stack, pop it now
        if ( stream.sol() && !stack.isEmpty() && T_EOL === stack.peek().type )
        {
            stack.pop();
        }
        
        lin = state.line;
        pos = stream.pos;
        ACTIONERR = false;
        while ( !stream.eol() )
        {
            rewind = 0;
            
            if ( DEFAULT === style || ERR === style )
            {
                if ( id && ACTIONERR )
                {
                    cur = '';
                    while ( prismTokens.length && id === prismTokens[prismTokens.length-1].id )
                    {
                        cur = prismTokens.pop().content + cur;
                    }
                    if ( id === token.id )
                    {
                        cur += token.content;
                    }
                    else if ( token.type )
                    {
                        prismTokens.push( token );
                    }
                    cur += stream.cur(1);
                    prismTokens.push( cur );
                }
                else
                {
                    if ( token.type ) prismTokens.push( token );
                    cur = stream.cur(1);
                    prismTokens.push( cur );
                }
                token = {id:null, type:null, content:""};
            }
            else if ( style && style !== token.type )
            {
                cur = stream.cur(1);
                if ( token.type ) prismTokens.push( token );
                token = {id:id, type:style, content:cur};
            }
            else if ( token.type )
            {
                cur = stream.cur(1);
                token.content += cur;
            }
            style = false; id = null;
            ACTIONERR = false;
            
            // check for non-space tokenizer before parsing space
            if ( (stack.isEmpty() || (T_NONSPACE !== stack.peek().type)) && stream.spc() )
            {
                type = DEFAULT; style = DEFAULT;
                continue;
            }
            
            while ( !stack.isEmpty() && !stream.eol() )
            {
                //ACTIONERR = false;
                if ( interleaved_comments )
                {
                    ci = 0; rewind2 = 0;
                    while ( ci < interleaved_comments.length )
                    {
                        tokenizer = interleaved_comments[ci++];
                        type = tokenizer.get(stream, state);
                        if ( false !== type )
                        {
                            style = Style[type] || DEFAULT;
                            id = tokenizer.name;
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
            
                pos = stream.pos;
                tokenizer = stack.pop();
                type = tokenizer.get(stream, state);
            
                // match failed
                if ( false === type )
                {
                    // error
                    if ( tokenizer.status&REQUIRED_OR_ERROR )
                    {
                        // empty the stack
                        stack.empty('$id', tokenizer.$id);
                        // skip this character
                        stream.nxt();
                        // generate error
                        type = ERR; style = ERR;
                        tokenizer.err(state, lin, pos, lin, stream.pos);
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
                    id = tokenizer.name;
                    // action token follows, execute action on current token
                    while ( !stack.isEmpty() && T_ACTION === stack.peek().type )
                    {
                        action = stack.pop();
                        action.get(stream, state);
                        // action error
                        if ( action.status&ERROR )
                        {
                            // empty the stack
                            //stack.empty('$id', /*action*/tokenizer.$id);
                            // generate error
                            //action.err(state, lin, pos, lin, stream.pos);
                            type = ERR; style = ERR;
                            ACTIONERR = true;
                        }
                    }
                    rewind = 1;
                    break;
                }
            }
            
            if ( rewind ) continue;
            if ( stream.eol() ) break;
            
            for (i=0; i<nTokens; i++)
            {
                pos = stream.pos;
                tokenizer = tokens[i];
                type = tokenizer.get(stream, state);
                
                // match failed
                if ( false === type )
                {
                    // error
                    if ( tokenizer.status&REQUIRED_OR_ERROR )
                    {
                        // empty the stack
                        stack.empty('$id', tokenizer.$id);
                        // skip this character
                        stream.nxt();
                        // generate error
                        type = ERR; style = ERR;
                        tokenizer.err(state, lin, pos, lin, stream.pos);
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
                    id = tokenizer.name;
                    // action token follows, execute action on current token
                    while ( !stack.isEmpty() && T_ACTION === stack.peek().type )
                    {
                        action = stack.pop();
                        action.get(stream, state);
                        // action error
                        if ( action.status&ERROR )
                        {
                            // empty the stack
                            //stack.empty('$id', /*action*/tokenizer.$id);
                            // generate error
                            //action.err(state, lin, pos, lin, stream.pos);
                            type = ERR; style = ERR;
                            ACTIONERR = true;
                        }
                    }
                    rewind = 1;
                    break;
                }
            }
            
            if ( rewind ) continue;
            if ( stream.eol() ) break;
            
            // unknown, bypass
            stream.nxt(); type = DEFAULT; style = DEFAULT;
        }
        
        if ( DEFAULT === style || ERR === style )
        {
            if ( id && ACTIONERR )
            {
                cur = '';
                while ( prismTokens.length && id === prismTokens[prismTokens.length-1].id )
                {
                    cur = prismTokens.pop().content + cur;
                }
                if ( id === token.id )
                {
                    cur += token.content;
                }
                else if ( token.type )
                {
                    prismTokens.push( token );
                }
                cur += stream.cur(1);
                prismTokens.push( cur );
            }
            else
            {
                if ( token.type ) prismTokens.push( token );
                cur = stream.cur(1);
                prismTokens.push( cur );
            }
        }
        else if ( style && style !== token.type )
        {
            cur = stream.cur(1);
            if ( token.type ) prismTokens.push( token );
            prismTokens.push( {id:id, type:style, content:cur} );
        }
        else if ( token.type )
        {
            cur = stream.cur(1);
            token.content += cur;
            prismTokens.push( token );
        }
        token = null; //{ id:null, type: null, content: "" };
        
        return {state:state, tokens:prismTokens};
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
                    env.highlightedCode = _Prism.Token.stringify( parser.parse(env.code, TOKENS|ERRORS).tokens, env.language );
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
                hookedLanguage = null;
                _Prism = null;
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
