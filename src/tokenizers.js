
//
// matcher factories
var getChar = function( stream, eat ) {
        var self = this, matchedResult;    
        if ( matchedResult = stream.chr( self.tp, eat ) ) return [ self.tk, matchedResult ];
        return false;
    },
    
    getCharList = function( stream, eat ) {
        var self = this, matchedResult;    
        if ( matchedResult = stream.chl( self.tp, eat ) ) return [ self.tk, matchedResult ];
        return false;
    },
    
    getStr = function( stream, eat ) {
        var self = this, matchedResult;    
        if ( matchedResult = stream.str( self.tp, self.p, eat ) ) return [ self.tk, matchedResult ];
        return false;
    },
    
    getRegex = function( stream, eat ) {
        var self = this, matchedResult;    
        if ( matchedResult = stream.rex( self.tp, self.p, self.np, self.tg, eat ) ) return [ self.tk, matchedResult ];
        return false;
    },
    
    getNull = function( stream, eat ) {
        var self = this;
        // matches end-of-line
        (false !== eat) && stream.end( ); // skipToEnd
        return [ self.tk, "" ];
    }
;
    
function Matcher( type, name, pattern, key ) 
{
    var self = this;
    self.$class = Matcher;
    self.mt = T_SIMPLEMATCHER;
    self.tt = type || T_CHAR;
    self.tn = name;
    self.tk = key || 0;
    self.tg = 0;
    self.tp = null;
    self.p = null;
    self.np = null;
    
    // get a fast customized matcher for < pattern >
    switch ( self.tt )
    {
        case T_CHAR: case T_CHARLIST:
            self.tp = pattern;
            self.get = T_CHARLIST === self.tt ? getCharList : getChar;
            break;
        case T_STR:
            self.tp = pattern;
            self.p = {};
            self.p[ '' + pattern.charAt(0) ] = 1;
            self.get = getStr;
            break;
        case T_REGEX:
            self.tp = pattern[ 0 ];
            self.p = pattern[ 1 ].peek || null;
            self.np = pattern[ 1 ].negativepeek || null;
            self.tg = pattern[ 2 ] || 0;
            self.get = getRegex;
            break;
        case T_NULL:
            self.tp = null;
            self.get = getNull;
            break;
    }
}
Matcher[PROTO] = {
     constructor: Matcher
    
    ,$class: null
    // matcher type
    ,mt: null
    // token type
    ,tt: null
    // token name
    ,tn: null
    // token pattern
    ,tp: null
    // token pattern group
    ,tg: 0
    // token key
    ,tk: 0
    // pattern peek chars
    ,p: null
    // pattern negative peek chars
    ,np: null
    
    ,get: function( stream, eat ) {
        return false;
    }
    
    ,toString: function() {
        var self = this;
        return [
            '[', 'Matcher: ', 
            self.tn, 
            ', Pattern: ', 
            (self.tp ? self.tp.toString() : null), 
            ']'
        ].join('');
    }
};
    
function CompositeMatcher( name, matchers, useOwnKey ) 
{
    var self = this;
    self.$class = CompositeMatcher;
    self.mt = T_COMPOSITEMATCHER;
    self.tn = name;
    self.ms = matchers;
    self.ownKey = (false!==useOwnKey);
}
// extends Matcher
CompositeMatcher[PROTO] = Merge(Extend(Matcher[PROTO]), {
     constructor: CompositeMatcher
    
    // group of matchers
    ,ms: null
    ,ownKey: true
    
    ,get: function( stream, eat ) {
        var self = this, i, m, matchers = self.ms, l = matchers.length, useOwnKey = self.ownKey;
        for (i=0; i<l; i++)
        {
            // each one is a matcher in its own
            m = matchers[ i ].get( stream, eat );
            if ( m ) return useOwnKey ? [ i, m[1] ] : m;
        }
        return false;
    }
});
    
