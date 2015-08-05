
var undef = undefined, PROTO = 'prototype', HAS = 'hasOwnProperty', IS_ENUM = 'propertyIsEnumerable',
    Keys = Object.keys, AP = Array[PROTO], OP = Object[PROTO], FP = Function[PROTO],
    toString = OP.toString,
    
    // types
    //T_INF = 5,
    T_NUM = 4, T_NAN = 5,  T_BOOL = 8,
    T_STR = 16, T_CHAR = 17, T_CHARLIST = 18,
    T_ARRAY = 32, T_OBJ = 64, T_FUNC = 128,  T_REGEX = 256, T_DATE = 512,
    T_NULL = 1024, T_UNDEF = 2048, T_UNKNOWN = 4096,
    T_STR_OR_ARRAY = T_STR|T_ARRAY, T_OBJ_OR_ARRAY = T_OBJ|T_ARRAY,
    TO_STRING = {
        "[object Array]"    : T_ARRAY,
        "[object RegExp]"   : T_REGEX,
        "[object Date]"     : T_DATE,
        "[object Number]"   : T_NUM,
        "[object String]"   : T_STR,
        "[object Function]" : T_FUNC,
        "[object Object]"   : T_OBJ
    },
    get_type = function( v ) {
        var /*type_of,*/ to_string;
        
        if (null === v)  return T_NULL;
        else if (true === v || false === v)  return T_BOOL;
        else if (undef === v /*|| "undefined" === type_of*/)  return T_UNDEF;
        
        //type_of = typeOf(v);
        to_string = toString.call( v );
        //to_string = TO_STRING[HAS](to_string) ? TO_STRING[to_string] : T_UNKNOWN;
        to_string = TO_STRING[to_string] || T_UNKNOWN;
        
        //if (undef === v /*|| "undefined" === type_of*/)  return T_UNDEF;
        if (T_NUM === to_string || v instanceof Number)  return isNaN(v) ? T_NAN : T_NUM;
        else if (T_STR === to_string || v instanceof String) return (1 === v.length) ? T_CHAR : T_STR;
        else if (T_ARRAY === to_string || v instanceof Array)  return T_ARRAY;
        else if (T_REGEX === to_string || v instanceof RegExp)  return T_REGEX;
        else if (T_DATE === to_string || v instanceof Date)  return T_DATE;
        else if (T_FUNC === to_string || v instanceof Function)  return T_FUNC;
        else if (T_OBJ === to_string)  return T_OBJ;
        // unkown type
        return T_UNKNOWN;
    },
    
    Merge = function(/* var args here.. */) { 
        var args = arguments, argslen, 
            o1, o2, v, p, i, T;
        o1 = args[0] || {}; 
        argslen = args.length;
        for (i=1; i<argslen; i++)
        {
            o2 = args[ i ];
            if ( T_OBJ === get_type( o2 ) )
            {
                for (p in o2)
                {            
                    if ( !o2[HAS](p) || !o2[IS_ENUM](p) ) continue;
                    
                    v = o2[p]; T = get_type( v );
                    
                    if ( T_NUM & T )
                        // shallow copy for numbers, better ??
                        o1[p] = 0 + v;  
                    
                    else if ( T_STR_OR_ARRAY & T )
                        // shallow copy for arrays or strings, better ??
                        o1[p] = v.slice();  
                    
                    else
                        // just reference copy
                        o1[p] = v;  
                }
            }
        }
        return o1; 
    },
    
    Extend = Object.create,
    
    Class = function( O, C ) {
        var argslen = arguments.length, ctor, CTOR = 'constructor';
        if ( 0 === argslen ) 
        {
            O = Object;
            C = { };
        }
        else if ( 1 === argslen ) 
        {
            C = O || { };
            O = Object;
        }
        else
        {
            O = O || Object;
            C = C || { };
        }
        if ( !C[HAS](CTOR) ) C[CTOR] = function( ){ };
        ctor = C[CTOR]; delete C[CTOR];
        ctor[PROTO] = Merge( Extend(O[PROTO]), C );
        ctor[PROTO][CTOR] = ctor;
        return ctor;
    },
    
    make_array = function( a, force ) {
        return ( force || T_ARRAY !== get_type( a ) ) ? [ a ] : a;
    },
    
    make_array_2 = function( a, force ) {
        a = make_array( a, force );
        if ( force || T_ARRAY !== get_type( a[0] ) ) a = [ a ]; // array of arrays
        return a;
    },
    
    clone = function( o ) {
        var T = get_type( o ), T2;
        
        if ( !(T_OBJ_OR_ARRAY & T) ) return o;
        
        var co = {}, k;
        for (k in o) 
        {
            if ( !o[HAS](k) || !o[IS_ENUM](k) ) continue;
            T2 = get_type( o[k] );
            
            if (T_OBJ & T2)  co[k] = clone(o[k]);
            
            else if (T_STR_OR_ARRAY & T2)  co[k] = o[k].slice();
            
            else  co[k] = o[k]; 
        }
        return co;
    },
    
    extend = function( ) {
        var args = arguments, argslen = args.length;
        
        if ( argslen<1 ) return null;
        else if ( argslen<2 ) return clone( args[0] );
        
        var o1 = args[0], o2, o = clone(o1), i, k, T; 
        argslen--;            
        
        for (i=1; i<argslen; i++)
        {
            o2 = args[i];
            if ( !o2 ) continue;
            
            for (k in o2) 
            { 
                if ( o2[HAS](k) && o2[IS_ENUM](k) )
                {
                    if ( o1[HAS](k) && o1[IS_ENUM](k) ) 
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
    
    escaped_re = /([.*+?^${}()|[\]\/\\\-])/g,
    esc_re = function( s ) {
        return s.replace(escaped_re, '\\$1');
    },
    
    replacement_re = /\$(\d{1,2})/g,
    group_replace = function( pattern, token ) {
        var parts, i, l, replacer;
        replacer = function(m, d){
            // the regex is wrapped in an additional group, 
            // add 1 to the requested regex group transparently
            return token[ 1 + parseInt(d, 10) ];
        };
        parts = pattern.split('$$');
        l = parts.length;
        for (i=0; i<l; i++) parts[i] = parts[i].replace(replacement_re, replacer);
        return parts.join('$');
    },
    
    trim_re = /^\s+|\s+$/g,
    trim = String[PROTO].trim
        ? function( s ){ return s.trim(); }
        : function( s ){ return s.replace(trim_re, ''); },
        
    by_length = function( a, b ) { 
        return b.length - a.length 
    },
    
    newline_re = /\r\n|\r|\n/g, dashes_re = /[\-_]/g, 
    bnf_special_re = /^([{}()*+?|'"]|\s)/,
    
    has_prefix = function(s, id) {
        return (
            (T_STR & get_type(id)) && (T_STR & get_type(s)) && id.length &&
            id.length <= s.length && id == s.substr(0, id.length)
        );
    },
    
    get_re = function(r, rid, cachedRegexes)  {
        if ( !r || (T_NUM === get_type(r)) ) return r;
        
        var l = (rid) ? (rid.length||0) : 0, i;
        
        if ( l && rid == r.substr(0, l) ) 
        {
            var regexSource = r.substr(l), delim = regexSource[0], flags = '',
                regexBody, regexID, regex, chars, i, ch
            ;
            
            // allow regex to have delimiters and flags
            // delimiter is defined as the first character after the regexID
            i = regexSource.length;
            while ( i-- )
            {
                ch = regexSource[i];
                if (delim == ch) 
                    break;
                else if ('i' == ch.toLowerCase() ) 
                    flags = 'i';
            }
            regexBody = regexSource.substring(1, i);
            regexID = "^(" + regexBody + ")";
            //console.log([regexBody, flags]);
            
            if ( !cachedRegexes[ regexID ] )
            {
                regex = new RegExp( regexID, flags );
                /*chars = new RegexAnalyzer( regex ).peek();
                if ( null !== chars.peek && !Keys(chars.peek).length )  chars.peek = null;
                if ( null !== chars.negativepeek && !Keys(chars.negativepeek).length )  chars.negativepeek = null;*/
                // remove RegexAnalyzer dependency
                chars = {peek:null,negativepeek:null};
                
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
    
    get_combined_re = function(tokens, boundary)  {
        var peek = { }, i, l, b = "", bT = get_type(boundary);
        if ( T_STR === bT || T_CHAR === bT ) b = boundary;
        var combined = tokens
                    .sort(by_length)
                    .map(function( t ) {
                        peek[ t.charAt(0) ] = 1;
                        return esc_re( t );
                    })
                    .join("|")
                ;
        return [ new RegExp("^(" + combined + ")"+b), { peek: peek, negativepeek: null }, 1 ];
    },
    
    _id_ = 0, 
    get_id = function( ) { return ++_id_; },
    uuid = function( ns ) { return [ns||'uuid', ++_id_, new Date().getTime()].join('_'); },
    
    isNode = !!(("undefined" !== typeof global) && ("[object global]" === toString.call(global))),
    isBrowser = !!(!isNode && ("undefined" !== typeof navigator)),
    isWorker = !!(isBrowser && ("function" === typeof importScripts) && (navigator instanceof WorkerNavigator))
;
