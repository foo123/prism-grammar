
//
// pattern factories

var Pattern, BlockPattern, CompositePattern,
    Token, ActionToken, BlockToken, CompositeToken;

function match_char( stream, eat ) 
{
    var self = this, p = self.pattern, c = stream.s.charAt(stream.pos) || null;
    if ( p === c ) 
    {
        if ( false !== eat ) stream.mov( 1 );
        return [ self.key, c ];
    }
    return false;
}

function match_charlist( stream, eat ) 
{
    var self = this, p = self.pattern, c = stream.s.charAt(stream.pos) || null;
    if ( c && (-1 < p.indexOf( c )) ) 
    {
        if ( false !== eat ) stream.mov( 1 );
        return [ self.key, c ];
    }
    return false;
}

function match_str( stream, eat ) 
{
    var self = this, p = self.pattern, n = p.length, s = stream.s;
    if ( p === s.substr(stream.pos, n) ) 
    {
        if ( false !== eat ) stream.mov( n );
        return [ self.key, p ];
    }
    return false;
}

function match_re( stream, eat ) 
{
    var self = this, p = self.pattern, s = stream.s, m;
    m = s.slice( stream.pos ).match( p[0] );
    if ( !m || m.index > 0 ) return false;
    if ( false !== eat ) stream.mov( m[ p[1]||0 ].length );
    return [ self.key, p[1] > 0 ? m[p[1]] : m ];
}

function match_null( stream, eat ) 
{
    var self = this;
    // up to end-of-line
    if ( false !== eat ) stream.end( ); // skipToEnd
    return [ self.key, "" ];
} 
    
Pattern = Class({
    constructor: function Pattern( name, pattern, type, key ) {
        var self = this;
        self.type = P_SIMPLE;
        self.name = name;
        self.pattern = null;
        self.ptype = type || T_STR;
        self.key = key || 0;
        
        // get a fast customized matcher for < pattern >
        switch ( self.ptype )
        {
            case T_NULL:
                self.pattern = null;
                self.match = match_null;
                break;
            case T_REGEX:
                self.pattern = T_REGEX&get_type(pattern) ? [pattern, 0] : [pattern[0], pattern[1]||0];
                self.match = match_re;
                break;
            case T_CHAR: case T_CHARLIST:
                self.pattern = pattern;
                self.match = T_CHARLIST === self.ptype ? match_charlist : match_char;
                break;
            case T_STR:
            default:
                self.pattern = pattern;
                self.match = match_str;
                break;
        }
    }
    
    // type
    ,type: null
    // pattern name
    ,name: null
    // pattern
    ,pattern: null
    // pattern type
    ,ptype: null
    // key
    ,key: 0
    
    ,dispose: function( ) {
        var self = this;
        self.type = null;
        self.name = null;
        self.pattern = null;
        self.ptype = null;
        self.key = null;
        return self;
    }
    
    ,match: function( stream, eat ) {
        return false;
    }
});
    
// extends Pattern
CompositePattern = Class(Pattern, {
    constructor: function CompositePattern( name, pattern, useOwnKey ) {
        var self = this;
        self.type = P_COMPOSITE;
        self.name = name;
        self.pattern = pattern;
        self.key = false!==useOwnKey;
    }
    
    ,match: function( stream, eat ) {
        var self = this, i, m, pattern = self.pattern, l = pattern.length, useOwnKey = self.key;
        for (i=0; i<l; i++)
        {
            // each one is a matcher in its own
            m = pattern[ i ].match( stream, eat );
            if ( m ) return useOwnKey ? [ i, m[1] ] : m;
        }
        return false;
    }
});
    
// extends Pattern
BlockPattern = Class(Pattern, {
    constructor: function BlockPattern( name, pattern ) {
        var self = this;
        self.type = P_BLOCK;
        self.name = name;
        self.pattern = pattern;
        self.pattern[0] = new CompositePattern( self.name + '_Start', self.pattern[0], false );
    }
    
    ,match: function( stream, eat ) {
        var self = this, pattern = self.pattern, 
            start = pattern[0], ends = pattern[1], end, 
            match, m, T, T0;
        
        // matches start of block using startMatcher
        // and returns the associated endBlock matcher
        if ( match = start.match( stream, eat ) )
        {
            // use the token key to get the associated endMatcher
            end = ends[ match[0] ];
            T = get_type( end ); T0 = start.pattern[ match[0] ].ptype;
            
            if ( T_REGEX === T0 )
            {
                // regex group number given, get the matched group pattern for the ending of this block
                if ( T_NUM === T )
                {
                    // the regex is wrapped in an additional group, 
                    // add 1 to the requested regex group transparently
                    m = match[1][ end+1 ];
                    end = new Pattern( self.name + '_End', m, m.length > 1 ? T_STR : T_CHAR );
                }
                // string replacement pattern given, get the proper pattern for the ending of this block
                else if ( T_STR === T )
                {
                    // the regex is wrapped in an additional group, 
                    // add 1 to the requested regex group transparently
                    m = group_replace( end, match[1] );
                    end = new Pattern( self.name + '_End', m, m.length > 1 ? T_STR : T_CHAR );
                }
            }
            return end;
        }
        
        return false;
    }
});



function get_re( r, rid, cachedRegexes )
{
    if ( !r || ((T_NUM|T_REGEX) & get_type(r)) ) return r;
    
    var l = rid ? (rid.length||0) : 0, i;
    
    if ( l && rid === r.substr(0, l) ) 
    {
        var regexSource = r.substr(l), delim = regexSource.charAt(0), flags = '',
            regexBody, regexID, regex, i, ch
        ;
        
        // allow regex to have delimiters and flags
        // delimiter is defined as the first character after the regexID
        i = regexSource.length;
        while ( i-- )
        {
            ch = regexSource.charAt(i);
            if ( delim === ch ) break;
            else if ('i' === ch.toLowerCase() ) flags = 'i';
        }
        regexBody = regexSource.substring(1, i);
        regexID = "^(" + regexBody + ")";
        
        if ( !cachedRegexes[ regexID ] )
        {
            regex = new RegExp( regexID, flags );
            
            // shared, light-weight
            cachedRegexes[ regexID ] = regex;
        }
        
        return cachedRegexes[ regexID ];
    }
    else
    {
        return r;
    }
}

function get_combined_re( tokens, boundary )
{
    var b = "", combined;
    if ( T_STR & get_type(boundary) ) b = boundary;
    combined = map( tokens.sort( by_length ), esc_re ).join( "|" );
    return [ new RegExp("^(" + combined + ")"+b), 1 ];
}

function get_simplematcher( name, pattern, key, cachedMatchers ) 
{
    var T = get_type( pattern );
    
    if ( T_NUM === T ) return pattern;
    if ( cachedMatchers[ name ] ) return cachedMatchers[ name ];
    
    key = key || 0;
    var matcher, is_char_list = 0;
    
    if ( pattern && pattern.isCharList )
    {
        is_char_list = 1;
        delete pattern.isCharList;
    }
    
    // get a fast customized matcher for < pattern >
    if ( T_NULL & T ) matcher = new Pattern( name, pattern, T_NULL, key );
    
    else if ( T_CHAR === T ) matcher = new Pattern( name, pattern, T_CHAR, key );
    
    else if ( T_STR & T ) matcher = new Pattern( name, pattern, is_char_list ? T_CHARLIST : T_STR, key );
    
    else if ( (T_REGEX|T_ARRAY) & T ) matcher = new Pattern( name, pattern, T_REGEX, key );
    
    // unknown
    else matcher = pattern;
    
    return cachedMatchers[ name ] = matcher;
}

