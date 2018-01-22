import punycode from 'punycode';

const REGEX_PUNCTUATION = /[\s:.,!?"';\-–()[\]…]+$/;

export const SHORTENED_STRING_TOKEN = '…';

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