function BlockMatcher(name, start, end) 
{
    var self = this;
    self.$class = BlockMatcher;
    self.mt = T_BLOCKMATCHER;
    self.tn = name;
    self.s = new CompositeMatcher( self.tn + '_Start', start, false );
    self.e = end;
}
// extends Matcher
BlockMatcher[PROTO] = Merge(Extend(Matcher[PROTO]), {
     constructor: BlockMatcher
    // start block matcher
    ,s: null
    // end block matcher
    ,e: null
    
    ,get: function( stream, eat ) {
        var self = this, startMatcher = self.s, endMatchers = self.e, token;
        
        // matches start of block using startMatcher
        // and returns the associated endBlock matcher
        if ( token = startMatcher.get( stream, eat ) )
        {
            // use the token key to get the associated endMatcher
            var endMatcher = endMatchers[ token[0] ], m, 
                T = get_type( endMatcher ), T0 = startMatcher.ms[ token[0] ].tt;
            
            if ( T_REGEX === T0 )
            {
                // regex group number given, get the matched group pattern for the ending of this block
                if ( T_NUM === T )
                {
                    // the regex is wrapped in an additional group, 
                    // add 1 to the requested regex group transparently
                    m = token[1][ endMatcher+1 ];
                    endMatcher = new Matcher( (m.length > 1) ? T_STR : T_CHAR, self.tn + '_End', m );
                }
                // string replacement pattern given, get the proper pattern for the ending of this block
                else if ( T_STR === T )
                {
                    // the regex is wrapped in an additional group, 
                    // add 1 to the requested regex group transparently
                    m = groupReplace(endMatcher, token[1]);
                    endMatcher = new Matcher( (m.length > 1) ? T_STR : T_CHAR, self.tn + '_End', m );
                }
            }
            return endMatcher;
        }
        
        return false;
    }
});

function getSimpleMatcher( name, pattern, key, cachedMatchers ) 
{
    var T = get_type( pattern );
    
    if ( T_NUM === T ) return pattern;
    
    if ( !cachedMatchers[ name ] )
    {
        key = key || 0;
        var matcher, is_char_list = 0;
        
        if ( pattern && pattern.isCharList )
        {
            is_char_list = 1;
            delete pattern.isCharList;
        }
        
        // get a fast customized matcher for < pattern >
        if ( T_NULL & T ) matcher = new Matcher( T_NULL, name, pattern, key );
        
        else if ( T_CHAR === T ) matcher = new Matcher( T_CHAR, name, pattern, key );
        
        else if ( T_STR & T ) matcher = (is_char_list) ? new Matcher( T_CHARLIST, name, pattern, key ) : new Matcher( T_STR, name, pattern, key );
        
        else if ( /*T_REGEX*/T_ARRAY & T ) matcher = new Matcher( T_REGEX, name, pattern, key );
        
        // unknown
        else matcher = pattern;
        
        cachedMatchers[ name ] = matcher;
    }
    
    return cachedMatchers[ name ];
}

function getCompositeMatcher( name, tokens, RegExpID, combined, cachedRegexes, cachedMatchers ) 
{
    if ( !cachedMatchers[ name ] )
    {
        var tmp, i, l, l2, array_of_arrays = 0, 
            has_regexs = 0, is_char_list = 1, 
            T1, T2, matcher
        ;
        
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
                
                if ( (T_CHAR !== T1) || (T_CHAR !== T2) ) 
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
}

function getBlockMatcher( name, tokens, RegExpID, cachedRegexes, cachedMatchers ) 
{
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
                if ( T_REGEX === t1.tt && T_STR === get_type( tmp[i][1] ) && !hasPrefix( tmp[i][1], RegExpID ) )
                    t2 = tmp[i][1];
                else
                    t2 = getSimpleMatcher( name + '_1_' + i, getRegexp( tmp[i][1], RegExpID, cachedRegexes ), i, cachedMatchers );
            }
            else
            {
                t2 = t1;
            }
            start.push( t1 );  end.push( t2 );
        }
        
        cachedMatchers[ name ] = new BlockMatcher( name, start, end );
    }
    
    return cachedMatchers[ name ];
}

//
// tokenizer factories
var ACTION_PUSH = 1, ACTION_POP = 2/*,
    
    getEMPTY = function( stream, state ) {
        var self = this;
        
        self.ACT = 0;
        // match EMPTY token
        self.ERR = 0;
        self.REQ = 0;
        return true;
    },
    
    getEOL = function( stream, state ) {
        var self = this;
        
        self.ACT = 0;
        // match EOL ( with possible leading spaces )
        stream.spc( );
        if ( stream.eol( ) )  return self.id; 
        return false;
    },
    
    getNONSPC = function( stream, state ) {
        var self = this;
        
        self.ACT = 0;
        // match non-space
        self.ERR = ( self.REQ && stream.spc( ) && !stream.eol( ) ) ? 1 : 0;
        self.REQ = 0;
        return false;
    },
    
    getTOKEN = function( stream, state ) {
        var self = this, t = null;
        
        self.ACT = 0;
        // else match a simple token
        if ( t = self.tk.get( stream ) ) 
        { 
            if ( self.ta ) self.ACT = self.act( t, state );
            return self.id; 
        }
        return false;
    }*/
