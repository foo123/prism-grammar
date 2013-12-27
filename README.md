prism-grammar
=============

__Transform a JSON grammar into a syntax-highlighter for Prism__

A simple and light-weight ( ~ 15kB minified) [Prism](https://github.com/LeaVerou/prism) plugin

to generate prism-compatible syntax-highlighters from a grammar specification in JSON format.

###Contents

* [Todo](#todo)
* [Features](#features)
* [How To use](#how-to-use)
* [API Reference](/api-reference.md)
* [Other Examples](#other-examples)


###Todo


###Features

* A grammar can **extend other grammars** (so arbitrary variations and dialects can be parsed more easily), Prism already supports a similar feature
* Grammar includes: **Style Model** , **Lex Model** and **Syntax Model** (optional), plus a couple of *settings* (see examples)
* Grammar **specification can be minimal** (defaults will be used) (see example grammars)
* Grammar Syntax Model can enable highlight in a more context-specific way, plus detect possible *syntax errors*
* Grammar Syntax Model can contain *recursive references*
* Generated highlighters are **optimized for speed and size**


###How to use:

See working examples under [/test](/test) folder.

###Other Examples:

An example for CSS:


![css-grammar](/test/grammar-css.png)