function get_compositematcher( name, tokens, RegExpID, combined, cachedRegexes, cachedMatchers ) 
{
    if ( cachedMatchers[ name ] ) return cachedMatchers[ name ];
    
    var tmp, i, l, l2, array_of_arrays = 0, 
        has_regexs = 0, is_char_list = 1, 
        T1, T2, matcher
    ;
    
    tmp = make_array( tokens );
    l = tmp.length;
    
    if ( 1 === l )
    {
        matcher = get_simplematcher( name, get_re( tmp[0], RegExpID, cachedRegexes ), 0, cachedMatchers );
    }
    else if ( 1 < l /*combined*/ )
    {   
        l2 = (l>>>1) + 1;
        // check if tokens can be combined in one regular expression
        // if they do not contain sub-arrays or regular expressions
        for (i=0; i<=l2; i++)
        {
            T1 = get_type( tmp[i] ); T2 = get_type( tmp[l-1-i] );
            
            if ( (T_CHAR !== T1) || (T_CHAR !== T2) ) 
            {
                is_char_list = 0;
            }
            
            if ( (T_ARRAY & T1) || (T_ARRAY & T2) ) 
            {
                array_of_arrays = 1;
                //break;
            }
            else if ( (T_REGEX & T1) || (T_REGEX & T2) || 
                has_prefix( tmp[i], RegExpID ) || has_prefix( tmp[l-1-i], RegExpID ) )
            {
                has_regexs = 1;
                //break;
            }
        }
        
        if ( is_char_list && ( !combined || !( T_STR & get_type(combined) ) ) )
        {
            tmp = tmp.slice().join('');
            tmp.isCharList = 1;
            matcher = get_simplematcher( name, tmp, 0, cachedMatchers );
        }
        else if ( combined && !(array_of_arrays || has_regexs) )
        {   
            matcher = get_simplematcher( name, get_combined_re( tmp, combined ), 0, cachedMatchers );
        }
        else if ( array_of_arrays || has_regexs )
        {
            for (i=0; i<l; i++)
            {
                if ( T_ARRAY & get_type( tmp[i] ) )
                    tmp[i] = get_compositematcher( name + '_' + i, tmp[i], RegExpID, combined, cachedRegexes, cachedMatchers );
                else
                    tmp[i] = get_simplematcher( name + '_' + i, get_re( tmp[i], RegExpID, cachedRegexes ), i, cachedMatchers );
            }
            
            matcher = l > 1 ? new CompositePattern( name, tmp ) : tmp[0];
        }
        else /* strings */
        {
            tmp = tmp.sort( by_length );
            for (i=0; i<l; i++)
            {
                tmp[i] = get_simplematcher( name + '_' + i, get_re( tmp[i], RegExpID, cachedRegexes ), i, cachedMatchers );
            }
            
            matcher = l > 1 ? new CompositePattern( name, tmp ) : tmp[0];
        }
    }
    return cachedMatchers[ name ] = matcher;
}

function get_blockmatcher( name, tokens, RegExpID, cachedRegexes, cachedMatchers ) 
{
    if ( cachedMatchers[ name ] ) return cachedMatchers[ name ];

    var tmp, i, l, start, end, t1, t2;
    
    // build start/end mappings
    start = []; end = [];
    tmp = make_array_2( tokens ); // array of arrays
    for (i=0, l=tmp.length; i<l; i++)
    {
        t1 = get_simplematcher( name + '_0_' + i, get_re( tmp[i][0], RegExpID, cachedRegexes ), i, cachedMatchers );
        if (tmp[i].length>1)
        {
            if ( T_REGEX === t1.ptype && T_STR === get_type( tmp[i][1] ) && !has_prefix( tmp[i][1], RegExpID ) )
                t2 = tmp[i][1];
            else
                t2 = get_simplematcher( name + '_1_' + i, get_re( tmp[i][1], RegExpID, cachedRegexes ), i, cachedMatchers );
        }
        else
        {
            t2 = t1;
        }
        start.push( t1 );  end.push( t2 );
    }
    return cachedMatchers[ name ] = new BlockPattern( name, [start, end] );
}


//
// Token factories
    
Token = Class({
    constructor: function Token( type, name, token, msg ) {
        var self = this;
        self.type = type || T_SIMPLE;
        self.name = name;
        self.token = token;
        //self.pos = null;
        self.status = 0;
        self.msg = msg || null;
        self.$msg = null;
        self.$clone = null;
        if ( T_SOF === self.name ) self.name = '<start-of-file>';
        else if ( T_SOL === self.name ) self.name = '<start-of-line>';
        else if ( T_EOL === self.name ) self.name = '<end-of-line>';
        //else if ( T_EOF === self.name ) self.name = '<end-of-file>';
        else if ( T_EMPTY === self.name ) self.name = '<empty>';
        else if ( T_NONSPACE === self.name ) self.name = '<nonspace>';
    }
    
    // tokenizer/token name/id
    ,name: null
    // tokenizer type
    ,type: null
    // tokenizer token matcher
    ,token: null
    // tokenizer token position
    //,pos: null
    // tokenizer status
    ,status: 0
    // tokenizer err message
    ,msg: null
    ,$msg: null
    ,$clone: null
    ,$id: null
    
    ,dispose: function( ) {
        var self = this;
        self.type = null;
        self.name = null;
        self.token = null;
        //self.pos = null;
        self.status = null;
        self.msg = null;
        self.$msg = null;
        self.$clone = null;
        self.$id = null;
        return self;
    }

    ,clone: function( ) {
        var self = this, t, i, l, $clone = self.$clone;
        
        t = new self.constructor( );
        t.type = self.type;
        t.name = self.name;
        t.token = self.token;
        t.msg = self.msg;
        
        if ( $clone && $clone.length )
        {
            for (i=0,l=$clone.length; i<l; i++)   
                t[ $clone[i] ] = self[ $clone[i] ];
        }
        return t;
    }
    
    ,get: function( stream, state ) {
        var self = this, token = self.token, line, pos,
            type = self.type, tokenID = self.name, t = null;
        
        self.$msg = self.msg || null;
        state.token = null;
        //self.pos = null;
        line = state.line, pos = stream.pos;
        // match SOF (start-of-file)
        if ( T_SOF === type ) 
        { 
            if ( 0 === state.line ) return true;
        }
        // match SOL (start-of-line)
        else if ( T_SOL === type ) 
        { 
            if ( stream.sol() ) return true;
        }
        // match EOL (end-of-line) ( with possible leading spaces )
        else if ( T_EOL === type ) 
        { 
            stream.spc();
            if ( stream.eol() ) return tokenID;
        }
        /*// match EOF (end-of-file) ( with possible leading spaces )
        else if ( T_EOF === type ) 
        { 
            stream.spc();
            if ( stream.eol() ) return true;
        }*/
        // match EMPTY token
        else if ( T_EMPTY === type ) 
        { 
            self.status = 0;
            return true;
        }
        // match non-space
        else if ( T_NONSPACE === type ) 
        { 
            if ( (self.status & REQUIRED) && stream.spc() && !stream.eol() ) self.status |= ERROR;
            self.status &= CLEAR_REQUIRED;
        }
        // else match a simple token
        else if ( t = token.match(stream) ) 
        { 
            state.token = {
                name: tokenID,
                type: tokenID,
                value: stream.cur(),
                token: t[1],
                pos: [line,pos,line,stream.pos]
            };
            return tokenID; 
        }
        if ( self.status && self.$msg ) self.$msg = group_replace( self.$msg, tokenID, true );
        return false;
    }
    
    ,req: function( bool ) { 
        var self = this;
        if ( !bool ) self.status &= CLEAR_REQUIRED;
        else self.status |= REQUIRED;
        return self;
    }
    
    ,err: function( state, l1, c1, l2, c2 ) {
        var t = this, m, token = t.name;
        if ( t.$msg ) m = t.$msg;
        else if ( t.status & REQUIRED ) m = 'Token "'+token+'" Expected';
        else m = 'Syntax Error: "'+token+'"';
        if ( state && (state.status & ERRORS) )
        {
            state.err[l1+'_'+c1+'_'+l2+'_'+c2+'_'+token] = [l1, c1, l2, c2, m];
        }
        return m;
    }
});

