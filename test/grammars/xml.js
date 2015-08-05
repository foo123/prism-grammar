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
        "openTag":             "tag",
        "endTag":               "tag",
        "autoCloseTag":         "tag",
        "closeTag":             "tag",
        "attribute":            "attr-name",
        "number":               "number",
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
                [ "RegExp::/&lt;\\?[_a-zA-Z][\\w\\._\\-]*/",   "?>" ]
            ]
        },
        
        // strings
        "string" : {
            "type" : "block",
            "multiline" : false,
            "tokens" : [ 
                // if no end given, end is same as start
                [ "\"" ], [ "'" ] 
            ]
        },
        
        // numbers, in order of matching
        "number" : [
            // integers
            // decimal
            "RegExp::/[1-9]\\d*(e[\\+\\-]?\\d+)?/",
            // just zero
            "RegExp::/0(?![\\dx])/",
            // hex colors
            "RegExp::/#[0-9a-fA-F]+/"
        ],
        
        // atoms
        "atom" : [
            "RegExp::/&amp;[a-zA-Z][a-zA-Z0-9]*;/",
            "RegExp::/&amp;#[\\d]+;/",
            "RegExp::/&amp;#x[a-fA-F\\d]+;/"
        ],
        
        // tag attributes
        "attribute" : "RegExp::/[_a-zA-Z][_a-zA-Z0-9\\-]*/",
        
        // tags
        "closeTag" : ">",
        
        "openTag" : {
            // allow to match start/end tags
            "push" : "TAG<$1>",
            "tokens" : "RegExp::/&lt;([_a-zA-Z][_a-zA-Z0-9\\-]*)/"
        },
        
        "autoCloseTag" : {
            // allow to match start/end tags
            "pop" : null,
            "tokens" : "/>"
        },
        
        "endTag" : {
            // allow to match start/end tags
            "pop" : "TAG<$1>",
            "tokens" : "RegExp::/&lt;\\/([_a-zA-Z][_a-zA-Z0-9\\-]*)>/"
        }
    },
    
    //
    // Syntax model (optional)
    "Syntax" : {
        // NEW feature
        // using BNF-like shorthands, instead of multiple grammar configuration objects
        
        "tagAttribute": "attribute '=' (string | number)",
        
        "startTag": "openTag tagAttribute* (closeTag | autoCloseTag)",
        
        "tags": {
            "type": "ngram",
            "tokens": [
                ["startTag"], 
                ["endTag"]
            ]
        }
    },
    
    // what to parse and in what order
    "Parser" : [
        "commentBlock",
        "cdataBlock",
        "metaBlock",
        "tags",
        "atom"
    ]
};
