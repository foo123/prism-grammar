prism-grammar
=============

__Transform a JSON grammar into a syntax-highlighter for Prism__

A simple and light-weight (~ 25kB minified, ~ 9kB zipped) [Prism](https://github.com/LeaVerou/prism) plugin

to generate prism-compatible syntax-highlighters from a grammar specification in JSON format.

See also:  [codemirror-grammar](https://github.com/foo123/codemirror-grammar) , [ace-grammar](https://github.com/foo123/ace-grammar)


###Contents

* [Live Example](http://foo123.github.io/examples/prism-grammar)
* [Todo](#todo)
* [Features](#features)
* [How To use](#how-to-use)
* [API Reference](/api-reference.md)
* [Grammar Reference](/grammar-reference.md)
* [Other Examples](#other-examples)


[![Build your own syntax-highlight mode on the fly](/test/screenshot.png)](http://foo123.github.io/examples/prism-grammar)


###Todo


###Features

* A [`Grammar`](/grammar-reference.md) can **extend other `Grammars`** (so arbitrary `variations` and `dialects` can be handled more easily)
* `Grammar` includes: [`Style Model`](/grammar-reference.md#style-model) , [`Lex Model`](/grammar-reference.md#lexical-model) and [`Syntax Model` (optional)](/grammar-reference.md#syntax-model), plus a couple of [*settings*](/grammar-reference.md#extra-settings) (see examples)
* **`Grammar` specification can be minimal**, defaults will be used (see example grammars)
* [`Grammar.Syntax Model`](/grammar-reference.md#syntax-model) can enable highlight in a more *context-specific* way, plus detect possible *syntax errors*
* [`Grammar.Syntax Model`](/grammar-reference.md#syntax-model) can contain **recursive references**
* [`Grammar.Syntax Model`](/grammar-reference.md#syntax-pegbnf-like-notations) can be (fully) specificed using [`PEG`](https://en.wikipedia.org/wiki/Parsing_expression_grammar)-like notation or [`BNF`](https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_Form)-like notation  (**NEW feature**)
* `Grammar` can define [*action* tokens](/grammar-reference.md#action-tokens) to perform *complex context-specific* parsing functionality, including **associated tag matching** and **duplicate identifiers** (see for example `xml.grammar` example) (**NEW feature**)
* Generated highlighters are **optimized for speed and size**
* Can generate a syntax-highlighter from a grammar **interactively and on-the-fly** ( see example, http://foo123.github.io/examples/prism-grammar )


###How to use:

An example for XML:


```javascript

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
        "id":                    "attr-name",
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
        
        "ctx_start": {
            "context-start": true
        },
        
        "ctx_end": {
            "context-end": true
        },
        
        // allow to find duplicate xml identifiers, with action tokens
        "unique": {
            "unique": ["id", "$1"],
            "msg": "Duplicate id attribute \"$0\""
        },
        
        // allow to find duplicate xml tag attributes, with action tokens
        "unique_att": {
            "unique": ["att", "$0"],
            "in-context": true,
            "msg": "Duplicate attribute \"$0\""
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
        
        "id_att": "'id' unique_att '=' string unique",
        
        "tag_att": "attribute unique_att '=' (string | number)",
        
        "start_tag": "open_tag match ctx_start (id_att | tag_att)* (close_open_tag | auto_close_open_tag nomatch) ctx_end",
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

![css-grammar](/test/grammar-css.png)

![js-grammar](/test/grammar-js.png)


