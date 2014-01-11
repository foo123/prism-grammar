// 1. a partial xml grammar in simple JSON format
var xml_grammar = {
    
    // prefix ID for regular expressions used in the grammar
    "RegExpID" : "RegExp::",

    //
    // Style model
    "Style" : {
        // lang token type  -> Prism (style) tag
        "commentBlock":         "comment",
        "metaBlock":            "entity",
        "atom":                 "string",
        "cdataBlock":           "comment",
        "startTag":             "tag",
        "endTag":               "tag",
        "autocloseTag":         "tag",
        "closeTag":             "tag",
        "attribute":            "attr-name",
        "number":               "number",
        "hexnumber":            "number",
        // "" represents default style or unstyled
        "string":               "",
        // allow block delims / interior to have different styles
        "string.inside":        "attr-value"
    },

    //
    // Lexical model
    "Lex" : {
        
        "commentBlock" : {
            "type" : "comment",
            "tokens" : [
                // block comments
                // start,    end  delims
                [ "&lt;!--",    "-->" ]
            ]
        },
        
        "cdataBlock" : {
            "type" : "block",
            "tokens" : [
                // cdata block
                //   start,        end  delims
                [ "&lt;![CDATA[",    "]]>" ]
            ]
        },
        
        "metaBlock" : {
            "type" : "block",
            "tokens" : [
                // meta block
                //        start,                          end  delims
                [ "RegExp::&lt;\\?[_a-zA-Z][\\w\\._\\-]*",   "?>" ]
            ]
        },
        
        // tag attributes
        "attribute" : "RegExp::[_a-zA-Z][_a-zA-Z0-9\\-]*",
        
        // numbers, in order of matching
        "number" : [
            // floats
            "RegExp::\\d+\\.\\d*",
            "RegExp::\\.\\d+",
            // integers
            // decimal
            "RegExp::[1-9]\\d*(e[\\+\\-]?\\d+)?",
            // just zero
            "RegExp::0(?![\\dx])"
        ],
        
        // hex colors
        "hexnumber" : "RegExp::#[0-9a-fA-F]+",

        // strings
        "string" : {
            "type" : "escaped-block",
            "escape" : "\\",
            "multiline" : false,
            "tokens" : [ 
                // start, end of string (can be the matched regex group ie. 1 )
                // if no end given, end is same as start
                [ "\"" ], 
                [ "'" ] 
            ]
        },
        
        // atoms
        // "simple" token type is default, if no token type
        //"type" : "simple",
        "atom" : [
            "RegExp::&amp;[a-zA-Z][a-zA-Z0-9]*;",
            "RegExp::&amp;#[\\d]+;",
            "RegExp::&amp;#x[a-fA-F\\d]+;"
        ],
        
        // tags
        "startTag" : "RegExp::&lt;[_a-zA-Z][_a-zA-Z0-9\\-]*",
        
        "endTag" : ">",
        
        "autocloseTag" : "/>",
        
        // close tag, outdent action
        "closeTag" : "RegExp::&lt;/[_a-zA-Z][_a-zA-Z0-9\\-]*>"
    },
    
    //
    // Syntax model (optional)
    "Syntax" : {
        
        "stringOrNumber" : {
            "type" : "group",
            "match" : "either",
            "tokens" : [ "string", "number", "hexnumber" ] 
        },
        
        "tagAttribute" : { 
            "type" : "group",
            "match" : "all",
            "tokens" : [ "attribute", "=", "stringOrNumber" ]
        },
        
        "tagAttributes" : { 
            "type" : "group",
            "match" : "zeroOrMore",
            "tokens" : [ "tagAttribute" ]
        },
        
        "startCloseTag" : { 
            "type" : "group",
            "match" : "either",
            "tokens" : [ "endTag", "autocloseTag" ]
        },
        
        // n-grams define syntax sequences
        "openTag" : { 
            "type" : "n-gram",
            "tokens" :[
                [ "startTag", "tagAttributes", "startCloseTag" ]
            ]
        }
    },
    
    // what to parse and in what order
    "Parser" : [
        "commentBlock",
        "cdataBlock",
        "metaBlock",
        "openTag",
        "closeTag",
        "atom"
    ]
};
