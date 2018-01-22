const { assert } = require('chai');

const {
  has,
  isDomainOk,
  isEmail,
  getLastNode,
  getUrlPrefix,
  getBeginningPunctuation,
  getEndingPunctuation,
  tag,
  injectOrder,
  proxyMatch,
  safeContent,
  emptyShorten,
} = require('../lib/utils');

const fullUrl = 'http://github.com';
const safeUrl = 'https://google.com';
const shortUrl = 'nebenan.de/feed';


describe('modules/smartcontent/utils', () => {
  it('has', () => {
    const Klass = function() { this.a = true; };
    Klass.prototype.c = true;
    const test = new Klass();

    assert.isFalse(has({}, 'a'), 'empty object');
    assert.isTrue(has({ b: undefined }, 'b'), 'own undefined prop');
    assert.isTrue(has(test, 'a'), 'own prop');
    assert.isFalse(has(test, 'c'), 'prototype');
  });

  it('isDomainOk', () => {
    assert.isFalse(isDomainOk('lold'), 'random text');
    assert.isFalse(isDomainOk('hubb.ble'), 'not a domain');
    assert.isTrue(isDomainOk('gogol.co.uk'), 'good domain');
  });

  it('isEmail', () => {
    assert.isFalse(isEmail('lold'), 'random text');
    assert.isTrue(isEmail('@'), 'has @ sign');
    assert.isTrue(isEmail('@nice'), 'email chunk');
  });

  it('getLastNode', () => {
    const last = { type: 'dude', content: 'where\'s my car' };
    const ast = [
      { content: 'duuude' },
      last,
    ];
    const nested = [
      { content: 'whooooa duuude' },
      ast,
    ];

    assert.isNull(getLastNode(), 'empty call doesnt crash');
    assert.deepEqual(getLastNode(ast), last, 'matches last node');
    assert.deepEqual(getLastNode(nested), last, 'matches nested last node');
  });

  it('getUrlPrefix', () => {
    assert.equal(getUrlPrefix(fullUrl), 'http://', 'detects http url');
    assert.equal(getUrlPrefix(safeUrl), 'https://', 'detects https url');
    assert.isNull(getUrlPrefix(shortUrl), 'short url works');
  });

  it('getBeginningPunctuation', () => {
    const urlWithPunctuation = '-http://github.com/penis';
    const urlWithPunctuation2 = ',http://github.com/penis';
    const urlWithPunctuation3 = '-github.com';
    const urlWithPunctuationLong = ',github.com';

    assert.equal(getBeginningPunctuation(urlWithPunctuation), '-', 'extracted punctuation correctly');
    assert.equal(getBeginningPunctuation(urlWithPunctuation2), ',', 'extracted punctuation 2 correctly');
    assert.equal(getBeginningPunctuation(urlWithPunctuation3), '-', 'extracted punctuation 3 correctly');
    assert.equal(getBeginningPunctuation(urlWithPunctuationLong), ',', 'extracted multiple punctuation correctly');
    assert.isNull(getBeginningPunctuation(fullUrl), 'link with no punctuation ignored');
    assert.isNull(getBeginningPunctuation(shortUrl), 'link with no punctuation ignored 2');
  });

  it('getEndingPunctuation', () => {
    const urlWithPunctuation = 'http://github.com/penis.';
    const urlWithPunctuation2 = 'http://github.com/penis,';
    const urlWithPunctuation3 = 'github.com:';
    const urlWithPunctuationLong = 'github.com:".,';

    assert.equal(getEndingPunctuation(urlWithPunctuation), '.', 'extracted punctuation correctly');
    assert.equal(getEndingPunctuation(urlWithPunctuation2), ',', 'extracted punctuation 2 correctly');
    assert.equal(getEndingPunctuation(urlWithPunctuation3), ':', 'extracted punctuation 3 correctly');
    assert.equal(getEndingPunctuation(urlWithPunctuationLong), ':".,', 'extracted multiple punctuation correctly');
    assert.isNull(getEndingPunctuation(fullUrl), 'link with no punctuation ignored');
    assert.isNull(getEndingPunctuation(shortUrl), 'link with no punctuation ignored 2');
  });

  it('tag', () => {
    assert.equal(tag('br'), '<br />', 'self closing tags work correctly');
    assert.equal(tag('img', { src: 123 }), '<img src="123" />', 'self closing tags with attributes work correctly');
    assert.equal(tag('p', null, 123), '<p>123</p>', 'regular tags work');
    assert.equal(tag('p', { className: 'awesome' }, 123), '<p class="awesome">123</p>', 'regular tags with attributes work');
  });

  it('injectOrder', () => {
    const hash = {
      a: {},
      b: { order: 123 },
      c: {},
    };

    const expected = {
      a: { order: 0 },
      b: { order: 123 },
      c: { order: 2 },
    };

    const expectedBase = {
      a: { order: 10 },
      b: { order: 123 },
      c: { order: 12 },
    };

    assert.isObject(injectOrder({}), 'returns correct data type');
    assert.isNull(injectOrder(), 'empty arguments');
    assert.deepEqual(injectOrder(hash), expected, 'injects order correctly');
    assert.deepEqual(injectOrder(hash, 10), expectedBase, 'base offset works correctly');
    assert.isUndefined(hash.a.order, 'doesn\'t mutate original');
  });

  it('proxyMatch', () => {
    const matches = ['ab', 'c', 'def'];
    const expected = { content: 'ab' };

    assert.deepEqual(proxyMatch(matches), expected, 'extracts match correctly');
  });

  it('safeContent', () => {
    const content = 'fancy <script>alert(1);</script> pants';
    const expected = 'fancy &lt;script&gt;alert(1);&lt;/script&gt; pants';

    assert.equal(safeContent({ content }), expected, 'escapes content correctly');
  });

  it('emptyShorten', () => {
    assert.equal(emptyShorten('randomstring'), '…', 'returns expected value');
  });
});
