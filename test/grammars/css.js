// 1. a partial css grammar in simple JSON format
var css_grammar = {
    
    // prefix ID for regular expressions used in the grammar
    "RegExpID": "RE::",

    // Style model
    "Style": {
        // lang token type  -> Prism (style) tag
        "comment"         : "comment",
        "@atrule"         : "constant",
        "@import"         : "constant",
        "@keyframes"      : "constant",
        "@media"          : "constant",
        "identifier"      : "symbol",
        "!important"      : "important",
        "CssAtom"         : "entity",
        "url"             : "url",
        "format"          : "url",
        "CssProperty"     : "property",
        "HtmlElement"     : "atrule",
        "CssID"           : "atrule",
        "CssClass"        : "atrule",
        "PseudoElement"   : "selector",
        "number"          : "number",
        "string"          : "string",
        "text"            : "string"
    },

    // Lexical model
    "Lex": {
        "comment:comment" : {
            "interleave": true,
            "tokens" : [
                // block comments
                // start, end     delims
                [  "/*",  "*/" ]
            ]
        },
        "number": [
            // integers
            // decimal
            "RE::/[0-9]\\d*(rad|grad|deg|turn|vh|vw|vmin|vmax|px|rem|em|%|in|cm|mm|pc|pt|ex|s|ms)?/i",
            // floats
            "RE::/\\.\\d+(rad|grad|deg|turn|vh|vw|vmin|vmax|px|rem|em|%|in|cm|mm|pc|pt|ex|s|ms)?/i",
            "RE::/\\d+\\.\\d*(rad|grad|deg|turn|vh|vw|vmin|vmax|px|rem|em|%|in|cm|mm|pc|pt|ex|s|ms)?/i",
            "RE::/\\d*\\.\\d+(rad|grad|deg|turn|vh|vw|vmin|vmax|px|rem|em|%|in|cm|mm|pc|pt|ex|s|ms)?/i",
            // hex color
            "RE::/#[0-9a-f]{3,6}/i"
        ],
        "string:line-block": [ "RE::/(['\"])/", 1 ],
        "text" : "RE::/[^\\(\\)\\[\\]\\{\\}'\"]+/",
        
        // css identifier
        "identifier" : "RE::/[a-z_\\-][a-z0-9_\\-]*/i",
        
        // css ids
        "CssID" : "RE::/#[a-z_\\-][a-z0-9_\\-]*/i",
        
        // css classes
        "CssClass" : "RE::/\\.[a-z_\\-][a-z0-9_\\-]*/i",
        
        // css pseudo classes / pseudo elements
        "PseudoElement" : "RE::/::?[a-z_\\-][a-z0-9_\\-]*/i",
        
        // css properties
        "CssProperty" : "RE::/[a-z_\\-][a-z0-9_\\-]*/i",
                              
        // css atoms / values
        "url" : "RE::/url\\b/i",
        "format" : "RE::/format\\b/i",
        "CssAtom" : "RE::/[a-z_\\-][a-z_\\-]*/i",
        
        // css @atrules
        "@import" : "RE::/@import\\b/i",
        "@keyframes" : "RE::/@[a-z\\-]*keyframes\\b/i",
        "@media" : "RE::/@media\\b/i",
        "@atrule" : "RE::/@[a-z_\\-][a-z0-9_\\-]*/i",
        
        "!important" : "RE::/!important\\b/i",
        
        // css html element
        "HtmlElement" : "RE::/[a-z_\\-][a-z0-9_\\-]*/i",
        
        "match_b:action" : {"push": "}"},
        "match_p:action" : {"push": ")"},
        "\\match:action" : {
            "pop": "$0",
            "msg": "Token \"$0\" does not match"
        }
    },

    // Syntax model (optional)
    "Syntax": {
        "urlDeclaration:ngram" : "url '(' match_p (string | text) ')' \\match",
        
        "formatDeclaration:ngram" : "format '(' match_p (string | text) ')' \\match",
        
        "cssSelector" : "(HtmlElement | CssID | CssClass | PseudoElement | string | ',' | '(' match_p | ')' \\match | '[' | ']' | '=' | '+' | '^' | '>' | '*' | '~')+",
        
        "RHSAssignment" : "(!important | urlDeclaration | formatDeclaration | string | number | CssAtom | ',' | '(' match_p | ')' \\match)+",
        
        "cssAssignment" : "CssProperty ':' RHSAssignment ';'*",
        
        // syntax grammar (n-gram) for a block of css assignments
        "cssBlock:ngram" : [
            [ "number '{' match_b cssAssignment* '}' \\match" ],
            [ "cssSelector '{' match_b cssAssignment* '}' \\match" ]
        ],
        
        "@importDirective:ngram" : "@import urlDeclaration ';'",
        
        "@keyframesDirective:ngram" : "@keyframes identifier '{' match_b cssBlock* '}' \\match",
        
        "cssIdentifiers" : "(identifier | number | string | ',' | '(' match_p | ')' \\match)+",
        
        "@mediaDirective:ngram" : "@media cssIdentifiers '{' match_b cssBlock* '}' \\match",
        
        "atruleLine" : "cssIdentifiers ';'*",
        
        "atruleBlock" : "'{' match_b cssAssignments '}' \\match",
        
        "@atruleDirective:ngram"  : "@atrule (atruleBlock | atruleLine)"
    },

    // what to parse and in what order
    "Parser": [
        "comment",
        "@importDirective",
        "@keyframesDirective",
        "@mediaDirective",
        "@atruleDirective",
        "cssBlock"
    ]
};