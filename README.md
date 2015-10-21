prism-grammar
=============

__Transform a JSON grammar into a syntax-highlighter for Prism__

A simple and light-weight (~ 30kB minified, ~ 11kB zipped) [Prism](https://github.com/LeaVerou/prism) plugin

to generate prism-compatible syntax-highlighters from a grammar specification in JSON format.

See also:  [codemirror-grammar](https://github.com/foo123/codemirror-grammar) , [ace-grammar](https://github.com/foo123/ace-grammar)

**Note:** The invariant codebase for all the `*-grammar` add-ons resides at [editor-grammar](https://github.com/foo123/editor-grammar) repository (used as a `git submodule`)


###Contents

* [Live Example](http://foo123.github.io/examples/prism-grammar)
* [Todo](#todo)
* [Features](#features)
* [How To use](#how-to-use)
* [API Reference](/api-reference.md)
* [Grammar Reference](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md)
* [Other Examples](#other-examples)


[![Build your own syntax-highlight mode on the fly](/test/screenshot.png)](http://foo123.github.io/examples/prism-grammar)


###Todo


###Features

* A [`Grammar`](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md) can **extend other `Grammars`** (so arbitrary `variations` and `dialects` can be handled more easily)
* `Grammar` includes: [`Style Model`](/https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#style-model) , [`Lex Model`](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#lexical-model) and [`Syntax Model` (optional)](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#syntax-model), plus a couple of [*settings*](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#extra-settings) (see examples)
* **`Grammar` specification can be minimal**, defaults will be used (see example grammars)
* [`Grammar.Syntax Model`](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#syntax-model) can enable highlight in a more *context-specific* way, plus detect possible *syntax errors*
* [`Grammar.Syntax Model`](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#syntax-model) can contain **recursive references**
* [`Grammar.Syntax Model`](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#syntax-pegbnf-like-notations) can be (fully) specificed using [`PEG`](https://en.wikipedia.org/wiki/Parsing_expression_grammar)-like notation or [`BNF`](https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_Form)-like notation  (**NEW feature**)
* `Grammar` can define [*action* tokens](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#action-tokens) to perform *complex context-specific* parsing functionality, including **associated tag matching** and **duplicate identifiers** (see for example `xml.grammar` example) (**NEW feature**)
* Generated highlighters are **optimized for speed and size**
* Can generate a syntax-highlighter from a grammar **interactively and on-the-fly** ( see example, http://foo123.github.io/examples/prism-grammar )


###How to use:

An example for XML:


```javascript

// 1. a partial xml grammar in simple JSON format
var xml_grammar = {
    
    // prefix ID for regular expressions, represented as strings, used in the grammar
    "RegExpID": "RE::",

    // Style model
    "Style": {
        // lang token type  -> Prism (style) tag
        "declaration"            : "tag",
        "doctype"                : "entity",
        "meta"                   : "entity",
        "comment"                : "comment",
        "cdata"                  : "comment",
        "atom"                   : "string",
        "open_tag"               : "tag",
        "close_open_tag"         : "tag",
        "auto_close_open_tag"    : "tag",
        "close_tag"              : "tag",
        "att"                    : "attr-name",
        "number"                 : "number",
        // "" represents default style or unstyled
        "string"                 : "",
        // allow block delims / interior to have different styles
        "string.inside"          : "attr-value"
    },

    // Lexical model
    "Lex": {
        "declaration:block": ["&lt;?xml","?>"],
        "doctype:block": ["RE::/&lt;!doctype\\b/i",">"],
        "meta:block": ["RE::/&lt;\\?[_a-zA-Z][\\w\\._\\-]*/","?>"],
        "comment:comment": ["&lt;!--","-->"],
        "cdata:block": ["&lt;![CDATA[","]]>"],
        "string:line-block": [[ "\"" ],[ "'" ]],
        "number": ["RE::/[0-9]\\d*/", "RE::/#[0-9a-fA-F]+/"],
        "atom": ["RE::/&amp;#x[a-fA-F\\d]+;/", "RE::/&amp;#[\\d]+;/", "RE::/&amp;[a-zA-Z][a-zA-Z0-9]*;/"],
        "att": "RE::/[_a-zA-Z][_a-zA-Z0-9\\-]*/",
        "open_tag": "RE::/&lt;([_a-zA-Z][_a-zA-Z0-9\\-]*)/",
        "close_open_tag": ">",
        "auto_close_open_tag": "/>",
        "close_tag": "RE::/&lt;\\/([_a-zA-Z][_a-zA-Z0-9\\-]*)>/",
        "text": "RE::/[^&]+/",
        
        // actions
        "ctx:action": {"context":true},
        "\\ctx:action": {"context":false},
        "unique:action": {
            "unique": ["id", "$1"],
            "msg": "Duplicate id value \"$0\""
        },
        "unique_att:action": {
            "unique": ["att", "$0"],
            "in-context":true,
            "msg": "Duplicate attribute \"$0\""
        },
        "match:action": {"push":"<$1>","ci": true},
        "\\match:action": {
            "pop": "<$1>",
            "ci": true,
            "msg": "Tags \"$0\" and \"$1\" do not match"
        },
        "nomatch:action": {"pop":null},
        "out_of_place:error": "\"$2$3\" can only be at the beginning of XML document"
    },
    
    // Syntax model (optional)
    "Syntax": {
        "tag_att": "'id'.att unique_att '=' string unique | att unique_att '=' (string | number)",
        "start_tag": "open_tag match ctx tag_att* (close_open_tag | auto_close_open_tag nomatch) \\ctx",
        "end_tag": "close_tag \\match",
        "xml": "(^^1 declaration? doctype?) (declaration.error out_of_place | doctype.error out_of_place | comment | meta | cdata | start_tag | end_tag | atom | text)*"
    },
    
    // what to parse and in what order
    "Parser": [ ["xml"] ]
};

// 2. parse the grammar into a Prism-compatible syntax-highlighter
var xml_mode = PrismGrammar.getMode( xml_grammar );

// 3. use it with Prism for css language
xml_mode.hook( Prism, "xml" );

// mode can be unhooked also
// xml_mode.unhook();

```


Result:

![xml-grammar](/test/grammar-xml.png)


###Other Examples:

![js-grammar](/test/grammar-js.png)

![css-grammar](/test/grammar-css.png)



