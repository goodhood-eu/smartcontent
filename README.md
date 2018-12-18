SmartContent
============

Generates HTML from User Generated Content to normalize input and create clickable links.

## Usage:

This package is intended to be used as a lightweight replacement for markdown. By default it only replaces links with link tags and normalizes whitespace, but can be easily extended to also display image urls as images, add text styling and much more.

Unlike markdown, this module allows for easy text shortening that can cut through links, preserving links clickability. Works well with Unicode and can cut through emoji properly. Based on excellent [simple-markdown](https://github.com/Khan/simple-markdown).

### Create parser
Module exports a function to create your own parser. This function takes a rules object to add new rules and customize existing ones. Returns a parser function.

### Rules
Rules are an object consisting of objects in the following format:

```
ruleName: {
  // Required. Has to start with /^, matches tokens to be received by parser
  pattern: /^\w+/,



  // Required. Method that converts matches to AST node.
  // Arguments:
  //   matches - array of matches form RegExp.exec
  //   parser - a parser function to allow recursion, takes text argument to parse and returns AST
  //   state - a state object to share parser state between calls/rules
  //   ast - currently parsed AST (nested collection of objects/arrays)
  // Returns: an object or an array of objects, containing:
  //   type: optional, string with name of compiler to use. will default to rule name
  //   content: optional, string representing content, can be automatically shortened
  //            if needed by the root compiler.
  //   ... any additional props to pass down to parser

  parse(matches, parser, state, ast) { return { content: matches[0] } },



  // Required. Method that converts AST node into HTML string.
  // Arguments:
  //   node - AST node object that was returned from parser
  //   compiler - a compiler function to allow recursion, takes AST node and returns HTML
  //   state - a state object to share compiler state between calls/rules
  // Returns: compiled HTML string. Should take care of
  //           XSS injections and escape content!

  compile(node, compiler, state) { return node.content; },



  // Optional. Method that shortens text and returns HTML. Allows for customized shortening.
  // Arguments:
  //   node - AST node object that was returned from parser
  //   limit - length limit
  //   compiler - a compiler function to allow recursion, takes AST node and returns HTML
  // Returns: compiled HTML string. Should take care of
  //           XSS injections and escape content!

  shorten(node, limit, compile) { return node.content.slice(0, limit); },



  // Optional. Number that shows order in which rule to be executed relative to
  //         others, bigger means later.
  order: 1,
},
```

### Parser
This function takes a string of text and length to shorten to. Returns HTML with text shortened to desired length. **Please be advised, that it shortens text content and not the HTML string itself!**

## Examples:
```
import createParser from 'smartcontent';

const text = 'check this out: google.com/search?q=nebenan.de';
transform(text);
// => 'check this out: <a href="https://google.com/search?q=nebenan.de">google.com/…</a>'
```
