/* eslint no-use-before-define: "off" */
import merge from 'lodash.merge';
import { injectOrder } from './utils';
import { unicodeLength, shortenString } from './strings';
import normalize from './normalize';
import defaultRules from './rules';

const MAX_EXTRA_RULES = 1000000;
const orderedDefaultRules = injectOrder(defaultRules, MAX_EXTRA_RULES);


const getRuleOrder = (rules) => {
  const order = Object.keys(rules);
  order.sort((a, b) => rules[a].order - rules[b].order);
  return order;
};

const parse = (originalText, rules, order, state) => {
  const rulesCount = order.length;

  const innerParse = (innerText) => {
    let result = [];
    let text = innerText;

    while (text) {
      let skipped = 0;

      for (const name of order) {
        const rule = rules[name];
        const matches = rule.pattern.exec(text);

        if (!matches) {
          skipped += 1;
          continue;
        }

        const [captured] = matches;
        const parsed = rule.parse(matches, innerParse, state, result);
        text = text.substring(captured.length);

        if (Array.isArray(parsed)) {
          result = result.concat(parsed);
        } else {
          if (!parsed.type) parsed.type = name;
          result.push(parsed);
        }

        break;
      }

      if (rulesCount === skipped) throw new Error(`Couldn't find next token in: "${text}"`);
    }

    return result;
  };

  return innerParse(originalText);
};

const compile = (originalAst, limit, rules, state) => {
  let compiledLength = 0;
  let limitReached = false;

  const compileTree = (ast) => {
    const chunks = [];

    for (const node of ast) {
      if (limitReached) break;
      chunks.push(compileNode(node));
    }

    return chunks.join('');
  };

  const compileNode = (node) => {
    if (Array.isArray(node)) return compileTree(node);
    const rule = rules[node.type];

    const { content = '' } = node;
    const length = unicodeLength(content);
    let override;

    if (limit && compiledLength + length >= limit) {
      limitReached = true;
      const allowedLength = limit - compiledLength;

      if (typeof rule.shorten === 'function') {
        const proxy = (shortContent) => compileContent(rule, node, shortContent);
        return rule.shorten(node, allowedLength, proxy);
      }

      override = shortenString(content, allowedLength);
    }

    compiledLength += length;
    return compileContent(rule, node, override);
  };

  const compileContent = (rule, node, contentOverride) => {
    if (contentOverride) node.content = contentOverride;
    return rule.compile(node, compileNode, state);
  };

  return compileTree(originalAst);
};

const process = (text, limit, rules, order) => {
  const state = {};

  const normalized = normalize(text);
  const ast = parse(normalized, rules, order, state);
  const compiled = compile(ast, limit, rules, state);

  return compiled;
};

const createParser = (extraRules) => {
  // Order ranges:
  // 0 - 999999 extra rules, pre-parsing and taking away obvious embedded content
  // 1000000+ default rules, parsing newlines and catchall text rule
  // Deep merge to allow for rule method overrides
  const rules = merge({}, orderedDefaultRules, injectOrder(extraRules));
  const order = getRuleOrder(rules);

  return (text = '', limit = 0) => process(text, limit, rules, order);
};

export default createParser;
