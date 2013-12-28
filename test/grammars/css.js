// 1. a partial css grammar in simple JSON format
var css_grammar = {
    
    // prefix ID for regular expressions used in the grammar
    "RegExpID" : "RegExp::",

    //
    // Style model
    "Style" : {
        // lang token type  -> Prism (style) tag
        "comment":      "comment",
        "meta":         "property",
        "meta2":        "constant",
        "atom":         "entity",
        "property":     "property",
        "element":      "atrule",
        "url":          "url",
        "operator":     "operator",
        "font":         "entity",
        "cssID":        "atrule",
        "cssClass":     "atrule",
        "cssPseudoElement": "selector",
        "identifier":   "symbol",
        "number":       "number",
        "hexcolor":      "number",
        "standard":      "important",
        "string":       "string",
        "text":         "string"
    },

    
    //
    // Lexical model
    "Lex" : {
        
        // comments
        "comment" : {
            "type" : "comment",
            "tokens" : [
                // block comments
                // start, end     delims
                [  "/*",  "*/" ]
            ]
        },
        
        // some standard identifiers
        "font" : [ "arial", "tahoma", "courier" ],
        
        "standard" : [ "!important", "only" ],
        
        // css ids
        "cssID" : "RegExp::#[_A-Za-z][_A-Za-z0-9]*",
        
        // css classes
        "cssClass" : "RegExp::\\.[_A-Za-z][_A-Za-z0-9]*",
        
        "cssPseudoElement" : "RegExp::::?[_A-Za-z][_A-Za-z0-9]*",
        
        // general identifiers
        "identifier" : "RegExp::[_A-Za-z][_A-Za-z0-9]*",
        
        // numbers, in order of matching
        "number" : [
            // floats
            "RegExp::\\d*\\.\\d+(e[\\+\\-]?\\d+)?(em|px|%|pt)?",
            "RegExp::\\d+\\.\\d*(em|px|%|pt)?",
            "RegExp::\\.\\d+(em|px|%|pt)?",
            // integers
            // decimal
            "RegExp::[1-9]\\d*(e[\\+\\-]?\\d+)?(em|px|%|pt)?",
            // just zero
            "RegExp::0(?![\\dx])(em|px|%|pt)?"
        ],
        
        // hex colors
        "hexcolor" : "RegExp::#[0-9a-fA-F]+",

        // strings
        "string" : {
            "type" : "escaped-block",
            "escape" : "\\",
            "tokens" : [
                //  start,           end of string (can be the matched regex group ie. 1 )
                [ "RegExp::([`'\"])", 1 ]
            ]
        },
        
        "text" : "RegExp::[^\\(\\)\\[\\]\\{\\}'\"]+",
        
        // operators
        "operator" : [ "*", "+", ",", "=", ";", ">" ],        
        
        // atoms
        "atom" : [ 
            "block", "none", "inherit", "inline-block", "inline", 
            "relative", "absolute", "fixed", "static",
            "sans-serif", "serif", "monospace", "bolder", "bold", 
            "rgba", "rgb", "underline", "wrap"
        ],
        
        // meta
        "meta" : [ "screen",  "handheld" ],

        // defs
        "meta2" : "RegExp::@[_A-Za-z][_A-Za-z0-9]*",

        // css properties
        "property" : [ 
            "background-color", "background-image", "background-position", "background-repeat", "background", 
            "font-family", "font-size", "font-weight", "font", 
            "text-decoration", "text-align",
            "margin-left", "margin-right", "margin-top", "margin-bottom", "margin", 
            "padding-left", "padding-right", "padding-top", "padding-bottom", "padding", 
            "border-left", "border-right", "border-top", "border-bottom", "border", 
            "position", "display" , "content", "color"
        ],
                              
        // css html element
        "element" : [ 
            "a", "p", "i",
            "br", "hr",
            "sup", "sub",
            "img", "video", "audio", 
            "canvas", "iframe",
            "pre", "code",
            "h1", "h2", "h3", "h4", "h5", "h6", 
            "html", "body", 
            "header", "footer", "nav",
            "div", "span", "section", "strong",
            "blockquote"
        ],
        
        "url" : "url"
    },

    //
    // Syntax model (optional)
    "Syntax" : {
        
        "stringOrUnquotedText" : {
            "type" : "group",
            "match" : "either",
            "tokens" : [ "string", "text" ]
        },
        
        // highlight url(...) as string regardless of quotes or not
        "urlDeclaration" : {
            "type" : "n-gram",
            "tokens" : [ "url", "(", "stringOrUnquotedText", ")" ]
        },
        
        "urlDeclarationGroup" : {
            "type" : "group",
            "match" : "all",
            "tokens" : [ "url", "(", "stringOrUnquotedText", ")" ]
        },
        
        "RHSAssignment" : {
            "type" : "group",
            "match" : "oneOrMore",
            "tokens" : [ "urlDeclarationGroup", "atom", "font", "standard", "string", "number", "hexcolor", "identifier", ",", "(", ")" ]
        },
        
        "cssAssignment" : {
            "type" : "group",
            "match" : "all",
            "tokens" : [ "property", ":", "RHSAssignment", ";" ]
        },
        
        "cssAssignments" : {
            "type" : "group",
            "match" : "zeroOrMore",
            "tokens" : [ "cssAssignment" ]
        },
        
        // syntax grammar (n-gram) for a block of css assignments
        "cssBlock" : {
            "type" : "n-gram",
            "tokens" : [
                [ "{", "cssAssignments", "}" ]
            ]
        }
    },

    // what to parse and in what order
    "Parser" : [
        "comment",
        "meta",
        "meta2",
        "urlDeclaration",
        "element",
        "cssID",
        "cssClass",
        "cssPseudoElement",
        "cssBlock",
        "number",
        "hexcolor",
        "string"
    ]
};
