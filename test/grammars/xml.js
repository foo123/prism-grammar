// 1. a partial xml grammar in simple JSON format
var xml_grammar = {
    
    // prefix ID for regular expressions used in the grammar
    "RegExpID" : "RE::",

    //
    // Style model
    "Style" : {
        // lang token type  -> Prism (style) tag
        "comment"                : "comment",
        "meta"                   : "entity",
        "atom"                   : "string",
        "cdata"                  : "comment",
        "open_tag"               : "tag",
        "close_open_tag"         : "tag",
        "auto_close_open_tag"    : "tag",
        "close_tag"              : "tag",
        "att"                    : "attr-name",
        "id"                     : "attr-name",
        "number"                 : "number",
        // "" represents default style or unstyled
        "string"                 : "",
        // allow block delims / interior to have different styles
        "string.inside"          : "attr-value"
    },

    //
    // Lexical model
    "Lex": {
        "comment:comment": ["&lt;!--","-->"],
        
        "cdata:block": ["&lt;![CDATA[","]]>"],
        
        "meta:block": ["RE::/&lt;\\?[_a-zA-Z][\\w\\._\\-]*/","?>"],
        
        "string:block": {"tokens":[[ "\"" ],[ "'" ]], "multiline":false},
        
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
        
        // tag attribute
        "att": "RE::/[_a-zA-Z][_a-zA-Z0-9\\-]*/",
        
        // tags
        "open_tag": "RE::/&lt;([_a-zA-Z][_a-zA-Z0-9\\-]*)/",
        "close_open_tag": ">",
        "auto_close_open_tag": "/>",
        "close_tag": "RE::/&lt;\\/([_a-zA-Z][_a-zA-Z0-9\\-]*)>/",
        
        "text": "RE::/[^&]+/",
        
        // actions
        "ctx_start:action": {"context-start":true},
        "ctx_end:action": {"context-end":true},
        // allow to find duplicate xml identifiers, with action tokens
        "unique:action": {
            "unique": ["id", "$1"],
            "msg": "Duplicate id attribute \"$0\""
        },
        // allow to find duplicate xml tag attributes, with action tokens
        "unique_att:action": {
            "unique": ["att", "$0"],
            "in-context":true,
            "msg": "Duplicate attribute \"$0\""
        },
        // allow to match start/end tags, with action tokens
        "match:action": {"push":"<$1>"},
        "matched:action": {
            "pop": "<$1>",
            "msg": "Tags \"$0\" and \"$1\" do not match!"
        },
        "nomatch:action": {"pop":null}
    },
    
    //
    // Syntax model (optional)
    "Syntax": {
        "id_att": "'id' unique_att '=' string unique",
        
        "tag_att": "att unique_att '=' (string | number)",
        
        "start_tag": "open_tag match ctx_start (id_att | tag_att)* (close_open_tag | auto_close_open_tag nomatch) ctx_end",
        
        "end_tag": "close_tag matched",
        
        "xml": "comment | cdata | meta | start_tag | end_tag | atom | text"
    },
    
    // what to parse and in what order
    "Parser": [ ["xml"] ]
};