;
    
function Token( type, name, token ) 
{
    var self = this;
    self.$class = Token;
    self.tt = type || T_SIMPLE;
    self.id = name;
    self.tk = token;
    self.REQ = 0;
    self.ERR = 0;
    self.ACT = 0;
    self.CLONE = ['tk'];
}
Token[PROTO] = {
     constructor: Token
    
    ,$class: null
    ,sID: null
    // tokenizer/token name/id
    ,id: null
    // tokenizer type
    ,tt: null
    // tokenizer token matcher
    ,tk: null
    // tokenizer match action (optional)
    ,ta: null
    ,REQ: 0
    ,ERR: 0
    ,ACT: 0
    ,CLONE: null
    
    // tokenizer match action (optional)
    ,act: function( token, state ) {
        var action_def = this.ta || null, action, t, data = state.data;
        
        if ( action )
        {
            action = action_def[ 0 ]; t = action_def[ 1 ];
            
            if ( ACTION_POP === action )
            {
                if ( t )
                {
                    if ( token )
                        t = T_NUM === get_type( t ) ? token[1][ t ] : groupReplace( t, token[1] );
                    
                    if ( data.isEmpty( ) || t !== data.peek( ) ) return t;
                }
                data.pop( );
            }
            
            else if ( (ACTION_PUSH === action) && t )
            {
                if ( token )
                    t = T_NUM === get_type( t ) ? token[1][ t ] : groupReplace( t, token[1] );
                data.push( t );
            }
        }
        return 0;
    }
    
    ,get: function( stream, state ) {
        var self = this, action = self.ta, token = self.tk, 
            type = self.tt, tokenID = self.id, t = null;
        
        self.ACT = 0;
        // match EMPTY token
        if ( T_EMPTY === type ) 
        { 
            self.ERR = 0;
            self.REQ = 0;
            return true;
        }
        // match EOL ( with possible leading spaces )
        else if ( T_EOL === type ) 
        { 
            stream.spc();
            if ( stream.eol() )
            {
                return tokenID; 
            }
        }
        // match non-space
        else if ( T_NONSPACE === type ) 
        { 
            self.ERR = ( self.REQ && stream.spc() && !stream.eol() ) ? 1 : 0;
            self.REQ = 0;
        }
        // else match a simple token
        else if ( t = token.get(stream) ) 
        { 
            if ( action ) self.ACT = self.act(t, state);
            return tokenID; 
        }
        return false;
    }
    
    ,req: function( bool ) { 
        this.REQ = !!bool;
        return this;
    }
    
    ,err: function( ) {
        var t = this;
        if ( t.REQ ) return 'Token "'+t.id+'" Expected';
        else if ( t.ACT ) return 'Token "'+t.ACT+'" No Match'
        return 'Syntax Error: "'+t.id+'"';
    }

    ,clone: function( ) {
        var self = this, t, i, toClone = self.CLONE, toClonelen;
        
        t = new self.$class( );
        t.tt = self.tt;
        t.id = self.id;
        t.tm = self.tm ? self.tm.slice() : self.tm;
        
        if ( toClone && toClone.length )
        {
            for (i=0, toClonelen = toClone.length; i<toClonelen; i++)   
                t[ toClone[i] ] = self[ toClone[i] ];
        }
        return t;
    }
    
    ,toString: function( ) {
        var self = this;
        return [
            '[', 'Tokenizer: ', 
            self.id, 
            ', Matcher: ', 
            (self.tk ? self.tk.toString() : null), 
            ']'
        ].join('');
    }
};
    
