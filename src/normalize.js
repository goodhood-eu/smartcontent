const normalizeNewline = {
  pattern: /\r\n?/g,
  replace: '\n',
};

const stripTabs = {
  pattern: /\t/g,
  replace: '',
};

const formFeedToSpace = {
  pattern: /\f/g,
  replace: ' ',
};

const transforms = [
  normalizeNewline,
  stripTabs,
  formFeedToSpace,
];

const transform = (originalText) => (
  transforms.reduce((text, item) => text.replace(item.pattern, item.replace), originalText.trim())
);

export default transform;