// extends Token
ActionToken = Class(Token, {
    constructor: function ActionToken( type, name, action, msg, case_insensitive ) {
        var self = this;
        self.type = type || T_ACTION;
        self.name = name;
        self.token = action;
        //self.pos = null;
        self.status = 0;
        self.msg = msg || null;
        self.$msg = null;
        self.ci = !!case_insensitive;
        self.$clone = ['ci'];
    }
     
    ,ci: 0
    
    ,get: function( stream, state ) {
        var self = this, action_def = self.token || null, action, 
        t, t0, ns, msg, queu = state.queu, symb = state.symb, ctx = state.ctx, token = state.token,
        l1, c1, l2, c2, in_ctx, err = state.err, error, emsg, with_errors = !!(state.status&ERRORS),
        case_insensitive = self.ci;
        
        self.status = 0; self.$msg = null;
        
        // do action only if state.status handles (action) errors, else dont clutter
        if ( !action_def || (!with_errors && ((~A_OVERWR) & action_def[ 0 ])) ) return true;
        
        action = action_def[ 0 ]; t = action_def[ 1 ]; in_ctx = !!action_def[ 2 ];
        
        if ( A_OVERWR === action )
        {
            //if ( state.token ) state.token.type = t;
            state.$replace$ = t;
            return true;
        }
        
        msg = self.msg;
        if ( token && token.pos )
        {
            l1 = token.pos[0];
            c1 = token.pos[1];
            l2 = token.pos[2];
            c2 = token.pos[3];
        }
        else
        {
            l1 = l2 = state.line;
            c2 = stream.pos;
            c1 = token.value ? c2-token.value.length : c2-1;
        }
        
        if ( A_ERROR === action )
        {
            if ( msg ) self.$msg = token ? group_replace( msg, token.token, true ) : msg;
            else self.$msg = 'Error';
            error = l1+'_'+c1+'_'+l2+'_'+c2+'_'+self.name;
            err[error] = [l1,c1,l2,c2,self.err()];
            self.status |= ERROR;
            return false;
        }
        
        else if ( A_CTXSTART === action )
        {
            ctx.unshift({symb:{},queu:[]});
        }
        
        else if ( A_CTXEND === action )
        {
            if ( ctx.length ) ctx.shift();
        }
        
        else if ( A_EMPTY === action )
        {
            if ( in_ctx )
            {
                if ( ctx.length ) ctx[0].queu.length = 0;
            }
            else
            {
                queu.length = 0;
            }
        }
        
        /*else if ( A_INDENT === action )
        {
            // TODO
        }
        
        else if ( A_OUTDENT === action )
        {
            // TODO
        }*/
        
        else if ( A_UNIQUE === action )
        {
            if ( in_ctx )
            {
                if ( ctx.length ) symb = ctx[0].symb;
                else return true;
            }
            if ( token )
            {
                t0 = t[1]; ns = t[0];
                t0 = T_NUM === get_type( t0 ) ? token.token[ t0 ] : group_replace( t0, token.token, true );
                if ( case_insensitive ) t0 = t0[LOWER]();
                if ( !symb[HAS](ns) ) symb[ns] = { };
                if ( symb[ns][HAS](t0) )
                {
                    // duplicate
                    if ( msg ) self.$msg = group_replace( msg, t0, true );
                    else self.$msg = 'Duplicate "'+t0+'"';
                    emsg = self.err( );
                    error = symb[ns][t0][0]+'_'+symb[ns][t0][1]+'_'+symb[ns][t0][2]+'_'+symb[ns][t0][3]+'_'+self.name;
                    err[error] = [symb[ns][t0][0],symb[ns][t0][1],symb[ns][t0][2],symb[ns][t0][3],emsg];
                    error = l1+'_'+c1+'_'+l2+'_'+c2+'_'+self.name;
                    err[error] = [l1,c1,l2,c2,emsg];
                    self.status |= ERROR;
                    return false;
                }
                else
                {
                    symb[ns][t0] = [l1,c1,l2,c2];
                }
            }
        }
        
        else if ( A_POP === action )
        {
            if ( in_ctx )
            {
                if ( ctx.length ) queu = ctx[0].queu;
                else return true;
            }
            if ( t )
            {
                if ( token )
                    t = T_NUM === get_type( t ) ? token.token[ t ] : group_replace( t, token.token );
                
                if ( case_insensitive ) t = t[LOWER]();
                
                if ( !queu.length || t !== queu[0][0] ) 
                {
                    // no match
                    if ( queu.length )
                    {
                        if ( msg ) self.$msg = group_replace( msg, [queu[0][0],t], true );
                        else self.$msg = 'Tokens do not match "'+queu[0][0]+'","'+t+'"';
                        emsg = self.err( );
                        error = queu[0][1]+'_'+queu[0][2]+'_'+queu[0][3]+'_'+queu[0][4]+'_'+self.name;
                        err[error] = [queu[0][1],queu[0][2],queu[0][3],queu[0][4],emsg];
                        error = l1+'_'+c1+'_'+l2+'_'+c2+'_'+self.name;
                        err[error] = [l1,c1,l2,c2,emsg];
                    }
                    else
                    {
                        if ( msg ) self.$msg = group_replace( msg, ['',t], true );
                        else self.$msg = 'Token does not match "'+t+'"';
                        emsg = self.err( );
                        error = l1+'_'+c1+'_'+l2+'_'+c2+'_'+self.name;
                        err[error] = [l1,c1,l2,c2,emsg];
                    }
                    queu.shift( );
                    self.status |= ERROR;
                    return false;
                }
                else
                {
                    queu.shift( );
                }
            }
            else
            {
                // pop unconditionaly
                queu.shift( );
            }
        }
        
        else if ( (A_PUSH === action) && t )
        {
            if ( in_ctx )
            {
                if ( ctx.length ) queu = ctx[0].queu;
                else return true;
            }
            if ( token )
                t = T_NUM === get_type( t ) ? token.token[ t ] : group_replace( t, token.token );
            if ( case_insensitive ) t = t[LOWER]();
            queu.unshift( [t, l1, c1, l2, c2] );
        }
        return true;
    }
});
            