function BlockToken( type, name, token, allowMultiline, escChar, hasInterior ) 
{
    var self = this;
    self.$class = BlockToken;
    self.tt = type;
    self.id = name;
    self.tk = token;
    self.REQ = 0;
    self.ERR = 0;
    self.ACT = 0;
    // a block is multiline by default
    self.mline = 'undefined' === typeof(allowMultiline) ? 1 : allowMultiline;
    self.esc = escChar || "\\";
    self.inter = hasInterior;
    self.CLONE = ['tk', 'mline', 'esc', 'inter'];
}
// extends Token
BlockToken[PROTO] = Merge(Extend(Token[PROTO]), {
     constructor: BlockToken
     
    ,inter: 0
    ,mline: 0
    ,esc: null
    
    ,get: function( stream, state ) {
        var self = this, ended = 0, found = 0, endBlock, next = "", continueToNextLine, stackPos, 
            allowMultiline = self.mline, startBlock = self.tk, thisBlock = self.id, type = self.tt,
            hasInterior = self.inter, thisBlockInterior = (hasInterior) ? (thisBlock+'.inside') : thisBlock,
            charIsEscaped = 0, isEscapedBlock = T_ESCBLOCK === type, escChar = self.esc,
            isEOLBlock, alreadyIn, ret, streamPos, streamPos0, continueBlock
        ;
        
        /*
            This tokenizer class handles many different block types ( BLOCK, COMMENT, ESC_BLOCK, SINGLE_LINE_BLOCK ),
            having different styles ( DIFFERENT BLOCK DELIMS/INTERIOR ) etc..
            So logic can become somewhat complex,
            descriptive names and logic used here for clarity as far as possible
        */
        
        // comments in general are not required tokens
        if ( T_COMMENT === type ) self.REQ = 0;
        
        alreadyIn = 0;
        if ( state.inBlock === thisBlock )
        {
            found = 1;
            endBlock = state.endBlock;
            alreadyIn = 1;
            ret = thisBlockInterior;
        }    
        else if ( !state.inBlock && (endBlock = startBlock.get(stream)) )
        {
            found = 1;
            state.inBlock = thisBlock;
            state.endBlock = endBlock;
            ret = thisBlock;
        }    
        
        if ( found )
        {
            stackPos = state.stack.pos( );
            
            isEOLBlock = (T_NULL === endBlock.tt);
            
            if ( hasInterior )
            {
                if ( alreadyIn && isEOLBlock && stream.sol( ) )
                {
                    self.REQ = 0;
                    state.inBlock = null;
                    state.endBlock = null;
                    return false;
                }
                
                if ( !alreadyIn )
                {
                    state.stack.pushAt( stackPos, self.clone( ), 'sID', thisBlock );
                    return ret;
                }
            }
            
            ended = endBlock.get( stream );
            continueToNextLine = allowMultiline;
            continueBlock = 0;
            
            if ( !ended )
            {
                streamPos0 = stream.pos;
                while ( !stream.eol( ) ) 
                {
                    streamPos = stream.pos;
                    if ( !(isEscapedBlock && charIsEscaped) && endBlock.get(stream) ) 
                    {
                        if ( hasInterior )
                        {
                            if ( stream.pos > streamPos && streamPos > streamPos0 )
                            {
                                ret = thisBlockInterior;
                                stream.bck2(streamPos);
                                continueBlock = 1;
                            }
                            else
                            {
                                ret = thisBlock;
                                ended = 1;
                            }
                        }
                        else
                        {
                            ret = thisBlock;
                            ended = 1;
                        }
                        break;
                    }
                    else
                    {
                        next = stream.nxt( );
                    }
                    charIsEscaped = !charIsEscaped && next == escChar;
                }
            }
            else
            {
                ret = (isEOLBlock) ? thisBlockInterior : thisBlock;
            }
            continueToNextLine = allowMultiline || (isEscapedBlock && charIsEscaped);
            
            if ( ended || (!continueToNextLine && !continueBlock) )
            {
                state.inBlock = null;
                state.endBlock = null;
            }
            else
            {
                state.stack.pushAt( stackPos, self.clone( ), 'sID', thisBlock );
            }
            
            return ret;
        }
        
        //state.inBlock = null;
        //state.endBlock = null;
        return false;
    }
});
            
function RepeatedTokens( type, name, tokens, min, max ) 
{
    var self = this;
    self.$class = RepeatedTokens;
    self.tt = type || T_REPEATED;
    self.id = name || null;
    self.tk = null;
    self.ts = null;
    self.min = min || 0;
    self.max = max || INF;
    self.found = 0;
    self.CLONE = ['ts', 'min', 'max', 'found'];
    if ( tokens ) self.set( tokens );
}
// extends Token
RepeatedTokens[PROTO] = Merge(Extend(Token[PROTO]), {
     constructor: RepeatedTokens
     
    ,ts: null
    ,min: 0
    ,max: 1
    ,found: 0
    
    ,set: function( tokens ) {
        if ( tokens ) this.ts = make_array( tokens );
        return this;
    }
    
    ,get: function( stream, state ) {
        var self = this, i, token, style, tokens = self.ts, n = tokens.length, 
            found = self.found, min = self.min, max = self.max,
            tokensRequired = 0, streamPos, stackPos, stackId;
        
        self.ERR = 0;
        self.REQ = 0;
        self.ACT = 0;
        streamPos = stream.pos;
        stackPos = state.stack.pos( );
        stackId = self.id+'_'+getId( );
        
        for (i=0; i<n; i++)
        {
            token = tokens[i].clone( ).req( 1 );
            style = token.get( stream, state );
            
            if ( false !== style )
            {
                ++found;
                if ( found <= max )
                {
                    // push it to the stack for more
                    self.found = found;
                    state.stack.pushAt( stackPos, self.clone( ), 'sID', stackId );
                    self.found = 0;
                    self.ACT = token.ACT;
                    return style;
                }
                break;
            }
            else if ( token.REQ )
            {
                tokensRequired++;
            }
            if ( token.ERR ) stream.bck2( streamPos );
        }
        
        self.REQ = found < min;
        self.ERR = found > max || (found < min && 0 < tokensRequired);
        return false;
    }
});
    
