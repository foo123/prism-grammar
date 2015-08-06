prism-grammar
=============

__Transform a JSON grammar into a syntax-highlighter for Prism__

A simple and light-weight (~ 20kB minified, ~ 8kB zipped) [Prism](https://github.com/LeaVerou/prism) plugin

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

* A grammar can **extend other grammars** (so arbitrary variations and dialects can be parsed more easily)
* [`Grammar`](/grammar-reference.md) includes: `Style` Model , `Lex` Model and `Syntax` Model (optional), plus a couple of *settings* (see examples)
* `Grammar` **specification can be minimal** (defaults will be used) (see example grammars)
* [`Grammar Syntax Model`](/grammar-reference.md) can enable highlight in a more context-specific way, plus detect possible *syntax errors*
* [`Grammar Syntax Model`](/grammar-reference.md) can contain *recursive references*
* [`Grammar Syntax Model`](/grammar-reference.md) can be specificed using [`PEG`](https://en.wikipedia.org/wiki/Parsing_expression_grammar)-like notation or [`BNF`](https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_Form)-like notation  (**NEW feature**)
* Generated parsers are **optimized for speed and size**


###How to use:

An example for CSS:


```javascript

// 1. a partial css grammar in simple JSON format
var css_grammar = {
    
    // prefix ID for regular expressions used in the grammar
    "RegExpID" : "RegExp::",

    //
    // Style model
    "Style" : {
        // lang token type  -> prism (style) tag
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
        "font" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [
                "arial", "tahoma", "courier"
            ]
        },
        
        "standard" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [
                "!important", "only"
            ]
        },
        
        // css ids
        "cssID" : "RegExp::/#[_A-Za-z][_A-Za-z0-9]*/",
        
        // css classes
        "cssClass" : "RegExp::/\\.[_A-Za-z][_A-Za-z0-9]*/",
        
        "cssPseudoElement" : "RegExp::/::?[_A-Za-z][_A-Za-z0-9]*/",
        
        // general identifiers
        "identifier" : "RegExp::/[_A-Za-z][_A-Za-z0-9]*/",
        
        // numbers, in order of matching
        "number" : [
            // floats
            "RegExp::/\\d*\\.\\d+(e[\\+\\-]?\\d+)?(em|px|%|pt)?/",
            "RegExp::/\\d+\\.\\d*(em|px|%|pt)?/",
            "RegExp::/\\.\\d+(em|px|%|pt)?/",
            // integers
            // decimal
            "RegExp::/[1-9]\\d*(e[\\+\\-]?\\d+)?(em|px|%|pt)?/",
            // just zero
            "RegExp::/0(?![\\dx])(em|px|%|pt)?/"
        ],
        
        // hex colors
        "hexcolor" : "RegExp::/#[0-9a-fA-F]+/",

        // strings
        "string" : {
            "type" : "escaped-block",
            "escape" : "\\",
            "tokens" : [
                //  start,           end of string (can be the matched regex group ie. 1 )
                [ "RegExp::/([`'\"])/", 1 ]
            ]
        },
        
        "text" : "RegExp::/[^\\(\\)\\[\\]\\{\\}'\"]+/",
        
        // operators
        "operator" : {
            "tokens" : [
                "*", "+", ",", "=", ";", ">"
            ]
        },
        
        // atoms
        "atom" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [ 
                "block", "none", "inherit", "inline-block", "inline", 
                "relative", "absolute", "fixed", "static",
                "sans-serif", "serif", "monospace", "bolder", "bold", 
                "rgba", "rgb", "underline", "wrap"
            ]
        },
        
        // meta
        "meta" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [ "screen",  "handheld" ]
        },

        // defs
        "meta2" : "RegExp::/@[_A-Za-z][_A-Za-z0-9]*/",

        // css properties
        "property" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [ 
                "background-color", "background-image", "background-position", "background-repeat", "background", 
                "font-family", "font-size", "font-weight", "font", 
                "text-decoration", "text-align",
                "margin-left", "margin-right", "margin-top", "margin-bottom", "margin", 
                "padding-left", "padding-right", "padding-top", "padding-bottom", "padding", 
                "border-left", "border-right", "border-top", "border-bottom", "border", 
                "position", "display" , "content", "color"
            ]
        },
                              
        // css html element
        "element" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [ 
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
            ]
        },
        
        "url" : "RegExp::/url\\b/"
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
            "tokens" : [ "url", "" /* match non-space */, "(", "stringOrUnquotedText", ")" ]
        },
        
        "RHSAssignment" : {
            "type" : "group",
            "match" : "oneOrMore",
            "tokens" : [ "urlDeclaration", "atom", "font", "standard", "string", "number", "hexcolor", "identifier", ",", "(", ")" ]
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

// 2. parse the grammar into a Prism-compatible syntax-highlighter
var css_mode = PrismGrammar.getMode( css_grammar );

// 3. use it with Prism for css language
css_mode.hook( Prism, "css" );

// mode can be unhooked also
// css_mode.unhook();

```


Result:

![css-grammar](/test/grammar-css.png)




###Other Examples:

![js-grammar](/test/grammar-js.png)

![xml-grammar](/test/grammar-xml.png)

