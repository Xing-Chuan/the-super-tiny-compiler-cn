
function plus (args = []) {
  return args.reduce((total, item) => total + item, 0);
}

function subtract (args = []) {
  return args.reduce((total, item) => total - item, 0);
}

function multiply (args) {
  return args.reduce((total, item) => total * item, 0);
}

function divide (args) {
  console.log(args);
  return args.reduce((total, item) => total / item, 0);
}

function calc(type, ...args) {
  console.log(type);
  console.log(args);
  switch (type) {
    case 'plus':
      return plus(args);
    case 'subtract':
      return subtract(args)
    case 'multiply':
      return multiply(args)
    case 'divide':
      return divide(args)
  }
}