function EitherTokens( type, name, tokens ) 
{
    RepeatedTokens.call(this, type, name, tokens, 1, 1);
    this.$class = EitherTokens;
}
// extends RepeatedTokens
EitherTokens[PROTO] = Merge(Extend(RepeatedTokens[PROTO]), {
     constructor: EitherTokens
     
    ,get: function( stream, state ) {
        var self = this, style, token, i, tokens = self.ts, n = tokens.length, 
            tokensRequired = 0, tokensErr = 0, streamPos;
        
        self.REQ = 1;
        self.ERR = 0;
        self.ACT = 0;
        streamPos = stream.pos;
        
        for (i=0; i<n; i++)
        {
            token = tokens[i].clone().req( 1 );
            style = token.get(stream, state);
            
            tokensRequired += (token.REQ) ? 1 : 0;
            
            if ( false !== style )
            {
                self.ACT = token.ACT;
                return style;
            }
            else if ( token.ERR )
            {
                tokensErr++;
                stream.bck2( streamPos );
            }
        }
        
        self.REQ = (tokensRequired > 0);
        self.ERR = (n == tokensErr && tokensRequired > 0);
        return false;
    }
});

function AllTokens( type, name, tokens ) 
{
    RepeatedTokens.call(this, type, name, tokens, 1, 1);
    this.$class = AllTokens;
}
// extends RepeatedTokens
AllTokens[PROTO] = Merge(Extend(RepeatedTokens[PROTO]), {
     constructor: AllTokens
    
    ,get: function( stream, state ) {
        var self = this, token, style, tokens = self.ts, n = tokens.length,
            streamPos, stackPos, stackId;
        
        self.REQ = 1;
        self.ERR = 0;
        self.ACT = 0;
        streamPos = stream.pos;
        stackPos = state.stack.pos();
        token = tokens[ 0 ].clone().req( 1 );
        style = token.get(stream, state);
        stackId = self.id+'_'+getId();
        
        if ( false !== style )
        {
            // not empty token
            if ( true !== style )
            {
                for (var i=n-1; i>0; i--)
                    state.stack.pushAt( stackPos+n-i-1, tokens[ i ].clone().req( 1 ), 'sID', stackId );
            }
                
            self.ACT = token.ACT;
            return style;
        }
        else if ( token.ERR /*&& token.REQ*/ )
        {
            self.ERR = 1;
            stream.bck2( streamPos );
        }
        else if ( token.REQ )
        {
            self.ERR = 1;
        }
        
        return false;
    }
});
            
function NGramToken( type, name, tokens ) 
{
    RepeatedTokens.call(this, type, name, tokens, 1, 1);
    this.$class = NGramToken;
}
// extends RepeatedTokens
NGramToken[PROTO] = Merge(Extend(RepeatedTokens[PROTO]), {
     constructor: NGramToken
     
    ,get: function( stream, state ) {
        var self = this, token, style, tokens = self.ts, n = tokens.length, 
            streamPos, stackPos, stackId, i;
        
        self.REQ = 0;
        self.ERR = 0;
        self.ACT = 0;
        streamPos = stream.pos;
        stackPos = state.stack.pos();
        token = tokens[ 0 ].clone().req( 0 );
        style = token.get(stream, state);
        stackId = self.id+'_'+getId();
        
        if ( false !== style )
        {
            // not empty token
            if ( true !== style )
            {
                for (i=n-1; i>0; i--)
                    state.stack.pushAt( stackPos+n-i-1, tokens[ i ].clone().req( 1 ), 'sID', stackId );
            }
            
            self.ACT = token.ACT;
            return style;
        }
        else if ( token.ERR )
        {
            stream.bck2( streamPos );
        }
        
        return false;
    }
});

