// 1. a partial xml grammar in simple JSON format
var xml_grammar = {
    
    // prefix ID for regular expressions used in the grammar
    "RegExpID" : "RE::",

    //
    // Style model
    "Style" : {
        // lang token type  -> Prism (style) tag
        "comment_block":         "comment",
        "meta_block":            "entity",
        "atom":                  "string",
        "cdata_block":           "comment",
        "open_tag":              "tag",
        "close_open_tag":        "tag",
        "auto_close_open_tag":   "tag",
        "close_tag":             "tag",
        "attribute":             "attr-name",
        "number":                "number",
        // "" represents default style or unstyled
        "string":                "",
        // allow block delims / interior to have different styles
        "string.inside":         "attr-value"
    },

    //
    // Lexical model
    "Lex": {
        
        "comment_block": {
            "type": "comment",
            "tokens": [
                // block comments
                // start,    end  delims
                [ "&lt;!--",    "-->" ]
            ]
        },
        
        "cdata_block": {
            "type": "block",
            "tokens": [
                // cdata block
                //   start,        end  delims
                [ "&lt;![CDATA[",    "]]>" ]
            ]
        },
        
        "meta_block": {
            "type": "block",
            "tokens": [
                // meta block
                //        start,                          end  delims
                [ "RE::/&lt;\\?[_a-zA-Z][\\w\\._\\-]*/",   "?>" ]
            ]
        },
        
        // strings
        "string": {
            "type": "block",
            "multiline": false,
            "tokens": [ 
                // if no end given, end is same as start
                [ "\"" ], [ "'" ] 
            ]
        },
        
        // numbers, in order of matching
        "number": [
            // dec
            "RE::/[0-9]\\d*/",
            // hex
            "RE::/#[0-9a-fA-F]+/"
        ],
        
        // atoms
        "atom": [
            "RE::/&amp;#x[a-fA-F\\d]+;/",
            "RE::/&amp;#[\\d]+;/",
            "RE::/&amp;[a-zA-Z][a-zA-Z0-9]*;/"
        ],
        
        // tag attributes
        "attribute": "RE::/[_a-zA-Z][_a-zA-Z0-9\\-]*/",
        
        // tags
        "open_tag": "RE::/&lt;([_a-zA-Z][_a-zA-Z0-9\\-]*)/",
        "close_open_tag": ">",
        "auto_close_open_tag": "/>",
        "close_tag": "RE::/&lt;\\/([_a-zA-Z][_a-zA-Z0-9\\-]*)>/",
        
        // NEW feature
        // action tokens to perform complex grammar functionality 
        // like associated tag matching and unique identifiers
        
        // allow to find duplicate xml identifiers, with action tokens
        "unique": {
            "unique": ["xml", "$1"],
            "msg": "Duplicate id attribute \"$0\""
        },
        
        // allow to match start/end tags, with action tokens
        "match": {
            "push": "<$1>"
        },
        
        "matched": {
            "pop": "<$1>",
            "msg": "Tags \"$0\" and \"$1\" do not match!"
        },
        
        "nomatch": {
            "pop": null
        }
    },
    
    //
    // Syntax model (optional)
    "Syntax": {
        // NEW feature
        // using PEG/BNF-like shorthands, instead of multiple grammar configuration objects
        
        "id_att": "'id' '=' string unique",
        
        "tag_att": "attribute '=' (string | number)",
        
        "start_tag": "open_tag match (id_att | tag_att)* (close_open_tag | auto_close_open_tag nomatch)",
        "end_tag": "close_tag matched",
        
        "tags": {
            "type": "ngram",
            "tokens": [
                ["start_tag"], 
                ["end_tag"]
            ]
        },
        
        "blocks": {
            "type": "ngram",
            "tokens": [
                ["comment_block"],
                ["cdata_block"],
                ["meta_block"],
            ]
        }
    },
    
    // what to parse and in what order
    "Parser": [ "blocks", "tags", "atom" ]
};
