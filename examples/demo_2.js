const t = require('@babel/types');
const babelParser = require('@babel/parser');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;

const code = `
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
`;

// 1.解析
const ast = babelParser.parse(code);

// 2.转换
// 节点类型及数据结构，可以查看 estree 规范：https://github.com/estree/estree
traverse(ast, {
  // 进入节点时，会调用该visitor
  enter(path) {
    console.log('Log: path.node.type ->', path.node.type);
  },
  // 退出节点时, 会调用该visitor
  exit(path) {
    // console.log('exit')
  },
  // 可以直接写节点类型，如果扫描到该类型，会调用该visitor
  CallExpression(path) {
    const { callee } = path.node;

    // 判断是否为 console.log 且有父节点
    const isConsoleLog = t.isMemberExpression(callee) && callee.object.name === 'console' && callee.property.name === 'log';

    if (isConsoleLog) {
      // 如果父节点是声明函数，取它的函数名，添加到 console 中
      const funcPath = path.findParent(p => p.isFunctionDeclaration());
      if (funcPath) {
        const funcName = funcPath.node.id.name;
        path.node.arguments.unshift(t.stringLiteral(funcName));
      }
    }
  }
})

// 3.代码生成
const output = generate(ast)  
console.log('Input \n', code)
console.log('----------------------')
console.log('Output \n', output.code)
