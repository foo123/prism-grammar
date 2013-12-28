    
    //
    // parser factories
    var
        PrismParser = Class({
            
            constructor: function(grammar, LOC) {
                //this.LOC = LOC;
                //this.Grammar = grammar;
                //this.Comments = grammar.Comments || {};
                
                this.DEF = LOC.DEFAULT;
                this.ERR = LOC.ERROR;
                
                this.Tokens = grammar.Parser || [];
                this.cTokens = (grammar.cTokens.length) ? grammar.cTokens : null;
            },
            
            ERR: null,
            DEF: null,
            cTokens: null,
            Tokens: null,

            // Prism compatible
            tokenize: function(code) {
                code = code || "";
                var lines = code.split(/\r\n|\r|\n/g), l = lines.length, i;
                var tokens = [], states = new Array(l+1), data;
                states[0] = null;
                
                for (i=0; i<l; i++)
                {
                    data = this.getLineTokens(lines[i], states[i], i);
                    states[i+1] = data.state;
                    tokens = tokens.concat(data.tokens);
                    if (i<l-1) tokens.push("\n");
                }
                return tokens;
            },
            
            // Prism compatible
            getLineTokens: function(line, state, row) {
                
                var i, rewind, rewind2, ci,
                    tokenizer, interleavedCommentTokens = this.cTokens, tokens = this.Tokens, numTokens = tokens.length, 
                    prismTokens, token, type, 
                    stream, stack, DEFAULT = this.DEF, ERROR = this.ERR
                ;
                
                prismTokens = []; 
                stream = new ParserStream( line );
                state = (state) ? state.clone( ) : new ParserState( );
                stack = state.stack;
                token = { type: null, content: "" };
                type = null;
                
                while ( !stream.eol() )
                {
                    rewind = 0;
                    
                    if ( DEFAULT == type || ERROR == type)
                    {
                        if ( token.type ) prismTokens.push( token );
                        prismTokens.push( stream.cur() );
                        token = { type: null, content: "" };
                        stream.sft();
                    }
                    else if ( type && type !== token.type )
                    {
                        if ( token.type ) prismTokens.push( token );
                        token = { type: type, content: stream.cur() };
                        stream.sft();
                    }
                    else if ( token.type )
                    {
                        token.content += stream.cur();
                        stream.sft();
                    }
                    
                    if ( stream.spc() ) 
                    {
                        state.t = T_DEFAULT;
                        state.r = type = DEFAULT;
                        continue;
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
                            if ( tokenizer.ERR || tokenizer.required )
                            {
                                // empty the stack
                                stack.length = 0;
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
                            if ( tokenizer.ERR || tokenizer.required )
                            {
                                // empty the stack
                                stack.length = 0;
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
                    prismTokens.push( stream.cur() );
                }
                else if ( type && type !== token.type )
                {
                    if ( token.type ) prismTokens.push( token );
                    prismTokens.push( { type: type, content: stream.cur() } );
                }
                else if ( token.type )
                {
                    token.content += stream.cur();
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
            
            var parser = getParser( grammar, LOCALS ), _Prism;
            var isHooked = 0, hookedLanguage = null, thisHooks = {
                
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
                        env._highlightedCode = env.highlightedCode;
                        // tokenize code and transform to prism-compatible tokens
                        env.highlightedCode = _Prism.Token.stringify(env.parser.tokenize(env.code), env.language);
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
                        _Prism.hooks.add('before-highlight', thisHooks['before-highlight']);
                        _Prism.hooks.add('before-insert', thisHooks['before-insert']);
                        isHooked = 1;
                    }
                },
                
                unhook: function() {
                    if ( isHooked )
                    {
                        var hooks = _Prism.hooks.all;
                        
                        for (var name in thisHooks)
                        {
                            if ( hooks[name] )
                            {
                                var thishook = hooks[name].indexOf( thisHooks[name] );
                                if ( thishook > -1 ) hooks[name].splice(thishook, 1);
                            }
                        }
                        isHooked = 0;
                    }
                }
                
            };
        }
    ;
  