var dashes_re = /[\-_]/g;
function getTokenizer( tokenID, RegExpID, Lex, Syntax, Style, 
                    cachedRegexes, cachedMatchers, cachedTokens, 
                    commentTokens, comments, keywords ) 
{
    var tok, token = null, type, combine, matchAction, matchType, tokens, subTokenizers,
        ngrams, ngram, i, l, j, l2, xtends, xtendedTok, 
        t, modifier, tok_id, alternations, alternation, a, al;
    
    if ( null === tokenID )
    {
        // EOL Tokenizer
        return new Token( T_EOL, 'EOL', tokenID );
    }
    
    else if ( "" === tokenID )
    {
        // NONSPACE Tokenizer
        return new Token( T_NONSPACE, 'NONSPACE', tokenID );
    }
    
    else if ( false === tokenID || 0 === tokenID )
    {
        // EMPTY Tokenizer
        return new Token( T_EMPTY, 'EMPTY', tokenID );
    }
    
    else if ( T_ARRAY & get_type( tokenID ) )
    {
        // literal n-gram as array
        t = tokenID;
        tokenID = "NGRAM_" + t.join("_");
        if ( !Syntax[ tokenID ] )
        {
            Syntax[ tokenID ] = {
                type: "ngram",
                tokens: t
            };
        }
    }
    
    tokenID = '' + tokenID;
    if ( cachedTokens[ tokenID ] ) return cachedTokens[ tokenID ];
    
    if ( Lex[ tokenID ] )
    {
        tok = Lex[ tokenID ];
        if ( T_STR_OR_ARRAY & get_type( tok ) )
        {
            // simple token given as literal token, wrap it
            tok = Lex[ tokenID ] = { type:"simple", tokens:tok };
        }
    }
    else if ( Syntax[ tokenID ] )
    {
        tok = Syntax[ tokenID ];
    }
    else
    {
        tok = tokenID;
    }
    
    if ( T_STR & get_type( tok ) )
    {
        t = tok;
        if ( 1 === t.length )
        {
            tok = Lex[ t ] = { type:"simple", tokens:t };
        }
        else
        {
            // shorthand notations for syntax groups
            alternations = t.split( ' | ' ).map( trim );
            al = alternations.length;
            if ( al > 1 )
            {
                // alternations, i.e: t1* | t2 | t3
                for (a=al-1; a>=0; a--)
                {
                    alternation = alternations[ a ];
                    if ( !alternation.length ) 
                    {
                        // empty token
                        alternations[ a ] = false;
                        continue;
                    }
                    if ( Lex[ alternation ] || Syntax[ alternation ] ) 
                    {
                        // subtoken is already defined
                        continue;
                    }
                    // check any modifiers
                    modifier = alternation.charAt( alternation.length-1 );
                    tok_id = alternation.slice( 0, -1 );
                    if ( Lex[ tok_id ] || Syntax[ tok_id ] )
                    {
                        if ( "*" === modifier ) // zero or more i.e: t*
                        {
                            Syntax[ alternation ] = { type:"group", match:"zeroOrMore", tokens:[tok_id] };
                        }
                        else if ( "+" === modifier ) // one or more i.e: t+
                        {
                            Syntax[ alternation ] = { type:"group", match:"oneOrMore", tokens:[tok_id] };
                        }
                        else if ( "?" === modifier ) // zero or one i.e: t?
                        {
                            Syntax[ alternation ] = { type:"group", match:"zeroOrOne", tokens:[tok_id] };
                        }
                        else if ( !Lex[ alternation ] && !Syntax[ alternation ] )
                        {
                            Lex[ alternation ] = { type:"simple", tokens:alternation };
                        }
                    }
                    else
                    {
                        // allow token to be literal and wrap to simple token with default style
                        Lex[ alternation ] = { type:"simple", tokens:alternation };
                    }
                }
                tok = Syntax[ t ] = { type:"group", match:"either", tokens:alternations };
            }
            else
            {
                modifier = t.charAt( t.length-1 );
                tok_id = t.slice( 0, -1 );
                if ( Lex[ tok_id ] || Syntax[ tok_id ] )
                {
                    if ( "*" === modifier ) // zero or more
                    {
                        tok = Syntax[ t ] = { type:"group", match:"zeroOrMore", tokens:[tok_id] };
                    }
                    else if ( "+" === modifier ) // one or more
                    {
                        tok = Syntax[ t ] = { type:"group", match:"oneOrMore", tokens:[tok_id] };
                    }
                    else if ( "?" === modifier ) // zero or one
                    {
                        tok = Syntax[ t ] = { type:"group", match:"zeroOrOne", tokens:[tok_id] };
                    }
                    else if ( !Lex[ t ] && !Syntax[ t ] )
                    {
                        tok = Lex[ t ] = { type:"simple", tokens:t };
                    }
                }
                else
                {
                    // allow token to be literal and wrap to simple token with default style
                    tok = Lex[ t ] = { type:"simple", tokens:t };
                }
            }
        }
    }
    
    // allow tokens to extend / reference other tokens
    while ( tok['extend'] )
    {
        xtends = tok['extend']; 
        xtendedTok = Lex[ xtends ] || Syntax[ xtends ];
        delete tok['extend'];
        if ( xtendedTok ) 
        {
            // tokens given directly, no token configuration object, wrap it
            if ( (T_STR | T_ARRAY) & get_type( xtendedTok ) )
            {
                xtendedTok = { type:"simple", tokens:xtendedTok };
            }
            tok = extend( xtendedTok, tok );
        }
        // xtendedTok may in itself extend another tok and so on,
        // loop and get all references
    }
    
    // provide some defaults
    if ( 'undefined' === typeof tok.type )
    {
        if ( tok['either'] )
        {
            tok.type = "group";
            tok.match = "either";
            tok.tokens = tok['either'];
            delete tok['either'];
        }
        else if ( tok['all'] || tok['sequence'] )
        {
            tok.type = "group";
            tok.match = "all";
            tok.tokens = tok['all'] || tok['sequence'];
            if ( tok['all'] ) delete tok['all'];
            else delete tok['sequence'];
        }
        else if ( tok['zeroOrMore'] )
        {
            tok.type = "group";
            tok.match = "zeroOrMore";
            tok.tokens = tok['zeroOrMore'];
            delete tok['zeroOrMore'];
        }
        else if ( tok['oneOrMore'] )
        {
            tok.type = "group";
            tok.match = "oneOrMore";
            tok.tokens = tok['oneOrMore'];
            delete tok['oneOrMore'];
        }
        else if ( tok['zeroOrOne'] )
        {
            tok.type = "group";
            tok.match = "zeroOrOne";
            tok.tokens = tok['zeroOrOne'];
            delete tok['zeroOrOne'];
        }
    }
    type = tok.type ? tokenTypes[ tok.type.toUpperCase( ).replace(dashes_re, '') ] : T_SIMPLE;
    
    if ( T_SIMPLE & type )
    {
        if ( "" === tok.tokens )
        {
            // NONSPACE Tokenizer
            token = new Token( T_NONSPACE, tokenID, tokenID );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }
        else if ( null === tok.tokens )
        {
            // EOL Tokenizer
            token = new Token( T_EOL, tokenID, tokenID );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }
        else if ( false === tok.tokens || 0 === tok.tokens )
        {
            // EMPTY Tokenizer
            token = new Token( T_EMPTY, tokenID, tokenID );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }
    }

    tok.tokens = make_array( tok.tokens );
    
    if ( T_SIMPLE & type )
    {
        if ( tok.autocomplete ) getAutoComplete( tok, tokenID, keywords );
        
        matchAction = null;
        if ( tok.push )
        {
            matchAction = [ ACTION_PUSH, tok.push ];
        }
        else if  ( 'undefined' !== typeof( tok.pop ) )
        {
            matchAction = [ ACTION_POP, tok.pop ];
        }
        
        // combine by default if possible using word-boundary delimiter
        combine = ( 'undefined' === typeof(tok.combine) ) ? "\\b" : tok.combine;
        token = new Token( T_SIMPLE, tokenID,
                    getCompositeMatcher( tokenID, tok.tokens.slice(), RegExpID, combine, cachedRegexes, cachedMatchers )
                );
        token.ta = matchAction;
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = token;
    }
    
    else if ( T_BLOCK & type )
    {
        if ( T_COMMENT & type ) getComments( tok, comments );

        token = new BlockToken( type, tokenID,
                    getBlockMatcher( tokenID, tok.tokens.slice(), RegExpID, cachedRegexes, cachedMatchers ), 
                    tok.multiline,
                    tok.escape,
                    // allow block delims / block interior to have different styles
                    Style[ tokenID + '.inside' ] ? 1 : 0
                );
        
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = token;
        if ( tok.interleave ) commentTokens.push( token.clone( ) );
    }
    
    else if ( T_GROUP & type )
    {
        tokens = tok.tokens.slice( );
        if ( T_ARRAY & get_type( tok.match ) )
        {
            token = new RepeatedTokens( T_REPEATED, tokenID, null, tok.match[0], tok.match[1] );
        }
        else
        {
            matchType = groupTypes[ tok.match.toUpperCase() ]; 
            
            if ( T_ZEROORONE === matchType ) 
                token = new RepeatedTokens( T_ZEROORONE, tokenID, null, 0, 1 );
            
            else if ( T_ZEROORMORE === matchType ) 
                token = new RepeatedTokens( T_ZEROORMORE, tokenID, null, 0, INF );
            
            else if ( T_ONEORMORE === matchType ) 
                token = new RepeatedTokens( T_ONEORMORE, tokenID, null, 1, INF );
            
            else if ( T_EITHER & matchType ) 
                token = new EitherTokens( T_EITHER, tokenID, null );
            
            else //if (T_ALL === matchType)
                token = new AllTokens( T_ALL, tokenID, null );
        }
        
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = token;
        
        subTokenizers = [];
        for (i=0, l=tokens.length; i<l; i++)
            subTokenizers = subTokenizers.concat( getTokenizer( tokens[i], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords ) );
        
        token.set( subTokenizers );
        
    }
    
    else if ( T_NGRAM & type )
    {
        // get n-gram tokenizer
        token = make_array_2( tok.tokens.slice() ).slice(); // array of arrays
        ngrams = [];
        
        for (i=0, l=token.length; i<l; i++)
        {
            // get tokenizers for each ngram part
            ngrams[i] = token[i].slice();
            // get tokenizer for whole ngram
            token[i] = new NGramToken( T_NGRAM, tokenID + '_NGRAM_' + i, null );
        }
        
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = token;
        
        for (i=0, l=token.length; i<l; i++)
        {
            ngram = ngrams[i];
            
            subTokenizers = [];
            for (j=0, l2=ngram.length; j<l2; j++)
                subTokenizers = subTokenizers.concat( getTokenizer( ngram[j], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens,  comments, keywords ) );
            
            // get tokenizer for whole ngram
            token[i].set( subTokenizers );
        }
    }
    return cachedTokens[ tokenID ];
}

