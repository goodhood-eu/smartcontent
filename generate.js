const fs = require('fs');
const { Trie } = require('regexgen');
const { list } = require('./vendor/tlds');

const file = `${__dirname}/vendor/regex.js`;

const trie = new Trie();
trie.addAll(list);

const string = `(${trie.toString()})`;

fs.writeFileSync(file, `module.exports = '${string}';`);
console.log('RegExp generated');
