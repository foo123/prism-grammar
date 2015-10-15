

###PrismGrammar Methods

__For node:__

```javascript
PrismGrammar = require('build/prism_grammar.js').PrismGrammar;
```

__For browser:__

```html
<script src="build/prism_grammar.js"></script>
```




__Method__: `clone`

```javascript
cloned = PrismGrammar.clone( grammar [, deep=true] );
```

Clone (deep) a `grammar`

Utility to clone objects efficiently
    


__Method__: `extend`

```javascript
extendedgrammar = PrismGrammar.extend( grammar, basegrammar1 [, basegrammar2, ..] );
```

Extend a `grammar` with `basegrammar1`, `basegrammar2`, etc..

This way arbitrary `dialects` and `variations` can be handled more easily
    


__Method__: `pre_process`

```javascript
PrismGrammar.pre_process( grammar );
```

This is used internally by the `PrismGrammar` Class `parse` method
In order to pre-process, in-place, a `JSON grammar` 
to transform any shorthand configurations to full object configurations and provide defaults.
    


__Method__: `parse`

```javascript
parsedgrammar = PrismGrammar.parse( grammar );
```

This is used internally by the `PrismGrammar` Class
In order to parse a `JSON grammar` to a form suitable to be used by the syntax-highlighter.
However user can use this method to cache a `parsedgrammar` to be used later.
Already parsed grammars are NOT re-parsed when passed through the parse method again
    


__Method__: `getMode`

```javascript
mode = PrismGrammar.getMode( grammar );
```

This is the main method which transforms a `JSON grammar` into a syntax-highlighter for `Prism`.
    