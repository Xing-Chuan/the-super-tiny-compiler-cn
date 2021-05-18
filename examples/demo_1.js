
const code = `
function calc(a, b) {
	return a + b;
}
`;

function transform (originalCode) {
  if (typeof originalCode !== 'string') {
    return originalCode;
  }
  return originalCode.replace(/calc/, 'add');
}

console.log(transform(code));

// function add(a, b) {
//   return a + b;
// }