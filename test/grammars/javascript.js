// 1. an almost complete javascript grammar in simple JSON format
var js_grammar = {
        
    // prefix ID for regular expressions used in the grammar
    "RegExpID": "RegExp::",
    
    // Style model
    "Style": {
        // lang token type  -> Prism (style) tag
        "comment":    "comment",
        "atom":       "entity",
        "keyword":    "keyword",
        "this":       "keyword",
        "builtin":    "builtin",
        "operator":   "operator",
        "identifier": "symbol",
        "property":   "property",
        "number":     "number",
        "string":     "string",
        "regex":      "regex"
    },

    // Lexical model
    "Lex": {
        // comments
        "comment" : {
            "type" : "comment",
            "tokens" : [
                // line comment
                // start, end delims  (null matches end-of-line)
                [  "//",  null ],
                // block comments
                // start,  end    delims
                [  "/*",   "*/" ]
            ]
        },
        
        // general identifiers
        "identifier" : "RegExp::/[_A-Za-z$][_A-Za-z0-9$]*/",
        
        "this" : "RegExp::/this\\b/",
        
        "property" : "RegExp::/[_A-Za-z$][_A-Za-z0-9$]*/",
        
        // numbers, in order of matching
        "number" : [
            // floats
            "RegExp::/\\d*\\.\\d+(e[\\+\\-]?\\d+)?/",
            "RegExp::/\\d+\\.\\d*/",
            "RegExp::/\\.\\d+/",
            // integers
            // hex
            "RegExp::/0x[0-9a-fA-F]+L?/",
            // binary
            "RegExp::/0b[01]+L?/",
            // octal
            "RegExp::/0o[0-7]+L?/",
            // decimal
            "RegExp::/[1-9]\\d*(e[\\+\\-]?\\d+)?L?/",
            // just zero
            "RegExp::/0(?![\\dx])/"
        ],

        // usual strings
        "string" : {
            "type" : "escaped-block",
            "escape" : "\\",
            // start, end of string (can be the matched regex group ie. 1 )
            "tokens" : [ "RegExp::/(['\"])/",   1 ]
        },
        
        // literal regular expressions
        "regex" : {
            "type" : "escaped-block",
            "escape" : "\\",
            // javascript literal regular expressions can be parsed similar to strings
            "tokens" : [ "/",    "RegExp::#/[gimy]{0,4}#" ]
        },
        
        // operators
        "operator" : {
            "combine" : true,
            "tokens" : [
                "\\", "+", "-", "*", "/", "%", "&", "|", "^", "~", "<", ">" , "!",
                "||", "&&", "==", "!=", "<=", ">=", "<>", ">>", "<<",
                "===", "!==", "<<<", ">>>" 
            ]
        },
        
        // delimiters
        "delimiter" : {
            "combine" : true,
            "tokens" : [
                "(", ")", "[", "]", "{", "}", ",", "=", ";", "?", ":",
                "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "++", "--",
                ">>=", "<<="
            ]
        },
            
        // atoms
        "atom" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [
                "true", "false", 
                "null", "undefined", 
                "NaN", "Infinity"
            ]
        },

        // keywords
        "keyword" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [ 
                "if", "while", "with", "else", "do", "try", "finally",
                "return", "break", "continue", "new", "delete", "throw",
                "var", "const", "let", "function", "catch",
                "for", "switch", "case", "default",
                "in", "typeof", "instanceof"
            ]
        },
        
        // builtins
        "builtin" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [ 
                "Object", "Array", "String", "Number", "RegExp", "Exception",
                "setTimeout", "setInterval", "alert", "console"
            ]
        }
    },
    
    // Syntax model (optional)
    "Syntax": {
        
        "dotProperty" : {
            "type" : "group",
            "match" : "all",
            "tokens" : [ ".", "property" ]
        },
        
        "builtinOrIdentifier" : {
            "type" : "group",
            "match" : "either",
            "tokens" : [ "}", ")", "this", "builtin", "identifier", "dotProperty" ]
        },
        
        "dotProperties" : {
            "type" : "group",
            "match" : "zeroOrMore",
            "tokens" : [ "dotProperty" ]
        },
        
        "builtinOrIdentifierWithProperties" : {
            "type" : "n-gram",
            "tokens" : [
                [ "builtinOrIdentifier", "dotProperties" ]
            ]
        }
    },

    // what to parse and in what order
    "Parser": [
        "comment",
        "number",
        "string",
        "regex",
        "keyword",
        "operator",
        "atom",
        "builtinOrIdentifierWithProperties"
    ]
};
