    
    //
    // parser factories
    var
        PrismParser = Class({
            
            constructor: function(grammar, LOC) {
                //this.LOC = LOC;
                //this.Grammar = grammar;
                //this.Comments = grammar.Comments || {};
                
                this.DEF = LOC.DEFAULT;
                this.ERR = grammar.Style.error || LOC.ERROR;
                
                this.Tokens = grammar.Parser || [];
                this.cTokens = (grammar.cTokens.length) ? grammar.cTokens : null;
            },
            
            ERR: null,
            DEF: null,
            cTokens: null,
            Tokens: null,

            // Prism compatible
            tokenize: function(code, tag) {
                
                code = code || "";
                tag = tag || 'span';
                var lines = code.split(/\r\n|\r|\n/g), l = lines.length+1, i;
                var tokens = [], states = new Array(l);
                states[0] = null;
                
                for (i=1; i<l; i++)
                {
                    var data = this.getLineTokens(lines[i-1], states[i-1], i-1);
                    states[i] = data.state;
                    tokens = tokens.concat(data.tokens);
                    tokens.push("\n");
                }
                
                tokens = tokens.map(function(t){
                    if ( t.type && t.content )
                    {
                        var classes = ['token', t.type];
                        return '<' + tag + ' class="' + classes.join(' ') + '" ' /*+ attributes*/ + '>' + t.content + '</' + tag + '>';
                    }
                    else
                    {
                        return t.content ? t.content : ''+t;
                    }
                }).join('');
                
                return tokens;
            },
            
            getLineTokens: function(line, state, row) {
                
                var i, rewind, rewind2, ci,
                    tokenizer, interleavedCommentTokens = this.cTokens, tokens = this.Tokens, numTokens = tokens.length, 
                    prismTokens, token, type, 
                    stream, stack, DEFAULT = this.DEF, ERROR = this.ERR
                ;
                
                prismTokens = []; 
                stream = new ParserStream( line );
                state = (state) ? state.clone( ) : new ParserState( );
                state.l = 1+row;
                stack = state.stack;
                token = { type: null, content: "" };
                type = null;
                
                while ( !stream.eol() )
                {
                    rewind = 0;
                    
                    if ( type && type !== token.type )
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
                
                if ( type && type !== token.type )
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
        
        getMode = function(grammar, DEFAULT) {
            
            var LOCALS = { 
                    // default return code for skipped or not-styled tokens
                    // 'text' should be used in most cases
                    DEFAULT: DEFAULT || DEFAULTSTYLE,
                    ERROR: DEFAULTERROR
                }
            ;
            
            // build the grammar
            grammar = parseGrammar( grammar );
            //console.log(grammar);
            
            var parser = getParser( grammar, LOCALS );
            var isHooked = 0, _hooks = {}, _language, _Prism;
            _hooks['before-highlight'] = function(env) {
                // use the custom parser for the grammar to highlight
                // save current code in temp variable
                // set current code to empty
                // so as to save additional highlight work
                // hook only if the language matches
                //console.log(env.language);
                if ( _language == env.language )
                {
                    //env._code = env.code;
                    //env.code = "";
                    //console.log(env.code);
                    env.parser = parser;
                }
            };
            _hooks['before-insert'] = function(env) {
                if ( _language == env.language )
                {
                    env._highlightedCode = env.highlightedCode;
                    //console.log(env._highlightedCode);
                    // tokenize code and tarnsform to prism-compatible tokens
                    var tokens = env.parser.tokenize(env.code, 'span');
                    //for (var i=0; i<tokens.length; i++) tokens[i] = new _Prism.Token(tokens[i].type, tokens[i].content);
                    env.highlightedCode = tokens; //_Prism.Token.stringify(tokens, env.language);
                    //console.log(env.highlightedCode);
                }
            };
            
            // return a plugin that can be hooked-unhooked to Prism under certain language conditions
            return {
                
                hook: function(Prism, language) {
                    if ( !isHooked )
                    {
                        _Prism = Prism;
                        _language = language;
                        _Prism.hooks.add('before-highlight', _hooks['before-highlight']);
                        _Prism.hooks.add('before-insert', _hooks['before-insert']);
                        isHooked = 1;
                    }
                },
                
                unhook: function() {
                    if ( isHooked )
                    {
                        var hooks = _Prism.hooks.all;
                        
                        for (var name in _hooks)
                        {
                            if ( hooks[name] )
                            {
                                var thishook = hooks[name].indexOf( _hooks[name] );
                                if ( thishook > -1 )
                                {
                                    hooks[name].splice(thishook, 1);
                                }
                            }
                        }
                        isHooked = 0;
                    }
                }
                
            };
        }
    ;
  