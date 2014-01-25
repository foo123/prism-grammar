    
    //
    // parser factories
    var
        PrismParser = Class({
            
            constructor: function(grammar, LOC) {
                var ayto = this;
                ayto.DEF = LOC.DEFAULT;
                ayto.ERR = LOC.ERROR;
                
                ayto.Tokens = grammar.Parser || [];
                ayto.cTokens = (grammar.cTokens.length) ? grammar.cTokens : null;
            },
            
            ERR: null,
            DEF: null,
            cTokens: null,
            Tokens: null,

            // Prism compatible
            parse: function(code) {
                code = code || "";
                var lines = code.split(/\r\n|\r|\n/g), l = lines.length, i, tokens = [], data;
                data = { state: new ParserState( ), tokens: null };
                
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
                    prismTokens, token, type, 
                    stream, stack, DEFAULT = ayto.DEF, ERROR = ayto.ERR
                ;
                
                prismTokens = []; 
                stream = new ParserStream( line );
                stack = state.stack;
                token = { type: null, content: "" };
                type = null;
                
                // if EOL tokenizer is left on stack, pop it now
                if ( stack.length && T_EOL == stack[stack.length-1].tt )  stack.pop();
                
                while ( !stream.eol() )
                {
                    rewind = 0;
                    
                    if ( DEFAULT == type || ERROR == type)
                    {
                        if ( token.type ) prismTokens.push( token );
                        prismTokens.push( stream.cur(1) );
                        token = { type: null, content: "" };
                        //stream.sft();
                    }
                    else if ( type && type !== token.type )
                    {
                        if ( token.type ) prismTokens.push( token );
                        token = { type: type, content: stream.cur(1) };
                        //stream.sft();
                    }
                    else if ( token.type )
                    {
                        token.content += stream.cur(1);
                        //stream.sft();
                    }
                    
                    // check for non-space tokenizer before parsing space
                    if ( !stack.length || T_NONSPACE != stack[stack.length-1].tt )
                    {
                        if ( stream.spc() )
                        {
                            state.t = T_DEFAULT;
                            state.r = type = DEFAULT;
                            continue;
                        }
                    }
                    
                    while ( stack.length && !stream.eol() )
                    {
                        if ( interleavedCommentTokens )
                        {
                            ci = 0; rewind2 = 0;
                            while ( ci < interleavedCommentTokens.length )
                            {
                                tokenizer = interleavedCommentTokens[ci++];
                                state.r = type = tokenizer.get(stream, state);
                                if ( false !== type )
                                {
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
                        state.r = type = tokenizer.get(stream, state);
                        
                        // match failed
                        if ( false === type )
                        {
                            // error
                            if ( tokenizer.ERR || tokenizer.REQ )
                            {
                                // empty the stack
                                //stack.length = 0;
                                emptyStack(stack, tokenizer.sID);
                                // skip this character
                                stream.nxt();
                                // generate error
                                state.t = T_ERROR;
                                state.r = type = ERROR;
                                rewind = 1;
                                break;
                            }
                            // optional
                            else
                            {
                                continue;
                            }
                        }
                        // found token
                        else
                        {
                            rewind = 1;
                            break;
                        }
                    }
                    
                    if ( rewind ) continue;
                    if ( stream.eol() ) break;
                    
                    for (i=0; i<numTokens; i++)
                    {
                        tokenizer = tokens[i];
                        state.r = type = tokenizer.get(stream, state);
                        
                        // match failed
                        if ( false === type )
                        {
                            // error
                            if ( tokenizer.ERR || tokenizer.REQ )
                            {
                                // empty the stack
                                //stack.length = 0;
                                emptyStack(stack, tokenizer.sID);
                                // skip this character
                                stream.nxt();
                                // generate error
                                state.t = T_ERROR;
                                state.r = type = ERROR;
                                rewind = 1;
                                break;
                            }
                            // optional
                            else
                            {
                                continue;
                            }
                        }
                        // found token
                        else
                        {
                            rewind = 1;
                            break;
                        }
                    }
                    
                    if ( rewind ) continue;
                    if ( stream.eol() ) break;
                    
                    // unknown, bypass
                    stream.nxt();
                    state.t = T_DEFAULT;
                    state.r = type = DEFAULT;
                }
                
                if ( DEFAULT == type || ERROR == type)
                {
                    if ( token.type ) prismTokens.push( token );
                    prismTokens.push( stream.cur(1) );
                }
                else if ( type && type !== token.type )
                {
                    if ( token.type ) prismTokens.push( token );
                    prismTokens.push( { type: type, content: stream.cur(1) } );
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
        
        getParser = function(grammar, LOCALS) {
            return new PrismParser(grammar, LOCALS);
        },
        
        getMode = function(grammar) {
            
            var LOCALS = { 
                    DEFAULT: DEFAULTSTYLE,
                    ERROR: DEFAULTERROR
                }
            ;
            
            // build the grammar
            grammar = parseGrammar( grammar );
            //console.log(grammar);
            
            var parser = getParser( grammar, LOCALS ), _Prism,
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
  