// extends Token
BlockToken = Class(Token, {
    constructor: function BlockToken( type, name, token, msg, multiline, escaped, has_interior ) {
        var self = this;
        self.type = type;
        self.name = name;
        self.token = token;
        //self.pos = null;
        self.status = 0;
        self.msg = msg || null;
        // a block is multiline by default
        self.mline = 'undefined' === typeof(multiline) ? true : !!multiline;
        self.esc = escaped;
        self.inter = has_interior;
        self.$msg = null;
        self.$clone = ['mline', 'esc', 'inter'];
    }
     
    ,inter: 0
    ,mline: 0
    ,esc: null
    
    ,get: function( stream, state ) {
        var self = this, ended = 0, found = 0, endBlock, next = "", continueToNextLine, stackPos, 
            allowMultiline = self.mline, startBlock = self.token, thisBlock = self.name, type = self.type,
            hasInterior = self.inter, thisBlockInterior = hasInterior ? (thisBlock+'.inside') : thisBlock,
            charIsEscaped = 0, escChar = self.esc, isEscapedBlock = !!escChar,
            isEOLBlock, alreadyIn, ret, streamPos, streamPos0, continueBlock,
            b_s, b_e, b_i, b_1='', b_2='', b_3='', b_21='', lin, col, stack = state.stack
        ;
        
        /*
            This tokenizer class handles many different block types ( BLOCK, COMMENT, ESC_BLOCK, SINGLE_LINE_BLOCK ),
            having different styles ( DIFFERENT BLOCK DELIMS/INTERIOR ) etc..
            So logic can become somewhat complex,
            descriptive names and logic used here for clarity as far as possible
        */
        
        self.$msg = self.msg || null;
        //self.pos = null;
        lin = state.line; col = stream.pos;
        // comments in general are not required tokens
        if ( T_COMMENT === type ) self.status &= CLEAR_REQUIRED;
        
        alreadyIn = 0;
        if ( state.block && state.block.name === thisBlock )
        {
            found = 1;
            endBlock = state.block.end;
            alreadyIn = 1;
            ret = thisBlockInterior;
            b_s = state.block.s;
            b_i = state.block.i;
            b_e = state.block.e;
            b_1 = state.block._s;
            b_2 = state.block._i;
            b_21 = '';
        }    
        else if ( (!state.block||!state.block.name) && (endBlock = startBlock.match(stream)) )
        {
            found = 1;
            b_s = [lin,col];
            b_i = [[lin,stream.pos],[lin,stream.pos]];
            b_e = [lin,stream.pos];
            b_1 = stream.cur( );
            b_2 = '';
            b_21 = '';
            b_3 = '';
            state.block = {name:thisBlock, end:endBlock, s:b_s, i:b_i, e:b_e, _s:b_1, _i:b_2, _e:b_3};
            ret = thisBlock;
        }    
        
        if ( found )
        {
            stackPos = stack.length;
            
            isEOLBlock = T_NULL === endBlock.type;
            
            if ( hasInterior )
            {
                if ( alreadyIn && isEOLBlock && stream.sol( ) )
                {
                    self.status &= CLEAR_REQUIRED;
                    // ?????
                    state.token = null;
                    state.block = null;
                    return false;
                }
                
                if ( !alreadyIn )
                {
                    push_at( stack, stackPos, self.clone( ), '$id', thisBlock );
                    return ret;
                }
            }
            
            ended = endBlock.match( stream );
            continueToNextLine = allowMultiline;
            continueBlock = 0;
            
            if ( !ended )
            {
                streamPos0 = stream.pos;
                while ( !stream.eol( ) ) 
                {
                    streamPos = stream.pos;
                    if ( !(isEscapedBlock && charIsEscaped) && endBlock.match(stream) ) 
                    {
                        if ( hasInterior )
                        {
                            if ( stream.pos > streamPos && streamPos > streamPos0 )
                            {
                                ret = thisBlockInterior;
                                stream.bck(streamPos);
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
                        b_3 = stream.cur().slice(b_21.length);
                        break;
                    }
                    else
                    {
                        next = stream.nxt( );
                        b_21 += next;
                    }
                    charIsEscaped = !charIsEscaped && next === escChar;
                }
            }
            else
            {
                ret = isEOLBlock ? thisBlockInterior : thisBlock;
                b_3 = stream.cur().slice(b_21.length);
            }
            continueToNextLine = allowMultiline || (isEscapedBlock && charIsEscaped);
            
            b_i[1] = [lin, streamPos];
            b_e = [lin, stream.pos];
            if ( ended || (!continueToNextLine && !continueBlock) )
            {
                state.block = null;
            }
            else
            {
                state.block.i = b_i;
                state.block.e = b_e;
                state.block._i += b_21;
                state.block._e = b_3;
                push_at( stack, stackPos, self.clone( ), '$id', thisBlock );
            }
            state.token = {
                name: thisBlock,
                type: ret,
                value: stream.cur(),
                token: [b_1+b_2+b_21+b_3, b_2+b_21, b_1, b_3],
                pos: [b_s[0],b_s[1],b_e[0],b_e[1]]
            };
            return ret;
        }
        if ( self.status && self.$msg ) self.$msg = group_replace( self.$msg, thisBlock, true );
        return false;
    }
});
            
// extends Token
CompositeToken = Class(Token, {
    constructor: function CompositeToken( type, name, tokens, msg, min, max ) {
        var self = this;
        self.type = type ? type : T_REPEATED;
        self.name = name || null;
        self.token = null;
        //self.pos = null;
        self.status = 0;
        self.msg = msg || null;
        self.min = min || 0;
        self.max = max || INF;
        self.found = 0;
        self.$msg = null;
        self.$clone = ['min', 'max', 'found'];
        if ( tokens ) self.set( tokens );
    }
     
    ,min: 0
    ,max: 1
    ,found: 0
    
    ,set: function( tokens ) {
        if ( tokens ) this.token = make_array( tokens );
        return this;
    }
    
    ,get: function( stream, state ) {
        var self = this, i, i0, type = self.type, token, action, style, 
            tokens = self.token, n = tokens.length, t, pos, stack, err,
            found, min, max, tokensRequired, tokensErr, streamPos, stackPos, stackId, match_all;
        
        self.$msg = self.msg || null;
        self.status &= CLEAR_ERROR;
        streamPos = stream.pos;
        stack = state.stack;
        if ( T_EITHER === type )
        {
            tokensRequired = 0; tokensErr = 0;
            self.status |= REQUIRED;
            err = [];
            
            for (i=0; i<n; i++)
            {
                token = tokens[i].clone().req( 1 );
                style = token.get(stream, state);
                
                if ( token.status & REQUIRED )
                {
                    tokensRequired++;
                    err.push(token.err());
                }
                
                if ( false !== style )
                {
                    return style;
                }
                else if ( token.status & ERROR )
                {
                    tokensErr++;
                    stream.bck( streamPos );
                }
            }
            
            if ( tokensRequired > 0 ) self.status |= REQUIRED;
            else self.status &= CLEAR_REQUIRED;
            if ( (n === tokensErr) && (tokensRequired > 0) ) self.status |= ERROR;
            else self.status &= CLEAR_ERROR;
            if ( self.status && !self.$msg && err.length ) self.$msg = err.join(' | ');
            return false;
        }
        else if ( T_SEQUENCE_OR_NGRAM & type )
        {
            match_all = type & T_SEQUENCE ? 1 : 0;
            if ( match_all ) self.status |= REQUIRED;
            else self.status &= CLEAR_REQUIRED;
            stackPos = stack.length;
            stackId = self.name+'_'+get_id();
            i0 = 0;
            token = tokens[ i0 ].clone().req( match_all );
            style = token.get(stream, state);
            
            if ( false !== style )
            {
                // not empty token
                if ( true !== style || T_EMPTY !== token.type )
                {
                    for (i=n-1; i>i0; i--)
                        push_at( stack, stackPos+n-i-1, tokens[ i ].clone().req( 1 ), '$id', stackId );
                }
                    
                return style;
            }
            else if ( token.status & ERROR /*&& token.REQ*/ )
            {
                if ( match_all ) self.status |= ERROR;
                else self.status &= CLEAR_ERROR;
                stream.bck( streamPos );
            }
            else if ( match_all && (token.status & REQUIRED) )
            {
                self.status |= ERROR;
            }
            
            if ( self.status && !self.$msg ) self.$msg = token.err();
            return false;
        }
        else
        {
            tokensRequired = 0;
            found = self.found; min = self.min; max = self.max;
            self.status &= CLEAR_REQUIRED;
            stackPos = stack.length;
            stackId = self.name+'_'+get_id( );
            err = [];
            
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
                        push_at( stack, stackPos, self.clone( ), '$id', stackId );
                        self.found = 0;
                        return style;
                    }
                    break;
                }
                else if ( token.status & REQUIRED )
                {
                    tokensRequired++;
                    err.push(token.err());
                }
                if ( token.status&ERROR ) stream.bck( streamPos );
            }
            
            if ( found < min ) self.status |= REQUIRED;
            else self.status &= CLEAR_REQUIRED;
            if ( (found > max) || (found < min && 0 < tokensRequired) ) self.status |= ERROR;
            else self.status &= CLEAR_ERROR;
            if ( self.status && !self.$msg && err.length ) self.$msg = err.join(' | ');
            return false;
        }
    }
});

    
function get_comments( tok, comments ) 
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

