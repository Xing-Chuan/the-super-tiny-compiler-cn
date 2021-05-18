const {
  tokenizer,
  parser,
  transformer,
  codeGenerator,
  compiler,
} = require('./the-super-tiny-compiler');

const input  = '(add 2 (subtract 4 2))';

console.log('Log: output ->', compiler(input));
// const output = 'add(2, subtract(4, 2));';