    
    //
    // parser factories
    var
        Parser = Class({
            
            constructor: function(grammar, LOC) {
                var ayto = this;
                ayto.DEF = LOC.DEFAULT;
                ayto.ERR = LOC.ERROR;
                
                ayto.Tokens = grammar.Parser || [];
                ayto.cTokens = (grammar.cTokens.length) ? grammar.cTokens : null;
                ayto.Style = grammar.Style;
            },
            
            ERR: null,
            DEF: null,
            cTokens: null,
            Tokens: null,
            Style: null,

            // Prism compatible
            parse: function(code) {
                code = code || "";
                var lines = code.split(/\r\n|\r|\n/g), l = lines.length, i, tokens = [], data;
                data = { state: new State( ), tokens: null };
                
                for (i=0; i<l; i++)
                {
                    data = this.getLineTokens(lines[i], data.state, i);
                    tokens = tokens.concat(data.tokens);
                    if (i<l-1) tokens.push("\n");
                }
                return tokens;
            },
            
            // Prism compatible
            getLineTokens: function(line, state, row) {
                
                var ayto = this, i, rewind, rewind2, ci,
                    tokenizer, interleavedCommentTokens = ayto.cTokens, tokens = ayto.Tokens, numTokens = tokens.length, 
                    prismTokens, token, type, style,
                    stream, stack, Style = ayto.Style, DEFAULT = ayto.DEF, ERROR = ayto.ERR
                ;
                
                prismTokens = []; 
                stream = new Stream( line );
                stack = state.stack;
                token = { type: null, content: "" };
                type = null;
                style = null;
                
                // if EOL tokenizer is left on stack, pop it now
                if ( !stack.isEmpty() && T_EOL == stack.peek().tt && stream.sol() ) 
                {
                    stack.pop();
                }
                
                while ( !stream.eol() )
                {
                    rewind = 0;
                    
                    if ( DEFAULT == style || ERROR == style )
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
                    if ( (stack.isEmpty() || (T_NONSPACE != stack.peek().tt)) && stream.spc() )
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
                            // match action error
                            if ( tokenizer.MTCH )
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
                            // match action error
                            if ( tokenizer.MTCH )
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
                
                if ( DEFAULT == style || ERROR == style )
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
        }),
        
        getMode = function(grammar) {
            
            var LOCALS = { 
                    DEFAULT: DEFAULTSTYLE,
                    ERROR: DEFAULTERROR
                }
            ;
            
            // build the grammar
            grammar = parseGrammar( grammar );
            //console.log(grammar);
            
            var parser = new Parser(grammar, LOCALS), _Prism,
                isHooked = 0, hookedLanguage = null, thisHooks = {
                
                'before-highlight' : function( env ) {
                    // use the custom parser for the grammar to highlight
                    // hook only if the language matches
                    if ( hookedLanguage == env.language )
                    {
                        // avoid double highlight work, set code to ""
                        env._code = env.code;
                        env.code = "";
                        env.parser = parser;
                    }
                },
                
                'before-insert' : function( env ) {
                    if ( hookedLanguage == env.language )
                    {
                        // re-set
                        env.code = env._code;
                        env._code = "";
                        //env._highlightedCode = env.highlightedCode;
                        // tokenize code and transform to prism-compatible tokens
                        env.highlightedCode = _Prism.Token.stringify(env.parser.parse(env.code), env.language);
                    }
                }            
            };
            
            // return a plugin that can be hooked-unhooked to Prism under certain language conditions
            return {
                
                hook: function(Prism, language) {
                    if ( !isHooked )
                    {
                        _Prism = Prism;
                        hookedLanguage = language;
                        for (var hookname in thisHooks )
                        {
                            _Prism.hooks.add(hookname, thisHooks[hookname]);
                        }
                        isHooked = 1;
                    }
                },
                
                unhook: function() {
                    if ( isHooked )
                    {
                        var hooks = _Prism.hooks.all;
                        
                        for (var hookname in thisHooks)
                        {
                            if ( hooks[hookname] )
                            {
                                var thishook = hooks[hookname].indexOf( thisHooks[hookname] );
                                if ( thishook > -1 ) hooks[hookname].splice(thishook, 1);
                            }
                        }
                        isHooked = 0;
                    }
                }
                
            };
        }
    ;
  