function getComments( tok, comments ) 
{
    // build start/end mappings
    var tmp = make_array_2(tok.tokens.slice()); // array of arrays
    var start, end, lead, i, l;
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
}

function getAutoComplete( tok, type, keywords ) 
{
    var kws = [].concat(make_array(tok.tokens)).map(function(word) { return { word: word, meta: type }; });
    keywords.autocomplete = (keywords.autocomplete || []).concat( kws );
}

function parseGrammar( grammar ) 
{
    var RegExpID, tokens, numTokens, _tokens, 
        Style, Lex, Syntax, t, tokenID, token, tok,
        cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords;
    
    // grammar is parsed, return it
    // avoid reparsing already parsed grammars
    if ( grammar.__parsed ) return grammar;
    
    cachedRegexes = { }; cachedMatchers = { }; cachedTokens = { }; 
    comments = { }; keywords = { }; commentTokens = [ ];
    grammar = clone( grammar );
    
    RegExpID = grammar.RegExpID || null;
    grammar.RegExpID = null;
    delete grammar.RegExpID;
    
    Lex = grammar.Lex || { };
    grammar.Lex = null;
    delete grammar.Lex;
    
    Syntax = grammar.Syntax || { };
    grammar.Syntax = null;
    delete grammar.Syntax;
    
    Style = grammar.Style || { };
    
    _tokens = grammar.Parser || [ ];
    numTokens = _tokens.length;
    tokens = [ ];
    
    
    // build tokens
    for (t=0; t<numTokens; t++)
    {
        tokenID = _tokens[ t ];
        
        token = getTokenizer( tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords ) || null;
        
        if ( token )
        {
            if ( T_ARRAY & get_type( token ) ) tokens = tokens.concat( token );
            else tokens.push( token );
        }
    }
    
    grammar.Parser = tokens;
    grammar.cTokens = commentTokens;
    grammar.Style = Style;
    grammar.Comments = comments;
    grammar.Keywords = keywords;
    grammar.Extra = grammar.Extra || { };
    
    // this grammar is parsed
    grammar.__parsed = 1;
    return grammar;
}
