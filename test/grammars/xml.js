// 1. a partial xml grammar in simple JSON format
var xml_grammar = {
    
// prefix ID for regular expressions, represented as strings, used in the grammar
"RegExpID"                          : "RE::",

// Style model
"Style"                             : {
    
     "declaration"                  : "tag"
    ,"doctype"                      : "entity"
    ,"meta"                         : "entity"
    ,"comment"                      : "comment"
    ,"cdata"                        : "comment"
    ,"atom"                         : "string"
    ,"open_tag"                     : "tag"
    ,"close_open_tag"               : "tag"
    ,"auto_close_open_tag"          : "tag"
    ,"close_tag"                    : "tag"
    ,"attribute"                    : "attr-name"
    ,"number"                       : "number"
    // "" represents default style or unstyled
    ,"string"                       : ""
    // allow block delims / interior to have different styles
    ,"string.inside"                : "attr-value"

},

// Lexical model
"Lex"                               : {
     
     "comment:comment"              : ["&lt;!--", "-->"]
    ,"declaration:block"            : ["&lt;?xml", "?>"]
    ,"doctype:block"                : ["RE::/&lt;!doctype\\b/i", ">"]
    ,"meta:block"                   : ["RE::/&lt;\\?[_a-zA-Z][\\w\\._\\-]*/", "?>"]
    ,"cdata:block"                  : ["&lt;![CDATA[", "]]>"]
    ,"open_tag"                     : "RE::/&lt;([_a-zA-Z][_a-zA-Z0-9\\-]*)/"
    ,"close_tag"                    : "RE::/&lt;\\/([_a-zA-Z][_a-zA-Z0-9\\-]*)>/"
    ,"attribute"                    : "RE::/[_a-zA-Z][_a-zA-Z0-9\\-]*/"
    ,"string:line-block"            : [["\""], ["'"]]
    ,"number"                       : ["RE::/[0-9]\\d*/", "RE::/#[0-9a-fA-F]+/"]
    ,"atom"                         : ["RE::/&amp;#x[a-fA-F\\d]+;/", "RE::/&amp;#[\\d]+;/", "RE::/&amp;[a-zA-Z][a-zA-Z0-9]*;/"]
    ,"text"                         : "RE::/[^&]+/"
    
    // actions
    ,"tag_ctx:action"               : {"context":true}
    ,"\\tag_ctx:action"             : {"context":false}
    ,"unique_id:action"             : {"unique":["xml", "$1"],"msg":"Duplicate id value \"$0\""}
    ,"unique_att:action"            : {"unique":["tag", "$0"],"msg":"Duplicate attribute \"$0\"","in-context":true}
    ,"tag_opened:action"            : {"push":"<$1>","ci":true}
    ,"tag_closed:action"            : {"pop":"<$1>","ci":true,"msg":"Tags \"$0\" and \"$1\" do not match"}
    ,"tag_autoclosed:action"        : {"pop":null}
    ,"out_of_place:error"           : "\"$2$3\" can only be at the beginning of XML document"
    
},
    
// Syntax model (optional)
"Syntax"                            : {
     
     "tag_att"                      : "'id'.attribute unique_att '=' string unique_id | attribute unique_att '=' (string | number)"
    ,"start_tag"                    : "open_tag tag_ctx tag_opened tag_att* ('>'.tag | '/>'.tag tag_autoclosed) \\tag_ctx"
    ,"end_tag"                      : "close_tag tag_closed"
    ,"xml"                          : "(^^1 declaration? doctype?) (declaration.error out_of_place | doctype.error out_of_place | comment | meta | cdata | start_tag | end_tag | atom | text)*"
    
},
    
// what to parse and in what order
"Parser"                            : [ ["xml"] ]

};
