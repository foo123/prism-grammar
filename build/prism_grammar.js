/**
*
*   PrismGrammar
*   @version: 0.4
*
*   Transform a grammar specification in JSON format, into a syntax-highlighter for Prism
*   https://github.com/foo123/prism-grammar
*
**/
!function ( root, name, deps, factory ) {

    //
    // export the module in a umd-style generic way
    deps = ( deps ) ? [].concat(deps) : [];
    var i, dl = deps.length, ids = new Array( dl ), paths = new Array( dl ), mods = new Array( dl );
    for (i=0; i<dl; i++) { ids[i] = deps[i][0]; paths[i] = deps[i][1]; }
    
    // node, commonjs, etc..
    if ( 'object' == typeof( module ) && module.exports ) 
    {
        if ( 'undefined' == typeof(module.exports[name]) )
        {
            for (i=0; i<dl; i++)
                mods[i] = module.exports[ ids[i] ] || require( paths[i] )[ ids[i] ];
            module.exports[ name ] = factory.apply(root, mods );
        }
    }
    
    // amd, etc..
    else if ( 'function' == typeof( define ) && define.amd ) 
    {
        define( ['exports'].concat( paths ), function( exports ) {
            if ( 'undefined' == typeof(exports[name]) )
            {
                var args = Array.prototype.slice.call( arguments, 1 );
                for (var i=0, dl=args.length; i<dl; i++)
                    mods[i] = exports[ ids[i] ];
                exports[name] = factory.apply(root, mods );
            }
        });
    }
    
    // browsers, other loaders, etc..
    else 
    {
        if ( 'undefined' == typeof(root[name]) )
        {
            for (i=0; i<dl; i++)
                mods[i] = root[ ids[i] ];
            root[name] = factory.apply(root, mods );
        }
    }


}(  /* current root */          this, 
    /* module name */           "PrismGrammar",
    /* module dependencies */   [ ['Classy', './classy'],  ['RegExAnalyzer', './regexanalyzer'] ], 
    /* module factory */        function( Classy, RegexAnalyzer, undef ) {
        
        /* main code starts here */

        
    //
    // parser types
    var    
        DEFAULTSTYLE,
        DEFAULTERROR,
        
        //
        // javascript variable types
        INF = Infinity,
        T_NUM = 2,
        T_BOOL = 4,
        T_STR = 8,
        T_CHAR = 9,
        T_CHARLIST = 10,
        T_REGEX = 16,
        T_ARRAY = 32,
        T_OBJ = 64,
        T_NULL = 128,
        T_UNDEF = 256,
        T_UNKNOWN = 512,
        
        //
        // matcher types
        T_SIMPLEMATCHER = 2,
        T_COMPOSITEMATCHER = 4,
        T_BLOCKMATCHER = 8,
        
        //
        // token types
        T_ERROR = 4,
        T_DEFAULT = 8,
        T_SIMPLE = 16,
        T_EOL = 17,
        T_BLOCK = 32,
        T_ESCBLOCK = 33,
        T_COMMENT = 34,
        T_EITHER = 64,
        T_NONE = 2048,
        T_ALL = 128,
        T_REPEATED = 256,
        T_ZEROORONE = 257,
        T_ZEROORMORE = 258,
        T_ONEORMORE = 259,
        T_GROUP = 512,
        T_NGRAM = 1024,
        
        //
        // tokenizer types
        groupTypes = {
            ONEOF: T_EITHER, EITHER: T_EITHER, NONEOF: T_NONE, ALL: T_ALL, ZEROORONE: T_ZEROORONE, ZEROORMORE: T_ZEROORMORE, ONEORMORE: T_ONEORMORE, REPEATED: T_REPEATED
        },
        
        tokenTypes = {
            BLOCK: T_BLOCK, COMMENT: T_COMMENT, ESCAPEDBLOCK: T_ESCBLOCK, SIMPLE: T_SIMPLE, GROUP: T_GROUP, NGRAM: T_NGRAM
        },
        
        //
        // default grammar settings
        defaultGrammar = {
            // prefix ID for regular expressions used in the grammar
            "RegExpID" : null,
            
            //
            // Style model
            "Style" : null,

            //
            // Lexical model
            "Lex" : null,
            
            //
            // Syntax model and context-specific rules (optional)
            "Syntax" : null,
            
            // what to parse and in what order
            "Parser" : null
        }
    ;
    
    var Class = Classy.Class;
    
    var AP = Array.prototype, OP = Object.prototype,
        slice = AP.slice, splice = AP.splice, concat = AP.concat, 
        hasKey = OP.hasOwnProperty, toStr = OP.toString, isEnum = OP.propertyIsEnumerable,
        
        Keys = Object.keys,
        
        get_type = function(v) {
            var type_of = typeof(v), to_string = toStr.call(v);
            
            if ('undefined' == type_of)  return T_UNDEF;
            
            else if ('number' == type_of || v instanceof Number)  return T_NUM;
            
            else if (null === v)  return T_NULL;
            
            else if (true === v || false === v)  return T_BOOL;
            
            else if (v && ('string' == type_of || v instanceof String))  return (1 == v.length) ? T_CHAR : T_STR;
            
            else if (v && ("[object RegExp]" == to_string || v instanceof RegExp))  return T_REGEX;
            
            else if (v && ("[object Array]" == to_string || v instanceof Array))  return T_ARRAY;
            
            else if (v && "[object Object]" == to_string)  return T_OBJ;
            
            // unkown type
            return T_UNKNOWN;
        },
        
        make_array = function(a, force) {
            return ( force || T_ARRAY != get_type( a ) ) ? [ a ] : a;
        },
        
        make_array_2 = function(a, force) {
            a = make_array( a, force );
            if ( force || T_ARRAY != get_type( a[0] ) ) a = [ a ]; // array of arrays
            return a;
        },
        
        clone = function(o) {
            var T = get_type( o ), T2;
            
            if ( !((T_OBJ | T_ARRAY) & T) ) return o;
            
            var co = {}, k;
            for (k in o) 
            {
                if ( hasKey.call(o, k) && isEnum.call(o, k) ) 
                { 
                    T2 = get_type( o[k] );
                    
                    if (T_OBJ & T2)  co[k] = clone(o[k]);
                    
                    else if (T_ARRAY & T2)  co[k] = o[k].slice();
                    
                    else  co[k] = o[k]; 
                }
            }
            return co;
        },
        
        extend = function() {
            var args = slice.call(arguments), argslen = args.length;
            
            if ( argslen<1 ) return null;
            else if ( argslen<2 ) return clone( args[0] );
            
            var o1 = args.shift(), o2, o = clone(o1), i, k, T; 
            argslen--;            
            
            for (i=0; i<argslen; i++)
            {
                o2 = args.shift();
                if ( !o2 ) continue;
                
                for (k in o2) 
                { 
                    if ( hasKey.call(o2, k) && isEnum.call(o2, k) )
                    {
                        if ( hasKey.call(o1, k) && isEnum.call(o1, k) ) 
                        { 
                            T = get_type( o1[k] );
                            
                            if ( (T_OBJ & ~T_STR) & T)  o[k] = extend( o1[k], o2[k] );
                            
                            //else if (T_ARRAY == T)  o[k] = o1[k].slice();
                            
                            //else  o[k] = o1[k];
                        }
                        else
                        {
                            o[k] = clone( o2[k] );
                        }
                    }
                }
            }
            return o;
        },
        
        escRegexp = function(str) {
            return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
        },
        
        groupReplace = function(pattern, token) {
            var parts, i, l, replacer;
            replacer = function(m, d){
                // the regex is wrapped in an additional group, 
                // add 1 to the requested regex group transparently
                return token[ 1 + parseInt(d, 10) ];
            };
            parts = pattern.split('$$');
            l = parts.length;
            for (i=0; i<l; i++) parts[i] = parts[i].replace(/\$(\d{1,2})/g, replacer);
            return parts.join('$');
        },
        
        byLength = function(a, b) { return b.length - a.length },
        
        hasPrefix = function(s, id) {
            return (
                (T_STR & get_type(id)) && (T_STR & get_type(s)) && id.length &&
                id.length <= s.length && id == s.substr(0, id.length)
            );
        },
        
        getRegexp = function(r, rid, cachedRegexes)  {
            if ( !r || (T_NUM == get_type(r)) ) return r;
            
            var l = (rid) ? (rid.length||0) : 0;
            
            if ( l && rid == r.substr(0, l) ) 
            {
                var regexID = "^(" + r.substr(l) + ")", regex, chars, analyzer;
                
                if ( !cachedRegexes[ regexID ] )
                {
                    regex = new RegExp( regexID );
                    analyzer = new RegexAnalyzer( regex ).analyze();
                    chars = analyzer.getPeekChars();
                    if ( !Keys(chars.peek).length )  chars.peek = null;
                    if ( !Keys(chars.negativepeek).length )  chars.negativepeek = null;
                    
                    // shared, light-weight
                    cachedRegexes[ regexID ] = [ regex, chars ];
                }
                
                return cachedRegexes[ regexID ];
            }
            else
            {
                return r;
            }
        },
        
        getCombinedRegexp = function(tokens, boundary)  {
            var peek = { }, i, l, b = "", bT = get_type(boundary);
            if ( T_STR == bT || T_CHAR == bT ) b = boundary;
            var combined = tokens
                        .sort( byLength )
                        .map( function(t) {
                            peek[ t.charAt(0) ] = 1;
                            return escRegexp( t );
                        })
                        .join( "|" )
                    ;
            return [ new RegExp("^(" + combined + ")"+b), { peek: peek, negativepeek: null }, 1 ];
        }
    ;
    
    //
    // Stream Class
    var
        // a wrapper-class to manipulate a string as a stream, based on Codemirror's StringStream
        ParserStream = Class({
            
            constructor: function( line ) {
                this.string = (line) ? ''+line : '';
                this.start = this.pos = 0;
                this._ = null;
            },
            
            // abbreviations used for optimal minification
            
            _: null,
            string: '',
            start: 0,
            pos: 0,
            
            fromStream: function( _ ) {
                this._ = _;
                this.string = ''+_.string;
                this.start = _.start;
                this.pos = _.pos;
                return this;
            },
            
            toString: function() { return this.string; },
            
            // string start-of-line?
            sol: function( ) { return 0 == this.pos; },
            
            // string end-of-line?
            eol: function( ) { return this.pos >= this.string.length; },
            
            // char match
            chr : function(pattern, eat) {
                var ch = this.string.charAt(this.pos) || null;
                if (ch && pattern == ch) 
                {
                    if (false !== eat) 
                    {
                        this.pos += 1;
                        if ( this._ ) this._.pos = this.pos;
                    }
                    return ch;
                }
                return false;
            },
            
            // char list match
            chl : function(pattern, eat) {
                var ch = this.string.charAt(this.pos) || null;
                if ( ch && (-1 < pattern.indexOf( ch )) ) 
                {
                    if (false !== eat) 
                    {
                        this.pos += 1;
                        if ( this._ ) this._.pos = this.pos;
                    }
                    return ch;
                }
                return false;
            },
            
            // string match
            str : function(pattern, startsWith, eat) {
                var pos = this.pos, str = this.string, ch = str.charAt(pos) || null;
                if ( ch && startsWith[ ch ] )
                {
                    var len = pattern.length, s = str.substr(pos, len);
                    if (pattern == s) 
                    {
                        if (false !== eat) 
                        {
                            this.pos += len;
                            if ( this._ )  this._.pos = this.pos;
                        }
                        return s;
                    }
                }
                return false;
            },
            
            // regex match
            rex : function(pattern, startsWith, notStartsWith, group, eat) {
                var pos = this.pos, str = this.string, ch = str.charAt(pos) || null;
                if ( ch && ( startsWith && startsWith[ ch ] ) || ( notStartsWith && !notStartsWith[ ch ] ) )
                {
                    var match = str.slice(pos).match(pattern);
                    if (!match || match.index > 0) return false;
                    if (false !== eat) 
                    {
                        this.pos += match[group||0].length;
                        if ( this._ ) this._.pos = this.pos;
                    }
                    return match;
                }
                return false;
            },
            /*
            // general pattern match
            match: function(pattern, eat, caseInsensitive, group) {
                if (typeof pattern == "string") 
                {
                    var cased = function(str) {return caseInsensitive ? str.toLowerCase() : str;};
                    var substr = this.string.substr(this.pos, pattern.length);
                    if (cased(substr) == cased(pattern)) 
                    {
                        if (eat !== false) this.pos += pattern.length;
                        return true;
                    }
                } 
                else 
                {
                    group = group || 0;
                    var match = this.string.slice(this.pos).match(pattern);
                    if (match && match.index > 0) return null;
                    if (match && eat !== false) this.pos += match[group].length;
                    return match;
                }
            },
            */
            // skip to end
            end: function() {
                this.pos = this.string.length;
                if ( this._ ) this._.pos = this.pos;
                return this;
            },
            /*
            // peek next char
            peek: function( ) { 
                return this.string.charAt(this.pos) || null; 
            },
            */
            // get next char
            nxt: function( ) {
                if (this.pos < this.string.length)
                {
                    var ch = this.string.charAt(this.pos++) || null;
                    if ( this._ ) this._.pos = this.pos;
                    return ch;
                }
            },
            
            // back-up n steps
            bck: function( n ) {
                this.pos -= n;
                if ( 0 > this.pos ) this.pos = 0;
                if ( this._ )  this._.pos = this.pos;
                return this;
            },
            
            // back-track to pos
            bck2: function( pos ) {
                this.pos = pos;
                if ( 0 > this.pos ) this.pos = 0;
                if ( this._ ) this._.pos = this.pos;
                return this;
            },
            
            // eat space
            spc: function( ) {
                var start = this.pos, pos = this.pos, s = this.string;
                while (/[\s\u00a0]/.test(s.charAt(pos))) ++pos;
                this.pos = pos;
                if ( this._ ) this._.pos = this.pos;
                return this.pos > start;
            },
            
            // current stream selection
            cur: function( ) {
                return this.string.slice(this.start, this.pos);
            },
            
            // move/shift stream
            sft: function( ) {
                this.start = this.pos;
                return this;
            }
        })
    ;
        
    //
    // ParserState Class
    var
        ParserState = Class({
            
            constructor: function( line ) {
                //this.id = 0; //new Date().getTime();
                this.l = line || 0;
                this.stack = [];
                this.t = T_DEFAULT;
                this.r = '0';
                this.inBlock = null;
                this.endBlock = null;
            },
            
            // state id
            //id: 0,
            // state current line
            l: 0,
            // state token stack
            stack: null,
            // state current token id
            t: null,
            // state current token type
            r: null,
            // state current block name
            inBlock: null,
            // state endBlock for current block
            endBlock: null,
            
            clone: function() {
                var copy = new this.$class( this.l );
                copy.t = this.t;
                copy.r = this.r;
                copy.stack = this.stack.slice();
                copy.inBlock = this.inBlock;
                copy.endBlock = this.endBlock;
                return copy;
            },
            
            // used mostly for ACE which treats states as strings, 
            // make sure to generate a string which will cover most cases where state needs to be updated by the editor
            toString: function() {
                //return ['', this.id, this.inBlock||'0'].join('_');
                //return ['', this.id, this.t, this.r||'0', this.stack.length, this.inBlock||'0'].join('_');
                //return ['', this.id, this.t, this.stack.length, this.inBlock||'0'].join('_');
                //return ['', this.id, this.t, this.r||'0', this.inBlock||'0'].join('_');
                return ['', this.l, this.t, this.r, this.inBlock||'0'].join('_');
            }
        })
    ;
        
    //
    // matcher factories
    var 
        SimpleMatcher = Class({
            
            constructor : function(type, name, pattern, key) {
                this.type = T_SIMPLEMATCHER;
                this.tt = type || T_CHAR;
                this.tn = name;
                this.tk = key || 0;
                this.tg = 0;
                this.tp = null;
                this.p = null;
                this.np = null;
                
                // get a fast customized matcher for < pattern >
                switch ( this.tt )
                {
                    case T_CHAR: case T_CHARLIST:
                        this.tp = pattern;
                        break;
                    case T_STR:
                        this.tp = pattern;
                        this.p = {};
                        this.p[ '' + pattern.charAt(0) ] = 1;
                        break;
                    case T_REGEX:
                        this.tp = pattern[ 0 ];
                        this.p = pattern[ 1 ].peek || null;
                        this.np = pattern[ 1 ].negativepeek || null;
                        this.tg = pattern[ 2 ] || 0;
                        break;
                    case T_NULL:
                        this.tp = null;
                        break;
                }
            },
            
            // matcher type
            type: null,
            // token type
            tt: null,
            // token name
            tn: null,
            // token pattern
            tp: null,
            // token pattern group
            tg: 0,
            // token key
            tk: 0,
            // pattern peek chars
            p: null,
            // pattern negative peek chars
            np: null,
            
            get : function(stream, eat) {
                var matchedResult, 
                    tokenType = this.tt, tokenKey = this.tk, 
                    tokenPattern = this.tp, tokenPatternGroup = this.tg,
                    startsWith = this.p, notStartsWith = this.np
                ;    
                // get a fast customized matcher for < pattern >
                switch ( tokenType )
                {
                    case T_CHAR:
                        if ( matchedResult = stream.chr(tokenPattern, eat) ) return [ tokenKey, matchedResult ];
                        break;
                    case T_CHARLIST:
                        if ( matchedResult = stream.chl(tokenPattern, eat) ) return [ tokenKey, matchedResult ];
                        break;
                    case T_STR:
                        if ( matchedResult = stream.str(tokenPattern, startsWith, eat) ) return [ tokenKey, matchedResult ];
                        break;
                    case T_REGEX:
                        if ( matchedResult = stream.rex(tokenPattern, startsWith, notStartsWith, tokenPatternGroup, eat) ) return [ tokenKey, matchedResult ];
                        break;
                    case T_NULL:
                        // matches end-of-line
                        (false !== eat) && stream.end(); // skipToEnd
                        return [ tokenKey, "" ];
                        break;
                }
                return false;
            },
            
            toString : function() {
                return ['[', 'Matcher: ', this.tn, ', Pattern: ', ((this.tp) ? this.tp.toString() : null), ']'].join('');
            }
        }),
        
        CompositeMatcher = Class(SimpleMatcher, {
            
            constructor : function(name, matchers, useOwnKey) {
                this.type = T_COMPOSITEMATCHER;
                this.tn = name;
                this.ms = matchers;
                this.ownKey = (false!==useOwnKey);
            },
            
            // group of matchers
            ms : null,
            ownKey : true,
            
            get : function(stream, eat) {
                var i, m, matchers = this.ms, l = matchers.length, useOwnKey = this.ownKey;
                for (i=0; i<l; i++)
                {
                    // each one is a matcher in its own
                    m = matchers[i].get(stream, eat);
                    if ( m ) return ( useOwnKey ) ? [ i, m[1] ] : m;
                }
                return false;
            }
        }),
        
        BlockMatcher = Class(SimpleMatcher, {
            
            constructor : function(name, start, end) {
                this.type = T_BLOCKMATCHER;
                this.tn = name;
                this.s = new CompositeMatcher(this.tn + '_Start', start, false);
                this.e = end;
            },
            
            // start block matcher
            s : null,
            // end block matcher
            e : null,
            
            get : function(stream, eat) {
                    
                var startMatcher = this.s, endMatchers = this.e, token;
                
                // matches start of block using startMatcher
                // and returns the associated endBlock matcher
                if ( token = startMatcher.get(stream, eat) )
                {
                    // use the token key to get the associated endMatcher
                    var endMatcher = endMatchers[ token[0] ], T = get_type( endMatcher );
                    
                    // regex group number given, get the matched group pattern for the ending of this block
                    if ( T_NUM == T )
                    {
                        // the regex is wrapped in an additional group, 
                        // add 1 to the requested regex group transparently
                        endMatcher = new SimpleMatcher( T_STR, this.tn + '_End', token[1][ endMatcher+1 ] );
                    }
                    // string replacement pattern given, get the proper pattern for the ending of this block
                    else if ( T_STR == T )
                    {
                        // the regex is wrapped in an additional group, 
                        // add 1 to the requested regex group transparently
                        endMatcher = new SimpleMatcher( T_STR, this.tn + '_End', groupReplace(endMatcher, token[1]) );
                    }
                    
                    return endMatcher;
                }
                
                return false;
            }
        }),
        
        getSimpleMatcher = function(name, pattern, key, cachedMatchers) {
            var T = get_type( pattern );
            
            if ( T_NUM == T ) return pattern;
            
            if ( !cachedMatchers[ name ] )
            {
                key = key || 0;
                var matcher;
                var is_char_list = 0;
                
                if ( pattern && pattern.isCharList )
                {
                    is_char_list = 1;
                    delete pattern.isCharList;
                }
                
                // get a fast customized matcher for < pattern >
                if ( T_NULL & T ) matcher = new SimpleMatcher(T_NULL, name, pattern, key);
                
                else if ( T_CHAR == T ) matcher = new SimpleMatcher(T_CHAR, name, pattern, key);
                
                else if ( T_STR & T ) matcher = (is_char_list) ? new SimpleMatcher(T_CHARLIST, name, pattern, key) : new SimpleMatcher(T_STR, name, pattern, key);
                
                else if ( /*T_REGEX*/T_ARRAY & T ) matcher = new SimpleMatcher(T_REGEX, name, pattern, key);
                
                // unknown
                else matcher = pattern;
                
                cachedMatchers[ name ] = matcher;
            }
            
            return cachedMatchers[ name ];
        },
        
        getCompositeMatcher = function(name, tokens, RegExpID, combined, cachedRegexes, cachedMatchers) {
            
            if ( !cachedMatchers[ name ] )
            {
                var tmp, i, l, l2, array_of_arrays = 0, has_regexs = 0, is_char_list = 1, T1, T2;
                var matcher;
                
                tmp = make_array( tokens );
                l = tmp.length;
                
                if ( 1 == l )
                {
                    matcher = getSimpleMatcher( name, getRegexp( tmp[0], RegExpID, cachedRegexes ), 0, cachedMatchers );
                }
                else if ( 1 < l /*combined*/ )
                {   
                    l2 = (l>>1) + 1;
                    // check if tokens can be combined in one regular expression
                    // if they do not contain sub-arrays or regular expressions
                    for (i=0; i<=l2; i++)
                    {
                        T1 = get_type( tmp[i] );
                        T2 = get_type( tmp[l-1-i] );
                        
                        if ( (T_CHAR != T1) || (T_CHAR != T2) ) 
                        {
                            is_char_list = 0;
                        }
                        
                        if ( (T_ARRAY & T1) || (T_ARRAY & T2) ) 
                        {
                            array_of_arrays = 1;
                            //break;
                        }
                        else if ( hasPrefix( tmp[i], RegExpID ) || hasPrefix( tmp[l-1-i], RegExpID ) )
                        {
                            has_regexs = 1;
                            //break;
                        }
                    }
                    
                    if ( is_char_list && ( !combined || !( T_STR & get_type(combined) ) ) )
                    {
                        tmp = tmp.slice().join('');
                        tmp.isCharList = 1;
                        matcher = getSimpleMatcher( name, tmp, 0, cachedMatchers );
                    }
                    else if ( combined && !(array_of_arrays || has_regexs) )
                    {   
                        matcher = getSimpleMatcher( name, getCombinedRegexp( tmp, combined ), 0, cachedMatchers );
                    }
                    else
                    {
                        for (i=0; i<l; i++)
                        {
                            if ( T_ARRAY & get_type( tmp[i] ) )
                                tmp[i] = getCompositeMatcher( name + '_' + i, tmp[i], RegExpID, combined, cachedRegexes, cachedMatchers );
                            else
                                tmp[i] = getSimpleMatcher( name + '_' + i, getRegexp( tmp[i], RegExpID, cachedRegexes ), i, cachedMatchers );
                        }
                        
                        matcher = (l > 1) ? new CompositeMatcher( name, tmp ) : tmp[0];
                    }
                }
                
                cachedMatchers[ name ] = matcher;
            }
            
            return cachedMatchers[ name ];
        },
        
        getBlockMatcher = function(name, tokens, RegExpID, cachedRegexes, cachedMatchers) {
            
            if ( !cachedMatchers[ name ] )
            {
                var tmp, i, l, start, end, t1, t2;
                
                // build start/end mappings
                start = []; end = [];
                tmp = make_array_2( tokens ); // array of arrays
                for (i=0, l=tmp.length; i<l; i++)
                {
                    t1 = getSimpleMatcher( name + '_0_' + i, getRegexp( tmp[i][0], RegExpID, cachedRegexes ), i, cachedMatchers );
                    if (tmp[i].length>1)
                    {
                        if ( hasPrefix( tmp[i][1], RegExpID ) )
                            t2 = getSimpleMatcher( name + '_1_' + i, getRegexp( tmp[i][1], RegExpID, cachedRegexes ), i, cachedMatchers );
                        else
                            t2 = tmp[i][1];
                    }
                    else
                    {
                        t2 = t1;
                    }
                    start.push( t1 );  end.push( t2 );
                }
                
                cachedMatchers[ name ] = new BlockMatcher(name, start, end);
            }
            
            return cachedMatchers[ name ];
        }
    ;
    
    //
    // tokenizer factories
    var
        SimpleToken = Class({
            
            constructor : function(name, token, style) {
                this.tt = (null===token) ? T_EOL : T_SIMPLE;
                this.tn = name;
                this.t = token;
                this.r = style;
                this.required = 0;
                this.ERR = 0;
                this.toClone = ['t', 'r'];
            },
            
            // tokenizer/token name
            tn : null,
            // tokenizer type
            tt : null,
            // tokenizer token matcher
            t : null,
            // tokenizer return val
            r : null,
            required : 0,
            ERR : 0,
            toClone: null,
            //actionBefore : null,
            //actionAfter : null,
            
            get : function( stream, state ) {
                var token = this.t;
                // match EOL ( with possible leading spaces )
                if ( null === token ) 
                { 
                    stream.spc();
                    if ( stream.eol() )
                    {
                        state.t = T_DEFAULT; 
                        //state.r = this.r; 
                        return this.r; 
                    }
                }
                // else match a simple token
                else if ( token.get(stream) ) 
                { 
                    state.t = this.tt; 
                    //state.r = this.r; 
                    return this.r; 
                }
                return false;
            },
            
            require : function(bool) { 
                this.required = (bool) ? 1 : 0;
                return this;
            },
            
            push : function(stack, pos, token) {
                if ( pos ) stack.splice( pos, 0, token );
                else stack.push( token );
                return this;
            },
            
            clone : function() {
                var t, toClone = this.toClone, toClonelen;
                
                t = new this.$class();
                t.tt = this.tt;
                t.tn = this.tn;
                //t.actionBefore = this.actionBefore;
                //t.actionAfter = this.actionAfter;
                //t.required = this.required;
                //t.ERR = this.ERR;
                
                if (toClone && toClone.length)
                {
                    toClonelen = toClone.length;
                    for (var i=0; i<toClonelen; i++)   
                        t[ toClone[i] ] = this[ toClone[i] ];
                }
                return t;
            },
            
            toString : function() {
                return ['[', 'Tokenizer: ', this.tn, ', Matcher: ', ((this.t) ? this.t.toString() : null), ']'].join('');
            }
        }),
        
        BlockToken = Class(SimpleToken, {
            
            constructor : function(type, name, token, style, allowMultiline, escChar) {
                this.$super('constructor', name, token, style);
                this.tt = type;
                // a block is multiline by default
                this.mline = ( 'undefined' == typeof(allowMultiline) ) ? 1 : allowMultiline;
                this.esc = escChar || "\\";
                this.toClone = ['t', 'r', 'mline', 'esc'];
            },    
            
            mline : 0,
            esc : null,
            
            get : function( stream, state ) {
            
                var ended = 0, found = 0, endBlock, next = "", continueToNextLine, stackPos, 
                    allowMultiline = this.mline, startBlock = this.t, thisBlock = this.tn,
                    charIsEscaped = 0, isEscapedBlock = (T_ESCBLOCK == this.tt), escChar = this.esc
                ;
                
                // comments in general are not required tokens
                if ( T_COMMENT == this.tt ) this.required = 0;
                
                if ( state.inBlock == thisBlock )
                {
                    found = 1;
                    endBlock = state.endBlock;
                }    
                else if ( !state.inBlock && (endBlock = startBlock.get(stream)) )
                {
                    found = 1;
                    state.inBlock = thisBlock;
                    state.endBlock = endBlock;
                }    
                
                if ( found )
                {
                    stackPos = state.stack.length;
                    ended = endBlock.get(stream);
                    continueToNextLine = allowMultiline;
                    
                    if ( !ended )
                    {
                        while ( !stream.eol() ) 
                        {
                            //next = stream.nxt();
                            if ( !(isEscapedBlock && charIsEscaped) && endBlock.get(stream) ) 
                            {
                                ended = 1; 
                                break;
                            }
                            else
                            {
                                next = stream.nxt();
                            }
                            charIsEscaped = !charIsEscaped && next == escChar;
                        }
                    }
                    continueToNextLine = allowMultiline || (isEscapedBlock && charIsEscaped);
                    
                    if ( ended || !continueToNextLine )
                    {
                        state.inBlock = null;
                        state.endBlock = null;
                    }
                    else
                    {
                        this.push( state.stack, stackPos, this );
                    }
                    
                    state.t = this.tt;
                    //state.r = this.r; 
                    return this.r;
                }
                
                //state.inBlock = null;
                //state.endBlock = null;
                return false;
            }
        }),
                
        RepeatedTokens = Class(SimpleToken, {
                
            constructor : function( name, tokens, min, max ) {
                this.tt = T_REPEATED;
                this.tn = name || null;
                this.t = null;
                this.ts = null;
                this.min = min || 0;
                this.max = max || INF;
                this.found = 0;
                this.toClone = ['ts', 'min', 'max', 'found'];
                if (tokens) this.set( tokens );
            },
            
            ts: null,
            min: 0,
            max: 1,
            found : 0,
            
            set : function( tokens ) {
                if ( tokens ) this.ts = make_array( tokens );
                return this;
            },
            
            get : function( stream, state ) {
            
                var i, token, style, tokens = this.ts, n = tokens.length, 
                    found = this.found, min = this.min, max = this.max,
                    tokensRequired = 0, streamPos, stackPos;
                
                this.ERR = 0;
                this.required = 0;
                streamPos = stream.pos;
                stackPos = state.stack.length;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i].clone().require(1);
                    style = token.get(stream, state);
                    
                    if ( false !== style )
                    {
                        ++found;
                        if ( found <= max )
                        {
                            // push it to the stack for more
                            this.found = found;
                            this.push( state.stack, stackPos, this.clone() );
                            this.found = 0;
                            return style;
                        }
                        break;
                    }
                    else if ( token.required )
                    {
                        tokensRequired++;
                    }
                    if ( token.ERR ) stream.bck2( streamPos );
                }
                
                this.required = found < min;
                this.ERR = found > max || (found < min && 0 < tokensRequired);
                return false;
            }
        }),
        
        EitherTokens = Class(RepeatedTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens, 1, 1);
                this.tt = T_EITHER;
            },
            
            get : function( stream, state ) {
            
                var style, token, i, tokens = this.ts, n = tokens.length, 
                    tokensRequired = 0, tokensErr = 0, streamPos;
                
                this.required = 1;
                this.ERR = 0;
                streamPos = stream.pos;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i].clone();
                    style = token.get(stream, state);
                    
                    tokensRequired += (token.required) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        return style;
                    }
                    else if ( token.ERR )
                    {
                        tokensErr++;
                        stream.bck2( streamPos );
                    }
                }
                
                this.required = (tokensRequired > 0);
                this.ERR = (n == tokensErr && tokensRequired > 0);
                return false;
            }
        }),
        /*        
        NoneTokens = Class(RepeatedTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens, 1, 1);
                this.tt = T_NONE;
            },
            
            get : function( stream, state ) {
            
                var style, token, i, tokens = this.ts, n = tokens.length, streamPos;
                
                this.required = 0;
                this.ERR = 0;
                streamPos = stream.pos;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i].clone();
                    style = token.get(stream, state);
                    
                    // if one of the tokens matched, return an error
                    if ( false !== style )
                    {
                        this.ERR = 1;
                        stream.bck2( streamPos );
                        return false;
                    }
                }
                
                this.required = 0;
                this.ERR = 0;
                return false;
            }
        }),
        */        
        AllTokens = Class(RepeatedTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens, 1, 1);
                this.tt = T_ALL;
            },
            
            get : function( stream, state ) {
                
                var token, style, tokens = this.ts, n = tokens.length,
                    streamPos, stackPos;
                
                this.required = 1;
                this.ERR = 0;
                streamPos = stream.pos;
                token = tokens[ 0 ].clone().require( 1 );
                style = token.get(stream, state);
                
                if ( false !== style )
                {
                    stackPos = state.stack.length;
                    for (var i=n-1; i>0; i--)
                        this.push( state.stack, stackPos+n-i, tokens[ i ].clone().require( 1 ) );
                    
                    return style;
                    
                }
                else if ( token.ERR )
                {
                    this.ERR = 1;
                    stream.bck2( streamPos );
                }
                else if ( token.required )
                {
                    this.ERR = 1;
                }
                
                return false;
            }
        }),
                
        NGramToken = Class(RepeatedTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens, 1, 1);
                this.tt = T_NGRAM;
            },
            
            get : function( stream, state ) {
                
                var token, style, tokens = this.ts, n = tokens.length, 
                    streamPos, stackPos;
                
                this.required = 0;
                this.ERR = 0;
                streamPos = stream.pos;
                token = tokens[ 0 ].clone().require( 0 );
                style = token.get(stream, state);
                
                if ( false !== style )
                {
                    stackPos = state.stack.length;
                    for (var i=n-1; i>0; i--)
                        this.push( state.stack, stackPos+n-i, tokens[ i ].clone().require( 1 ) );
                    
                    return style;
                }
                else if ( token.ERR )
                {
                    //this.ERR = 1;
                    stream.bck2( streamPos );
                }
                
                return false;
            }
        }),
                
        getTokenizer = function(tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords) {
            
            if ( null === tokenID )
            {
                // EOL Tokenizer
                var token = new SimpleToken( 
                            tokenID,
                            tokenID,
                            DEFAULTSTYLE
                        );
                
                // pre-cache tokenizer to handle recursive calls to same tokenizer
                cachedTokens[ tokenID ] = token;
            }
            else
            {
                tokenID = '' + tokenID;
                if ( !cachedTokens[ tokenID ] )
                {
                    var tok, token = null, type, combine, action, matchType, tokens;
                
                    // allow token to be literal and wrap to simple token with default style
                    tok = Lex[ tokenID ] || Syntax[ tokenID ] || { type: "simple", tokens: tokenID };
                    
                    if ( tok )
                    {
                        // tokens given directly, no token configuration object, wrap it
                        if ( (T_STR | T_ARRAY) & get_type( tok ) )
                        {
                            tok = { type: "simple", tokens: tok };
                        }
                        
                        // provide some defaults
                        //type = tok.type || "simple";
                        type = (tok.type) ? tokenTypes[ tok.type.toUpperCase().replace('-', '').replace('_', '') ] : T_SIMPLE;
                        tok.tokens = make_array( tok.tokens );
                        action = tok.action || null;
                        
                        if ( T_SIMPLE & type )
                        {
                            if ( tok.autocomplete ) getAutoComplete(tok, tokenID, keywords);
                            
                            // combine by default if possible using word-boundary delimiter
                            combine = ( 'undefined' ==  typeof(tok.combine) ) ? "\\b" : tok.combine;
                            token = new SimpleToken( 
                                        tokenID,
                                        getCompositeMatcher( tokenID, tok.tokens.slice(), RegExpID, combine, cachedRegexes, cachedMatchers ), 
                                        Style[ tokenID ] || DEFAULTSTYLE
                                    );
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                        }
                        
                        else if ( T_BLOCK & type )
                        {
                            if ( T_COMMENT & type ) getComments(tok, comments);

                            token = new BlockToken( 
                                        type,
                                        tokenID,
                                        getBlockMatcher( tokenID, tok.tokens.slice(), RegExpID, cachedRegexes, cachedMatchers ), 
                                        Style[ tokenID ] || DEFAULTSTYLE,
                                        tok.multiline,
                                        tok.escape
                                    );
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            if ( tok.interleave ) commentTokens.push( token.clone() );
                        }
                        
                        else if ( T_GROUP & type )
                        {
                            tokens = tok.tokens.slice();
                            if ( T_ARRAY & get_type( tok.match ) )
                            {
                                token = new RepeatedTokens(tokenID, null, tok.match[0], tok.match[1]);
                            }
                            else
                            {
                                matchType = groupTypes[ tok.match.toUpperCase() ]; 
                                
                                if (T_ZEROORONE == matchType) 
                                    token = new RepeatedTokens(tokenID, null, 0, 1);
                                
                                else if (T_ZEROORMORE == matchType) 
                                    token = new RepeatedTokens(tokenID, null, 0, INF);
                                
                                else if (T_ONEORMORE == matchType) 
                                    token = new RepeatedTokens(tokenID, null, 1, INF);
                                
                                else if (T_EITHER & matchType) 
                                    token = new EitherTokens(tokenID, null);
                                
                                else if (T_NONE & matchType) 
                                    token = new NoneTokens(tokenID, null);
                                
                                else //if (T_ALL == matchType)
                                    token = new AllTokens(tokenID, null);
                            }
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            
                            for (var i=0, l=tokens.length; i<l; i++)
                                tokens[i] = getTokenizer( tokens[i], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords );
                            
                            token.set(tokens);
                            
                        }
                        
                        else if ( T_NGRAM & type )
                        {
                            // get n-gram tokenizer
                            token = make_array_2( tok.tokens.slice() ).slice(); // array of arrays
                            var ngrams = [], ngram;
                            
                            for (var i=0, l=token.length; i<l; i++)
                            {
                                // get tokenizers for each ngram part
                                ngrams[i] = token[i].slice();
                                // get tokenizer for whole ngram
                                token[i] = new NGramToken( tokenID + '_NGRAM_' + i, null );
                            }
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            
                            for (var i=0, l=token.length; i<l; i++)
                            {
                                ngram = ngrams[i];
                                
                                for (var j=0, l2=ngram.length; j<l2; j++)
                                    ngram[j] = getTokenizer( ngram[j], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens,  comments, keywords );
                                
                                // get tokenizer for whole ngram
                                token[i].set( ngram );
                            }
                        }
                    }
                }
            }
            return cachedTokens[ tokenID ];
        },
        
        getComments = function(tok, comments) {
            // build start/end mappings
            var tmp = make_array_2(tok.tokens.slice()); // array of arrays
            var start, end, lead;
            for (i=0, l=tmp.length; i<l; i++)
            {
                start = tmp[i][0];
                end = (tmp[i].length>1) ? tmp[i][1] : tmp[i][0];
                lead = (tmp[i].length>2) ? tmp[i][2] : "";
                
                if ( null === end )
                {
                    // line comment
                    comments.line = comments.line || [];
                    comments.line.push( start );
                }
                else
                {
                    // block comment
                    comments.block = comments.block || [];
                    comments.block.push( [start, end, lead] );
                }
            }
        },
        
        getAutoComplete = function(tok, type, keywords) {
            var kws = [].concat(make_array(tok.tokens)).map(function(word) { return { word: word, meta: type }; });
            keywords.autocomplete = concat.apply( keywords.autocomplete || [], kws );
        },
        
        parseGrammar = function(grammar) {
            var RegExpID, tokens, numTokens, _tokens, 
                Style, Lex, Syntax, t, tokenID, token, tok,
                cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords;
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if ( grammar.__parsed ) return grammar;
            
            cachedRegexes = {}; cachedMatchers = {}; cachedTokens = {}; comments = {}; keywords = {};
            commentTokens = [];
            grammar = extend(grammar, defaultGrammar);
            
            RegExpID = grammar.RegExpID || null;
            grammar.RegExpID = null;
            delete grammar.RegExpID;
            
            Lex = grammar.Lex || {};
            grammar.Lex = null;
            delete grammar.Lex;
            
            Syntax = grammar.Syntax || {};
            grammar.Syntax = null;
            delete grammar.Syntax;
            
            Style = grammar.Style || {};
            
            _tokens = grammar.Parser || [];
            numTokens = _tokens.length;
            tokens = [];
            
            
            // build tokens
            for (t=0; t<numTokens; t++)
            {
                tokenID = _tokens[ t ];
                
                token = getTokenizer( tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords ) || null;
                
                if ( token )
                {
                    if ( T_ARRAY & get_type( token ) )  tokens = tokens.concat( token );
                    
                    else  tokens.push( token );
                }
            }
            
            grammar.Parser = tokens;
            grammar.cTokens = commentTokens;
            grammar.Style = Style;
            grammar.Comments = comments;
            grammar.Keywords = keywords;
            
            // this grammar is parsed
            grammar.__parsed = 1;
            
            return grammar;
        }
    ;
      
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
                
                // if EOL tokenizer is left on stack, pop it now
                if ( stack.length && T_EOL == stack[stack.length-1].tt )  stack.pop();
                
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
    var self = PrismGrammar = {
        
        VERSION : "0.4",
        
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


    /* main code ends here */
    
    /* export the module "PrismGrammar" */
    return PrismGrammar;
});