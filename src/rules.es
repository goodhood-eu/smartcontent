import { SHORTENED_STRING_TOKEN } from './strings';

import {
  isDomainOk,
  isEmail,
  getLastNode,
  getUrlPrefix,
  getBeginningPunctuation,
  getEndingPunctuation,
  tag,
  proxyMatch,
  safeContent,
  emptyShorten,
} from './utils';


// Rule object signature:
// pattern - required, has to start with /^, matches tokens to be received by parser
// parse - required, needs to return an object or an array of objects, containing:
//   type: optional, string with name of compiler to use. will default to rule name
//   content: optional, string representing content, can be automatically shortened
//            if needed by the root compiler.
// compile - required, needs to return compiled HTML string. Should take care of
//           XSS injections and escape content!
// shorten - optional, used in case shortening is required. Allows for customized shortening.
// order - optional, number that shows order in which rule to be executed relative to
//         others, bigger means later
const rules = {
  paragraph: {
    pattern: /^\s*\n{2,}\s*/,
    parse: proxyMatch,
    compile() {
      const br = tag('br');
      return br + br;
    },
    shorten: emptyShorten,
  },

  newline: {
    pattern: /^\s*\n\s*/,
    parse: proxyMatch,
    compile() { return tag('br'); },
    shorten: emptyShorten,
  },

  // needed for text matcher to break on words
  whitespace: {
    pattern: /^\s+/,
    parse: proxyMatch,
    compile() { return ' '; },
    shorten: emptyShorten,
  },

  brackets: {
    pattern: /^([([{])([\s\S]+?)([)\]}])/,
    parse(matches, parser) {
      const type = 'text';
      const [leftSym, content, rightSym] = matches.slice(1);

      return [
        { content: leftSym, type },
        parser(content),
        { content: rightSym, type },
      ];
    },
  },

  url: {
    // Doesn't handle weird native language urls, like WWW.FIRMA.XN--VERMGENSBERATER-CTB
    // Be careful and test this in Safari as it has buggy RegExp implementation
    pattern: /^(?:https?:\/\/)?((?:(?:[^\u0000-\u007F]|[\w-])+\.)+(?:[^\u0000-\u007F]|[a-zA-Z]){2,})(?::\d+)?(\/(?:(?:[^\u0000-\u007F]|[\w/.,'"@+=!:;=%()-])+)?(?:\.(?:[^\u0000-\u007F]|[\w-])+)?)?((?:\?|#)\S+)?/,
    parse(matches, parse, state, ast) {
      const type = 'text';
      const [original, domain] = matches;
      const skip = { type, content: original };

      const last = getLastNode(ast);
      if (last && last.type === type && isEmail(last.content)) return skip;

      // Don't match typos as urls
      const prefix = getUrlPrefix(original);
      if (!prefix && !isDomainOk(domain)) return skip;

      // Bail if regex ate up some dashes
      const beginning = getBeginningPunctuation(original);
      if (beginning) return skip;

      // Check if querystring regex caught some punctuation
      const ending = getEndingPunctuation(original) || '';
      let href = ending ? original.slice(0, -ending.length) : original;

      let content = `${prefix || ''}${domain}`;
      if (href !== content) content += `/${SHORTENED_STRING_TOKEN}`;

      if (!prefix) href = `http://${href}`;

      const link = { type: 'url', href, content };
      if (!ending) return link;

      const text = { type, content: ending };
      return [link, text];
    },

    compile(node) {
      const { href, content } = node;
      return tag('a', { href }, content);
    },

    shorten: emptyShorten,
  },

  text: {
    // Here we look for anything followed by non-symbols or newlines
    // We break on any symbol characters so that this grammar
    // is easy to extend without needing to modify this regex
    pattern: /^[\s\S]+?(?=[^0-9A-Za-z\u00c0-\uffff]|\n|\w+[:.]\S|$)/,
    parse: proxyMatch,
    compile: safeContent,
  },
};

export default rules;
