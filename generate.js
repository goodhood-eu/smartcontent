const fs = require('fs');
const { Trie } = require('regexgen');
const list = require('tlds');

const file = `${__dirname}/src/tlds.js`;

const trie = new Trie();
trie.addAll(list);

const string = `(${trie.toString()})`;

fs.writeFileSync(file, `// GENERATED AUTOMATICALLY, DO NOT EDIT\nmodule.exports = '${string}';`);
console.log('RegExp generated');
