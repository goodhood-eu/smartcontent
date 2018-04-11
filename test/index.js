const { assert } = require('chai');
const { unicodeLength } = require('../lib/strings');
const createParser = require('../lib').default;

let process = null;

describe('modules/smartcontent', () => {
  beforeEach(() => { process = createParser(); });

  it('createParser - extend rules', () => {
    const rules = {
      custom: {
        pattern: /^(fuck|suck|cock)/,
        parse(matches) {
          return { content: matches[0] };
        },
        compile(node) {
          switch (node.content) {
            case 'fuck': return 'muck';
            case 'suck': return 'quack';
            case 'cock': return 'rock';
            default: return '';
          }
        },
      },
    };

    const customParser = createParser(rules);

    const text = 'obscenity replacement: fuck your duck and suck a cock';
    const expected = 'obscenity replacement: muck your duck and quack a rock';
    assert.equal(customParser(text), expected, 'additional rules work');
  });

  it('createParser - mutate rules', () => {
    const rules = {
      url: {
        compile() {
          return 'THISISURL';
        },
      },
    };


    const customParser = createParser(rules);

    const text = 'hoho google.com is a url';
    const expected = 'hoho THISISURL is a url';
    assert.equal(customParser(text), expected, 'mutating rules work');
  });

  it('process - XSS Safe', () => {
    const xss = 'fancy <script>alert(1);</script> pants';
    const escapedXSS = 'fancy &lt;script&gt;alert(1);&lt;/script&gt; pants';
    assert.equal(process(xss), escapedXSS, 'xss safe');
  });

  it('process - paragraphs', () => {
    const string = 'a \n\n\n\n\n\n\n\n\n\n b \n c \n\n\n d \n\n e';
    const expected = 'a<br /><br />b<br />c<br /><br />d<br /><br />e';
    const shortened = 'a…';
    assert.equal(process(string), expected, 'removed extra linebreaks');
    assert.equal(process(string, 3), shortened, 'shortened correctly');
  });

  it('process - newline', () => {
    const string = 'a \n   b';
    const expected = 'a<br />b';
    const shortened = 'a…';

    assert.equal(process(string), expected, 'linebreaks work');
    assert.equal(process(string, 2), shortened, 'shorten work');
  });

  it('process - whitespace', () => {
    const string = 'abraham            babraham';
    const expected = 'abraham babraham';
    assert.equal(process(string), expected, 'whitespace fixed');
  });

  it('process - brackets', () => {
    const text = 'abra (cababra google.com/awesome) etc etc';
    const expected = 'abra (cababra <a href="http://google.com/awesome">google.com/…</a>) etc etc';
    const expectedShort1 = 'abra (cababra <a href="http://google.com/awesome">google.com/…</a>…';
    const expectedShort2 = 'abra (cababra…';

    const parens = '(lol?) (info@diderot-berlin.de)';
    const expectedParens = '(lol?) (info@diderot-berlin.de)';

    assert.equal(process(text), expected, 'compiles brackets properly');
    assert.equal(process(text, 27), expectedShort1, 'shortens brackes and nested content correctly');
    assert.equal(process(text, 14), expectedShort2, 'shortens links inside nested content correctly');
    assert.equal(process(parens), expectedParens, 'email with parentheses around');
  });

  it('process - URL detection', () => {
    const notADomain = 'a.b.c. 01.02 01.02.03';

    const domainLike = 'ab.cd.e';
    const expectedDomainLike = '<a href="http://ab.cd">ab.cd</a>.e';

    const domainLikeTypo = 'hallo ich wohnein.berlin :)';

    const short = 'a google.com: b c';
    const expectedShort = 'a <a href="http://google.com">google.com</a>: b c';

    const shortQuot = 'a "geekhack.com" b c';
    const expectedShortQuot = 'a &quot;<a href="http://geekhack.com">geekhack.com</a>&quot; b c';

    const shortQuotDot = 'test link:            "google.com".';
    const expectedShortQuotDot = 'test link: &quot;<a href="http://google.com">google.com</a>&quot;.';

    const short2 = 'a google.com/awesome b';
    const expectedShort2 = 'a <a href="http://google.com/awesome">google.com/…</a> b';

    const short3 = 'a google.com?q=awesome b';
    const expectedShort3 = 'a <a href="http://google.com?q=awesome">google.com/…</a> b';

    const short4 = 'a google.com/awesome?q=query#hasharooo b';
    const expectedShort4 = 'a <a href="http://google.com/awesome?q=query#hasharooo">google.com/…</a> b';

    const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. https://www.facebook.com';
    const expectedLongText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. <a href="https://www.facebook.com">https://www.facebook.com</a>';

    const typo = 'sometext,awesome-google.com ok';

    const typo2 = 'wow -http://google.com ok';
    const expectedTypo2 = 'wow -<a href="http://google.com">http://google.com</a> ok';

    const regularForeign = 'wow https://www.google.de/awesomesauce ok';
    const expectedRegularForeign = 'wow <a href="https://www.google.de/awesomesauce">https://www.google.de/…</a> ok';


    assert.equal(process(notADomain), notADomain, 'domain-like string didn\'t get parsed');
    assert.equal(process(domainLike), expectedDomainLike, 'weird domain-like url highlighted only url-like part');
    assert.equal(process(domainLikeTypo), domainLikeTypo, 'domain-like typos are not processed');
    assert.equal(process(short), expectedShort, 'domain only url detected');
    assert.equal(process(shortQuot), expectedShortQuot, 'domain only url in quotes detected');
    assert.equal(process(shortQuotDot), expectedShortQuotDot, 'domain only url in quotes with dots detected');
    assert.equal(process(short2), expectedShort2, 'domain only url with path detected');
    assert.equal(process(short3), expectedShort3, 'domain only url with query detected');
    assert.equal(process(short4), expectedShort4, 'domain only complex url');
    assert.equal(process(longText), expectedLongText, 'long text ending with a URL');
    assert.equal(process(typo), typo, 'bail when url starts with punctuation');
    assert.equal(process(typo2), expectedTypo2, 'full url with typo works');
    assert.equal(process(regularForeign), expectedRegularForeign, '.de domain zone');
  });

  it('process - weird URL detection', () => {
    const dash = 'Foo http://www.erlangen.de/desktopdefault.aspx/tabid-1419/ bar';
    const expectedDash = 'Foo <a href="http://www.erlangen.de/desktopdefault.aspx/tabid-1419/">http://www.erlangen.de/…</a> bar';

    const punctuation = '<www.weser-kurier.de> (www.google.com)';
    const expectedPunctuation = '&lt;<a href="http://www.weser-kurier.de">www.weser-kurier.de</a>&gt; (<a href="http://www.google.com">www.google.com</a>)';

    const port = 'foo http://nebenan.de:3000/groups/170 bar';
    const expectedPort = 'foo <a href="http://nebenan.de:3000/groups/170">http://nebenan.de/…</a> bar';

    const quote = 'beep http://example.com/foo/bar/cap\'n_penis.jpg boop';
    const expectedQuote = 'beep <a href="http://example.com/foo/bar/cap\'n_penis.jpg">http://example.com/…</a> boop';

    const comma = 'beep www.weser-kurier.de/bremen_artikel,-Feuerwehreinsatz-immer-noch-im-Einsatz-_arid,1450695.html, boop';
    const expectedComma = 'beep <a href="http://www.weser-kurier.de/bremen_artikel,-Feuerwehreinsatz-immer-noch-im-Einsatz-_arid,1450695.html">www.weser-kurier.de/…</a>, boop';

    const hash = 'beep http://example.com/#page=shitAngularApp boop';
    const expectedHash = 'beep <a href="http://example.com/#page=shitAngularApp">http://example.com/…</a> boop';

    const googleMaps = '(https://www.google.de/maps/place/Helenesee/@52.2772037,14.4919374,16z/data=!4m5!3m4!1s0x4707963a01c5d239:0xa6409c84f3d67066!8m2!3d52.269166!4d14.4877058)';
    const expectedGoogleMaps = '(<a href="https://www.google.de/maps/place/Helenesee/@52.2772037,14.4919374,16z/data=!4m5!3m4!1s0x4707963a01c5d239:0xa6409c84f3d67066!8m2!3d52.269166!4d14.4877058">https://www.google.de/…</a>)';

    const wiki = 'a https://en.wikipedia.org/wiki/Scrum_(software_development) b';
    const expectedWiki = 'a <a href="https://en.wikipedia.org/wiki/Scrum_(software_development)">https://en.wikipedia.org/…</a> b';

    const query = 'a example.com?query=a,b,c q';
    const expectedQuery = 'a <a href="http://example.com?query=a,b,c">example.com/…</a> q';

    const java = 'a https://www.rsb-online.de/konzerte/konzertkalender/index_ger.html?eventId=56267&ACTION_OPASCALENDAR=displayEvent&lang=ger&startdate=2017/1/19&year:int=2017&month:int=1 b';
    const expectedJava = 'a <a href="https://www.rsb-online.de/konzerte/konzertkalender/index_ger.html?eventId=56267&ACTION_OPASCALENDAR=displayEvent&lang=ger&startdate=2017/1/19&year:int=2017&month:int=1">https://www.rsb-online.de/…</a> b';

    const quot = 'a "https://en.wikipedia.org/wiki/Scrum_(software_development)" b';
    const expectedQuot = 'a &quot;<a href="https://en.wikipedia.org/wiki/Scrum_(software_development)">https://en.wikipedia.org/…</a>&quot; b';

    const native1 = 'a http://google.com?search=wo+ist+Ausländerbehörde b';
    const expectedNative1 = 'a <a href="http://google.com?search=wo+ist+Ausländerbehörde">http://google.com/…</a> b';

    const native2 = 'a http://google.com?search=ЖЕПЪ b';
    const expectedNative2 = 'a <a href="http://google.com?search=ЖЕПЪ">http://google.com/…</a> b';

    const native3 = 'пы http://жепь.рф/ебрило.jpg щъ';
    const expectedNative3 = 'пы <a href="http://жепь.рф/ебрило.jpg">http://жепь.рф/…</a> щъ';

    const native4 = 'щачло https://жепь.рф/ебрило.png?тест=правда&картинка=пепяка.jpg#еще=ф,е,н-х/у/й; попячъ';
    const expectedNative4 = 'щачло <a href="https://жепь.рф/ебрило.png?тест=правда&картинка=пепяка.jpg#еще=ф,е,н-х/у/й">https://жепь.рф/…</a>; попячъ';

    assert.equal(process(dash), expectedDash, 'url with dashes in path detected');
    assert.equal(process(punctuation), expectedPunctuation, 'url with dashes in domain detected');
    assert.equal(process(port), expectedPort, 'url with port detected');
    assert.equal(process(quote), expectedQuote, 'url with quote detected');
    assert.equal(process(comma), expectedComma, 'url with comma detected');
    assert.equal(process(hash), expectedHash, 'url with hash detected');
    assert.equal(process(googleMaps), expectedGoogleMaps, 'url with @ sign detected');
    assert.equal(process(wiki), expectedWiki, 'url with parens () detected');
    assert.equal(process(query), expectedQuery, 'short url format with query detected');
    assert.equal(process(java), expectedJava, 'webserver from java people url parsing');
    assert.equal(process(quot), expectedQuot, 'surrounding url in quotation');

    assert.equal(process(native1), expectedNative1, 'string with umlauts');
    assert.equal(process(native2), expectedNative2, 'string with cyrillic');
    assert.equal(process(native3), expectedNative3, 'cyrillic domain');
    assert.equal(process(native4), expectedNative4, 'cyrillic domain with cyrrilic query');
  });

  it('process - email detection/shortening', () => {
    const url = 'abc bob@gmail.com def';

    const url2 = 'abc bob.bobson@gmail.com def';

    const expectedShort = 'abc bob.b…';
    const expectedShort2 = 'abc bob.bobson@gmail.com…';

    const emailDash = 'abc bob@bob-son.de def';

    const native1 = 'пы васъ@жепь.рф щъ';

    const native2 = 'пы müller@няш-мяш.рф щъ';

    const emailDot = 'abc bob.zor@bob-son.de def';

    const emailDotdot = 'abc bob.zor.blep@bob-son.de def';

    const emailDotdot2 = 'abc bob.zor.blep@bob-son.de.co.uk def';

    const emailDotattack = 'abc bob...zor.blep@bob-son.de def';

    const emailCopied = 'Von: Bob Segão Zor <sprachunterricht@nuk-wichertstrasse.de>';
    const expectedEmailCopied = 'Von: Bob Segão Zor &lt;sprachunterricht@nuk-wichertstrasse.de&gt;';

    const doubleWrap = 'abc <<bob@gmail.com>> def';
    const expectedDoubleWrap = 'abc &lt;&lt;bob@gmail.com&gt;&gt; def';

    assert.equal(process(url), url, 'email processed correcly');
    assert.equal(process(url2), url2, 'email with a dot processed correcly');
    assert.equal(process(url2, 10), expectedShort, 'email shortened correcly');
    assert.equal(process(url2, 25), expectedShort2, 'email longer text shortened correcly');

    assert.equal(process(emailDash), emailDash, 'email with a dot processed correcly');

    assert.equal(process(native1), native1, 'native email with cyrillic domain');
    assert.equal(process(native2), native2, 'native email with mixed cyrillic/german');
    assert.equal(process(emailDot), emailDot, 'email with a dot');
    assert.equal(process(emailDotdot), emailDotdot, 'email with two dots');
    assert.equal(process(emailDotdot2), emailDotdot2, 'email with two dots in domain');
    assert.equal(process(emailDotattack), emailDotattack, 'email with two dots one after another');
    assert.equal(process(emailCopied), expectedEmailCopied, 'someone copied email into text form');
    assert.equal(process(doubleWrap), expectedDoubleWrap, 'doublewrap');
  });

  it('process - URL shortening', () => {
    const longUrl = 'Check this out: http://google.com/?q=robot+unicorn+porn+three+robot+girls+polish+his+horn !!!';
    const expected = 'Check this out: <a href="http://google.com/?q=robot+unicorn+porn+three+robot+girls+polish+his+horn">http://google.com/…</a>…';
    const expected2 = 'Check this out: …';

    assert.equal(process(longUrl, 36), expected, 'url cut correctly');
    assert.equal(process(longUrl, 17), expected2, 'url cut avoided correctly');
  });

  it('text - weird symbols parsing', () => {
    const text = `
    🕹❤️🚜             apple.com

    çÿkä (błÿåt> google.com ҳӯй хўй хуј

    🕋🔝☑️ WOÖNDERSCHEIße ûü
    ùúū
    `;

    const expected = '🕹❤️🚜 <a href="http://apple.com">apple.com</a><br /><br />çÿkä (błÿåt&gt; <a href="http://google.com">google.com</a> ҳӯй…';

    assert.equal(process(text, 60), expected, 'long text processed correctly');
  });

  it('process - text shortening', () => {
    const text = `
    Lorem ipsum dolor (sit amet), consectetur adipisicing elit, sed do eiusmod tempor
    incididunt ut labore et dolore magna aliqua.


    Ut enim ad minim veniam, quis nostrud
    exercitation ullamco laboris nisi ut aliquip apple.com ex ea commodo consequat. Duis aute irure
    dolor in reprehenderit github.com in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
    Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
    mollit anim id est laborum.
    `;

    const expected = 'Lorem ipsum dolor (sit a…';

    const limit = 100;

    let result = process(text, limit);
    result = result.replace(/<.+>/g, ''); // remove html and ending char
    assert.isAtMost(unicodeLength(result), limit, 'content shortened below limit');
    assert.equal(process(text, 25), expected, 'parens shortened correctly');
  });
});
