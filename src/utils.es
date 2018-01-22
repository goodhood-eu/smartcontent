import punycode from 'punycode';
import escapeHtml from 'escape-html';
import tldsRegex from '../vendor/regex';

const PUNCTUATION = '([\\s-.,\'":;!?]+)';
const REGEX_PUNCTUATION = /[\s:.,!?"';\-–()[\]…]+$/;

export const SHORTENED_STRING_TOKEN = '…';

export const REGEX_KNOWN_DOMAIN = new RegExp(`\\.(${tldsRegex})$`);
export const REGEX_EMAIL_SIGN = /^@/;
export const REGEX_URL_PREFIX = /^(https?:\/\/)/;

export const REGEX_PUNCTUATION_BEGINNING = new RegExp(`^${PUNCTUATION}`);
export const REGEX_PUNCTUATION_ENDING = new RegExp(`${PUNCTUATION}$`);

export const has = (...args) => Object.prototype.hasOwnProperty.call(...args);

export const unicodeLength = (string) => {
  if (!string || typeof string !== 'string') return 0;
  return punycode.ucs2.decode(string).length;
};

export const shortenString = (string, limit = 10) => {
  if (!string || typeof string !== 'string' || limit === 0) return '';
  const decoded = punycode.ucs2.decode(string);
  if (decoded.length < limit) return string;

  // working RTL: ...[lastIndex]|[cutoffIndex]...
  const lastIndex = limit - 2;
  const cutoffIndex = limit - 1;

  const lastChar = decoded[lastIndex];
  const cutoffChar = decoded[cutoffIndex];

  let shortened = decoded.slice(0, cutoffIndex);
  // shouldn't end on ZWJ (\u200d)
  if (lastChar === 8205) shortened = shortened.slice(0, -1);
  // should't trim variations (\ufe0e|\ufe0f)
  else if (cutoffChar === 65038 || cutoffChar === 65039) shortened.push(cutoffChar);

  const result = punycode.ucs2.encode(shortened).replace(REGEX_PUNCTUATION, '');
  return result + SHORTENED_STRING_TOKEN;
};

export const isDomainOk = (domain) => REGEX_KNOWN_DOMAIN.test(domain);
export const isEmail = (text) => REGEX_EMAIL_SIGN.test(text);

export const getLastNode = (ast) => {
  if (!Array.isArray(ast)) return null;
  const last = ast[ast.length - 1];
  if (Array.isArray(last)) return getLastNode(last);
  return last;
};

export const getUrlPrefix = (text) => {
  const matches = REGEX_URL_PREFIX.exec(text);
  if (!matches) return null;
  return matches[1];
};

export const getBeginningPunctuation = (text) => {
  const matches = REGEX_PUNCTUATION_BEGINNING.exec(text);
  if (!matches) return null;
  return matches[1];
};

export const getEndingPunctuation = (text) => {
  const matches = REGEX_PUNCTUATION_ENDING.exec(text);
  if (!matches) return null;
  return matches[1];
};

export const tag = (tagName, tagAttributes, content) => {
  const attributes = tagAttributes || {};
  const attributesArray = Object.keys(attributes).map((key) => {
    let name = key;
    const value = attributes[key];

    if (name === 'className') name = 'class';
    if (typeof value === 'boolean' && value) return name;

    return `${name}="${value}"`;
  });

  let tagParts = ['<', tagName];
  if (attributesArray.length) tagParts.push(` ${attributesArray.join(' ')}`);
  const tagTail = ['>', content, '</', tagName, '>'];

  if (content) {
    tagParts = tagParts.concat(tagTail);
  } else {
    tagParts.push(' />');
  }

  return tagParts.join('');
};

export const injectOrder = (rules, base = 0) => {
  if (!rules) return null;
  let index = base;

  return Object.keys(rules).reduce((result, key) => {
    result[key] = { ...rules[key] };
    if (!has(rules[key], 'order')) result[key].order = index;
    index += 1;
    return result;
  }, {});
};

export const proxyMatch = (matches) => ({ content: matches[0] });
export const safeContent = ({ content }) => escapeHtml(content);
export const emptyShorten = () => SHORTENED_STRING_TOKEN;
