const fs = require('fs');
const { Trie } = require('regexgen');
const { list } = require('./vendor/tlds');

const file = `${__dirname}/src/tlds.es`;

const trie = new Trie();
trie.addAll(list);

const string = `(${trie.toString()})`;

fs.writeFileSync(file, `// GENERATED AUTOMATICALLY, DO NOT EDIT\nexport default '${string}';`);
console.log('RegExp generated');