function get_autocomplete( tok, type, keywords ) 
{
    var meta = tok.meta || type,
        kws = map(make_array(tok.tokens), function(word){return {word:word, meta:meta};});
    keywords.autocomplete = (keywords.autocomplete || []).concat( kws );
}

function get_delimited( src, delim, esc, collapse_esc )
{
    var c, i=src.pos, l=src.length, s='', escaped, is_esc, esc_cnt, can_be_escaped=!!esc;
    if ( can_be_escaped )
    {
        collapse_esc = !!collapse_esc; escaped = false; esc_cnt = 0;
        while ( i<l )
        {
            c = src.charAt(i++);
            if ( delim === c && !escaped ) break;
            is_esc = esc === c; escaped = !escaped && is_esc;
            if ( collapse_esc )
            {
                if ( is_esc ) esc_cnt++;
                if ( !is_esc || esc_cnt&2 )
                {
                    s += c;
                    esc_cnt = 0;
                }
            }
            else s += c;
        }
        if ( esc_cnt&2 ) s += esc;
        src.pos = i;
        return s;
    }
    while ( i<l )
    {
        c = src.charAt(i++);
        if ( delim === c ) break;
        s += c;
    }
    src.pos = i;
    return s;
}

function parse_peg_bnf_notation( tok, Lex, Syntax )
{
    var alternation, sequence, token, literal, repeat, 
        t, c, fl, prev_token, curr_token, stack, tmp, overwrite = false;
    
    t = new String( trim(tok) );
    t.pos = 0;
    
    if ( 1 === t.length )
    {
        curr_token = '' + tok;
        if ( !Lex[ curr_token ] ) Lex[ curr_token ] = {type:"simple", tokens:tok};
        tok = curr_token;
    }
    else
    {
        // parse PEG/BNF-like shorthand notations for syntax groups
        alternation = [ ];
        sequence = [ ];
        token = '';
        stack = [];
        while ( t.pos < t.length )
        {
            c = t.charAt( t.pos++ );
            
            if ( peg_bnf_notation_re.test( c ) )
            {
                if ( token.length )
                {
                    if ( overwrite )
                    {
                        // interpret as overwrite action
                        curr_token = 'overwrite_$' + token + '$';
                        if ( !Lex[curr_token] )
                        {
                            Lex[ curr_token ] = {
                                type: 'action',
                                overwrite: token
                            };
                        }
                        sequence.push( curr_token );
                        overwrite = false;
                    }
                    else if ( '0' === token )
                    {
                        // interpret as empty tokenizer
                        sequence.push( T_EMPTY );
                    }
                    else if ( '^^' === token )
                    {
                        // interpret as SOF tokenizer
                        sequence.push( T_SOF );
                    }
                    else if ( '^' === token )
                    {
                        // interpret as SOL tokenizer
                        sequence.push( T_SOL );
                    }
                    else if ( '$' === token )
                    {
                        // interpret as EOL tokenizer
                        sequence.push( T_EOL );
                    }
                    /*else if ( '$$' === token )
                    {
                        // interpret as EOF tokenizer
                        sequence.push( T_EOF );
                    }*/
                    else
                    {
                        if ( !Lex[token] && !Syntax[token] )
                        {
                            Lex[ token ] = {
                                type: 'simple',
                                tokens: token
                            };
                        }
                        sequence.push( token );
                    }
                    token = '';
                }
            
                if ( '.' === c )
                {
                    overwrite = true;
                }
                
                else if ( '"' === c || "'" === c )
                {
                    overwrite = false;
                    // literal token, quoted
                    literal = get_delimited( t, c, false );
                    if ( literal.length )
                    {
                        curr_token = '' + literal;
                        if ( !Lex[curr_token] )
                        {
                            Lex[curr_token] = {
                                type: 'simple',
                                tokens: literal
                            };
                        }
                        sequence.push( curr_token );
                    }
                    else
                    {
                        // interpret as non-space tokenizer
                        sequence.push( '' );
                    }
                }
                
                else if ( '/' === c )
                {
                    overwrite = false;
                    // literal regex token
                    literal = get_delimited( t, c, '\\', true ); fl = '';
                    if ( literal.length )
                    {
                        if ( t.pos < t.length && 'i' === t.charAt(t.pos) ) { t.pos++; fl = 'i'; }
                        curr_token = '/' + literal + '/' + fl;
                        if ( !Lex[curr_token] )
                        {
                            Lex[curr_token] = {
                                type: 'simple',
                                tokens: new RegExp("^(" + literal + ")",fl)
                            };
                        }
                        sequence.push( curr_token );
                    }
                }
                
                else if ( '*' === c || '+' === c || '?' === c )
                {
                    overwrite = false;
                    // repeat modifier, applies to token that comes before
                    prev_token = sequence.pop( );
                    curr_token = '' + prev_token + c;
                    if ( !Syntax[ curr_token ] )
                    {
                        Syntax[ curr_token ] = {
                            type: 'group',
                            match: '*' === c ? 'zeroOrMore' : ('+' === c ? 'oneOrMore' : 'zeroOrOne'),
                            tokens: [prev_token]
                        }
                    }
                    sequence.push( curr_token );
                }
                
                else if ( '{' === c )
                {
                    overwrite = false;
                    // literal repeat modifier, applies to token that comes before
                    repeat = get_delimited( t, '}', false );
                    repeat = map( repeat.split( ',' ), trim );
                    
                    if ( !repeat[0].length ) repeat[0] = 0; // {,m} match 0 times or more
                    else repeat[0] = parseInt(repeat[0], 10) || 0;// {n,m} match n times up to m times
                    if ( 0 > repeat[0] ) repeat[0] = 0;
                    
                    if ( 2 > repeat.length ) repeat.push( repeat[0] ); // {n} match exactly n times
                    else if ( !repeat[1].length ) repeat[1] = INF; // {n,} match n times or more (INF)
                    else repeat[1] = parseInt(repeat[1], 10) || INF; // {n,m} match n times up to m times
                    if ( 0 > repeat[1] ) repeat[1] = 0;
                    
                    prev_token = sequence.pop( );
                    curr_token = '' + prev_token + [
                        '{',
                        repeat[0],
                        ',',
                        isFinite(repeat[1]) ? repeat[1] : '',
                        '}'
                    ].join('');
                    if ( !Syntax[ curr_token ] )
                    {
                        Syntax[ curr_token ] = {
                            type: 'group',
                            match: [repeat[0], repeat[1]],
                            tokens: [prev_token]
                        }
                    }
                    sequence.push( curr_token );
                }
                
                else if ( '}' === c )
                {
                    overwrite = false;
                    // literal repeat end modifier, should be handled in previous case
                    // added here just for completeness
                    continue;
                }
                
                else if ( '[' === c )
                {
                    overwrite = false;
                    // start of character select
                    literal = get_delimited( t, ']', false );
                    curr_token = '[' + literal + ']';
                    if ( !Lex[curr_token] )
                    {
                        Lex[curr_token] = {
                            type: 'simple',
                            tokens: literal.split('')/*new RegExp("^([" + literal + "])",'')*/
                        };
                    }
                    sequence.push( curr_token );
                }
                
                else if ( ']' === c )
                {
                    overwrite = false;
                    // end of character select, should be handled in previous case
                    // added here just for completeness
                    continue;
                }
                
                else if ( '|' === c )
                {
                    overwrite = false;
                    // alternation
                    if ( sequence.length > 1 )
                    {
                        curr_token = '' + sequence.join( " " );
                        if ( !Syntax[curr_token] )
                        {
                            Syntax[curr_token] = {
                                type: 'group',
                                match: 'sequence',
                                tokens: sequence
                            };
                        }
                        alternation.push( curr_token );
                    }
                    else if ( sequence.length )
                    {
                        alternation.push( sequence[0] );
                    }
                    else
                    {
                        // ??
                    }
                    sequence = [];
                }
                
                else if ( '(' === c )
                {
                    overwrite = false;
                    // start of grouped sub-sequence
                    stack.push([sequence, alternation, token, overwrite]);
                    sequence = []; alternation = []; token = '';
                }
                
                else if ( ')' === c )
                {
                    overwrite = false;
                    // end of grouped sub-sequence
                    if ( sequence.length > 1 )
                    {
                        curr_token = '' + sequence.join( " " );
                        if ( !Syntax[curr_token] )
                        {
                            Syntax[curr_token] = {
                                type: 'group',
                                match: 'sequence',
                                tokens: sequence
                            };
                        }
                        alternation.push( curr_token );
                    }
                    else if ( sequence.length )
                    {
                        alternation.push( sequence[0] );
                    }
                    sequence = [];
                    
                    if ( alternation.length > 1 )
                    {
                        curr_token = '' + alternation.join( " | " );
                        if ( !Syntax[curr_token] )
                        {
                            Syntax[curr_token] = {
                                type: 'group',
                                match: 'either',
                                tokens: alternation
                            };
                        }
                    }
                    else if ( alternation.length )
                    {
                        curr_token = alternation[ 0 ];
                    }
                    alternation = [];
                    
                    tmp = stack.pop( );
                    sequence = tmp[0]; alternation = tmp[1]; token = tmp[2];
                    
                    prev_token = curr_token;
                    curr_token = '(' + prev_token + ')';
                    if ( !Syntax[curr_token] ) Syntax[curr_token] = clone( Lex[prev_token] || Syntax[prev_token] );
                    sequence.push( curr_token );
                }
                
                else // space
                {
                    // space separator, i.e sequence of tokens
                    //continue;
                }
            }
            else
            {
                token += c;
            }
        }
        
        if ( token.length )
        {
            if ( overwrite )
            {
                // interpret as overwrite action
                curr_token = 'overwrite_$' + token + '$';
                if ( !Lex[curr_token] )
                {
                    Lex[ curr_token ] = {
                        type: 'action',
                        overwrite: token
                    };
                }
                sequence.push( curr_token );
                overwrite = false;
            }
            else if ( '0' === token )
            {
                // interpret as empty tokenizer
                sequence.push( T_EMPTY );
            }
            else if ( '^^' === token )
            {
                // interpret as SOF tokenizer
                sequence.push( T_SOF );
            }
            else if ( '^' === token )
            {
                // interpret as SOL tokenizer
                sequence.push( T_SOL );
            }
            else if ( '$' === token )
            {
                // interpret as EOL tokenizer
                sequence.push( T_EOL );
            }
            /*else if ( '$$' === token )
            {
                // interpret as EOF tokenizer
                sequence.push( T_EOF );
            }*/
            else
            {
                if ( !Lex[token] && !Syntax[token] )
                {
                    Lex[ token ] = {
                        type: 'simple',
                        tokens: token
                    };
                }
                sequence.push( token );
            }
        }
        token = '';
        
        if ( sequence.length > 1 )
        {
            curr_token = '' + sequence.join( " " );
            if ( !Syntax[curr_token] )
            {
                Syntax[curr_token] = {
                    type: 'group',
                    match: 'sequence',
                    tokens: sequence
                };
            }
            alternation.push( curr_token );
        }
        else if ( sequence.length )
        {
            alternation.push( sequence[0] );
        }
        else
        {
            // ??
        }
        sequence = [];
        
        if ( alternation.length > 1 )
        {
            curr_token = '' + alternation.join( " | " );
            if ( !Syntax[curr_token] )
            {
                Syntax[curr_token] = {
                    type: 'group',
                    match: 'either',
                    tokens: alternation
                };
            }
            tok = curr_token;
        }
        else if ( alternation.length )
        {
            tok = alternation[ 0 ];
        }
        else
        {
            // ??
        }
        alternation = [];
    }
    return tok;
}

function pre_process_grammar( grammar )
{
    if ( !grammar.Lex ) grammar.Lex = {};
    if ( !grammar.Syntax ) grammar.Syntax = {};
    var id, type, t, tok, T, xtends, xtok,
        Lex = grammar.Lex, Syntax = grammar.Syntax, 
        conf = [Lex, Syntax], nG = conf.length, G, i, i1, i2, T1;
    
    // fix shorthand token-type annotations in token_ID
    i = 0;
    while ( i < nG )
    {
        G = conf[i++];
        for (t in G)
        {
            if ( !G[HAS](t) ) continue;
            id = t.split(':');
            type = id[1] && trim(id[1]).length ? trim(id[1]) : null;
            id = trim(id[0]);
            if ( !id.length ) { id=t; type=null; } // literal ':' token, bypass
            if ( id !== t )
            {
                G[id] = G[t]; delete G[t];
                if ( type )
                {
                    tok = G[id]; T = get_type(tok);
                    if ( T_OBJ === T )
                    {
                        if ( !G[id].type ) G[id].type = type;
                    }
                    else
                    {
                        G[id] = {type:type};
                        if ( 'error' === type )
                        {
                            G[id].type = 'action';
                            G[id].error = true;
                            G[id].msg = tok;
                        }
                        else if ( 'action' === type && T_STR === T ) G[id][tok] = true;
                        else G[id].tokens = tok;
                    }
                }
            }
            if ( Lex === G )
            {
                if ( T_STR_OR_ARRAY_OR_REGEX & get_type(G[id]) )
                {
                    // simple token given as literal token, wrap it
                    G[id] = {type:"simple", tokens:G[id]};
                }
                // shorthands for single-line/escaped block tokens
                if ( 'line-block' === G[id].type[LOWER]() )
                {
                    G[id].type = 'block';
                    G[id].multiline = false;
                }
                else if ( 'escaped-line-block' === G[id].type[LOWER]() )
                {
                    G[id].type = 'block';
                    G[id].escape = '\\';
                    G[id].multiline = false;
                }
                else if ( 'escaped-block' === G[id].type[LOWER]() )
                {
                    G[id].type = 'block';
                    G[id].escape = '\\';
                    G[id].multiline = true;
                }
            }
        }
    }
    
    // handle token extensions in Lex, if any
    G = Lex;
    for (id in G)
    {
        if ( !G[HAS](id) ) continue;
        tok = G[id];
        // allow tokens to extend / reference other tokens
        while ( tok['extend'] )
        {
            xtends = tok['extend']; 
            xtok = Lex[ xtends ]/* || Syntax[ xtends ]*/;
            delete tok['extend'];
            if ( xtok ) 
            {
                // tokens given directly, no token configuration object, wrap it
                if ( T_STR_OR_ARRAY_OR_REGEX & get_type( xtok ) )
                {
                    xtok = Lex[ xtends ] = {type:"simple", tokens:xtok};
                }
                tok = extend( xtok, tok );
            }
            // xtok may in itself extend another tok and so on,
            // loop and get all references
        }
    }
    
    // fix shorthand configurations and provide defaults
    i = 0;
    while ( i < nG )
    {
        G = conf[i++];
        for (id in G)
        {
            if ( !G[HAS](id) ) continue;
            tok = G[id];
            // provide some defaults
            if ( T_OBJ === get_type(tok) && 'undefined' === typeof tok.type )
            {
                if ( tok[HAS]('overwrite') )
                {
                    tok.type = "action";
                    tok.action = [ 'overwrite', tok.overwrite, !!tok['in-context'] ];
                    delete tok.overwrite;
                }
                else if ( tok[HAS]('error') )
                {
                    tok.type = "action";
                    tok.action = [ 'error', tok.error, !!tok['in-context'] ];
                    delete tok.error;
                }
                else if ( tok[HAS]('context-start') )
                {
                    tok.type = "action";
                    tok.action = [ 'context-start', tok['context-start'], !!tok['in-context'] ];
                    delete tok['context-start'];
                }
                else if ( tok[HAS]('context-end') )
                {
                    tok.type = "action";
                    tok.action = [ 'context-end', tok['context-end'], !!tok['in-context'] ];
                    delete tok['context-end'];
                }
                else if ( tok[HAS]('empty') )
                {
                    tok.type = "action";
                    tok.action = [ 'empty', tok.empty, !!tok['in-context'] ];
                    delete tok.empty;
                }
                else if ( tok[HAS]('indent') )
                {
                    tok.type = "action";
                    tok.action = [ 'indent', tok.indent, !!tok['in-context'] ];
                    delete tok.indent;
                }
                else if ( tok[HAS]('outdent') )
                {
                    tok.type = "action";
                    tok.action = [ 'outdent', tok.outdent, !!tok['in-context'] ];
                    delete tok.outdent;
                }
                else if ( tok[HAS]('unique') )
                {
                    tok.type = "action";
                    tok.action = [ 'unique', T_STR&get_type(tok.unique) ? ['_DEFAULT_', tok.unique] : tok.unique, !!tok['in-context'] ];
                    delete tok.unique;
                }
                else if ( tok[HAS]('push') )
                {
                    tok.type = "action";
                    tok.action = [ 'push', tok.push, !!tok['in-context'] ];
                    delete tok.push;
                }
                else if ( tok[HAS]('pop') )
                {
                    tok.type = "action";
                    tok.action = [ 'pop', tok.pop, !!tok['in-context'] ];
                    delete tok.pop;
                }
                else if ( tok['sequence'] || tok['all']  )
                {
                    tok.type = "group";
                    tok.match = "sequence";
                    tok.tokens = tok['sequence'] || tok['all'];
                    if ( tok['all'] ) delete tok['all'];
                    else delete tok['sequence'];
                }
                else if ( tok['either'] )
                {
                    tok.type = "group";
                    tok.match = "either";
                    tok.tokens = tok['either'];
                    delete tok['either'];
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
                else if ( tok['escaped-line-block'] )
                {
                    tok.type = "block";
                    if ( !tok.escape ) tok.escape = '\\';
                    tok.multiline = false;
                    tok.tokens = tok['escaped-line-block'];
                    delete tok['escaped-line-block'];
                }
                else if ( tok['escaped-block'] )
                {
                    tok.type = "block";
                    if ( !tok.escape ) tok.escape = '\\';
                    tok.tokens = tok['escaped-block'];
                    delete tok['escaped-block'];
                }
                else if ( tok['line-block'] )
                {
                    tok.type = "block";
                    tok.escape = false;
                    tok.multiline = false;
                    tok.tokens = tok['line-block'];
                    delete tok['line-block'];
                }
                else if ( tok['comment'] )
                {
                    tok.type = "comment";
                    tok.tokens = tok['comment'];
                    delete tok['comment'];
                }
                else if ( tok['block'] )
                {
                    tok.type = "block";
                    tok.tokens = tok['block'];
                    delete tok['block'];
                }
                else if ( tok['simple'] )
                {
                    tok.type = "simple";
                    tok.tokens = tok['simple'];
                    delete tok['simple'];
                }
                else
                {
                    tok.type = "simple";
                }
            }
            if ( 'simple' === tok.type )
            {
                tok.autocomplete = !!tok.autocomplete;
                tok.meta = tok.autocomplete && (T_STR & get_type(tok.meta)) ? tok.meta : null;
            }
            else if ( 'block' === tok.type || 'comment' === tok.type )
            {
                tok.multiline = tok[HAS]('multiline') ? !!tok.multiline : true;
                if ( !(T_STR & get_type(tok.escape)) ) tok.escape = false;
            }
        }
    }
    return grammar;
}

function get_tokenizer( tokenID, RegExpID, Lex, Syntax, Style, 
                    cachedRegexes, cachedMatchers, cachedTokens, 
                    interleavedTokens, comments, keywords ) 
{
    var t, tok, token = null, tokens, type, combine, matchType, MSG = null;
    
    if ( T_SOF === tokenID )
    {
        // SOF Token
        return new Token( T_SOF, T_SOF, tokenID, MSG );
    }
    
    else if ( T_SOL === tokenID )
    {
        // SOL Token
        return new Token( T_SOL, T_SOL, tokenID, MSG );
    }
    
    else if ( T_EOL === tokenID || null === tokenID )
    {
        // EOL Token
        return new Token( T_EOL, T_EOL, tokenID, MSG );
    }
    
    /*else if ( T_EOF === tokenID )
    {
        // EOF Token
        return new Token( T_EOF, T_EOF, tokenID, MSG );
    }*/
    
    else if ( "" === tokenID )
    {
        // NONSPACE Token
        return new Token( T_NONSPACE, 'NONSPACE', tokenID, MSG );
    }
    
    else if ( false === tokenID || 0 === tokenID )
    {
        // EMPTY Token
        return new Token( T_EMPTY, 'EMPTY', tokenID, MSG );
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
    
    tok = Lex[ tokenID ] || Syntax[ tokenID ] || tokenID;
    if ( T_STR & get_type(tok) )
    {
        tok = parse_peg_bnf_notation( tok, Lex, Syntax );
        tok = Lex[ tok ] || Syntax[ tok ] || null;
    }
    if ( !tok ) return null;
    
    type = tok.type ? tokenTypes[ tok.type[LOWER]( ).replace( dashes_re, '' ) ] || T_SIMPLE : T_SIMPLE;
    MSG = tok.msg || null;
    
    if ( T_SIMPLE & type )
    {
        if ( T_SOF === tok.tokens )
        {
            // SOF Token
            token = new Token( T_SOF, tokenID, tokenID, MSG );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }
        
        else if ( T_SOL === tok.tokens )
        {
            // SOL Token
            token = new Token( T_SOL, tokenID, tokenID, MSG );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }
        
        else if ( T_EOL === tok.tokens || null === tok.tokens )
        {
            // EOL Token
            token = new Token( T_EOL, tokenID, tokenID, MSG );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }
        
        /*else if ( T_EOF === tok.tokens )
        {
            // EOF Token
            token = new Token( T_EOF, tokenID, tokenID, MSG );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }*/
        
        else if ( "" === tok.tokens )
        {
            // NONSPACE Token
            token = new Token( T_NONSPACE, tokenID, tokenID, MSG );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }
        
        else if ( false === tok.tokens || 0 === tok.tokens )
        {
            // EMPTY Token
            token = new Token( T_EMPTY, tokenID, tokenID, MSG );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }
        
        else if ( !tok.tokens )
        {
            return null;
        }
    }

    if ( !(T_ACTION & type) ) tok.tokens = make_array( tok.tokens );
    
    if ( T_ACTION & type )
    {
        if ( !tok[HAS]('action') )
        {
            if ( tok[HAS]('overwrite') ) tok.action = [A_OVERWR, tok.overwrite, !!tok['in-context']];
            else if ( tok[HAS]('error') ) tok.action = [A_ERROR, tok.error, !!tok['in-context']];
            else if ( tok[HAS]('context-start') ) tok.action = [A_CTXSTART, tok['context-start'], !!tok['in-context']];
            else if ( tok[HAS]('context-end') ) tok.action = [A_CTXEND, tok['context-end'], !!tok['in-context']];
            else if ( tok[HAS]('empty') ) tok.action = [A_EMPTY, tok.empty, !!tok['in-context']];
            else if ( tok[HAS]('indent') ) tok.action = [A_INDENT, tok.indent, !!tok['in-context']];
            else if ( tok[HAS]('outdent') ) tok.action = [A_OUTDENT, tok.outdent, !!tok['in-context']];
            else if ( tok[HAS]('unique') ) tok.action = [A_UNIQUE, T_STR&get_type(tok.unique)?['_DEFAULT_',tok.unique]:tok.unique, !!tok['in-context']];
            else if ( tok[HAS]('push') ) tok.action = [A_PUSH, tok.push, !!tok['in-context']];
            else if ( tok[HAS]('pop') ) tok.action = [A_POP, tok.pop, !!tok['in-context']];
        }
        else
        {
            if ( 'overwrite' === tok.action[0] ) tok.action[0] = A_OVERWR;
            else if ( 'error' === tok.action[0] ) tok.action[0] = A_ERROR;
            else if ( 'context-start' === tok.action[0] ) tok.action[0] = A_CTXSTART;
            else if ( 'context-end' === tok.action[0] ) tok.action[0] = A_CTXEND;
            else if ( 'empty' === tok.action[0] ) tok.action[0] = A_EMPTY;
            else if ( 'indent' === tok.action[0] ) tok.action[0] = A_INDENT;
            else if ( 'outdent' === tok.action[0] ) tok.action[0] = A_OUTDENT;
            else if ( 'unique' === tok.action[0] ) tok.action[0] = A_UNIQUE;
            else if ( 'push' === tok.action[0] ) tok.action[0] = A_PUSH;
            else if ( 'pop' === tok.action[0] ) tok.action[0] = A_POP;
        }
        token = new ActionToken( T_ACTION, tokenID, tok.action.slice(), MSG, tok.caseInsensitive||tok.ci );
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = token;
    }
    
    else if ( T_SIMPLE & type )
    {
        if ( tok.autocomplete ) get_autocomplete( tok, tokenID, keywords );
        
        // combine by default if possible using word-boundary delimiter
        combine = 'undefined' === typeof(tok.combine) ? "\\b" : tok.combine;
        token = new Token( T_SIMPLE, tokenID,
                    get_compositematcher( tokenID, tok.tokens.slice(), RegExpID, combine, cachedRegexes, cachedMatchers ), 
                    MSG
                );
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = token;
    }
    
    else if ( T_BLOCK & type )
    {
        if ( T_COMMENT & type ) get_comments( tok, comments );

        token = new BlockToken( type, tokenID,
                    get_blockmatcher( tokenID, tok.tokens.slice(), RegExpID, cachedRegexes, cachedMatchers ), 
                    MSG,
                    tok.multiline,
                    tok.escape,
                    // allow block delims / block interior to have different styles
                    !!Style[ tokenID + '.inside' ]
                );
        
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = token;
        if ( (T_COMMENT & type) && tok.interleave ) interleavedTokens.push( token/*.clone( )*/ );
    }
    
    else if ( T_GROUP & type )
    {
        if ( T_ARRAY & get_type( tok.match ) )
        {
            token = new CompositeToken( T_REPEATED, tokenID, null, MSG, tok.match[0], tok.match[1] );
        }
        else
        {
            matchType = groupTypes[ tok.match[LOWER]() ]; 
            
            if ( T_ZEROORONE === matchType ) 
                token = new CompositeToken( T_ZEROORONE, tokenID, null, MSG, 0, 1 );
            
            else if ( T_ZEROORMORE === matchType ) 
                token = new CompositeToken( T_ZEROORMORE, tokenID, null, MSG, 0, INF );
            
            else if ( T_ONEORMORE === matchType ) 
                token = new CompositeToken( T_ONEORMORE, tokenID, null, MSG, 1, INF );
            
            else if ( T_EITHER & matchType ) 
                token = new CompositeToken( T_EITHER, tokenID, null, MSG );
            
            else //if (T_SEQUENCE === matchType)
                token = new CompositeToken( T_SEQUENCE, tokenID, null, MSG );
        }
        
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = token;
        
        token.set( operate( tok.tokens, function( subTokenizers, t ){
            return subTokenizers.concat( get_tokenizer( t, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, interleavedTokens, comments, keywords ) );
        }, [] ) );
        
    }
    
    else if ( T_NGRAM & type )
    {
        // get n-gram tokenizer
        tokens = make_array_2( tok.tokens ); // array of arrays
        
        token = map( tokens, function( t, i ) {
            // get tokenizer for whole ngram
            return new CompositeToken( T_NGRAM, tokenID+'_NGRAM_'+i, null, MSG );
        } );
        
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = token;
        
        iterate( function( i ) {
            // get tokenizer for whole ngram
            token[i].set( operate( tokens[i], function( subTokenizers, t ){
                return subTokenizers.concat( get_tokenizer( t, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, interleavedTokens,  comments, keywords ) );
            }, [] ) );
        }, 0, tokens.length-1 );
    }
    return cachedTokens[ tokenID ];
}

function parse_grammar( grammar ) 
{
    var RegExpID, tokens,
        Extra, Style, Lex, Syntax, 
        cachedRegexes, cachedMatchers, cachedTokens, 
        interleavedTokens, comments, keywords;
    
    // grammar is parsed, return it
    // avoid reparsing already parsed grammars
    if ( grammar.__parsed ) return grammar;
    
    //grammar = clone( grammar );
    RegExpID = grammar.RegExpID || null;
    Extra = grammar.Extra ? clone(grammar.Extra) : { };
    Style = grammar.Style ? clone(grammar.Style) : { };
    Lex = grammar.Lex ? clone(grammar.Lex) : { };
    Syntax = grammar.Syntax ? clone(grammar.Syntax) : { };
    
    cachedRegexes = { }; cachedMatchers = { }; cachedTokens = { }; 
    comments = { }; keywords = { }; interleavedTokens = [ ];
    
    tokens = grammar.Parser ? clone(grammar.Parser) : [ ];
    
    grammar = {
        Style           : Style,
        Lex             : Lex,
        Syntax          : Syntax,
        $parser         : null,
        $interleaved    : null,
        $comments       : null,
        $autocomplete   : null,
        $extra          : Extra,
        __parsed        : 0
    };
    pre_process_grammar( grammar );
    
    grammar.$parser = operate( tokens, function( tokens, tokenID ) {
        var token = get_tokenizer( tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, interleavedTokens, comments, keywords ) || null;
        if ( token )
        {
            if ( T_ARRAY & get_type( token ) ) tokens = tokens.concat( token );
            else tokens.push( token );
        }
        return tokens;
    }, [] );
    grammar.$interleaved = interleavedTokens&&interleavedTokens.length ? interleavedTokens : null;
    grammar.$comments = comments;
    grammar.$autocomplete = keywords&&keywords.autocomplete&&keywords.autocomplete.length ? keywords.autocomplete : null;
    // this grammar is parsed
    grammar.__parsed = 1;
    return grammar;
}
