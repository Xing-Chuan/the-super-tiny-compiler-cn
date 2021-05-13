'use strict';

/**
 * 今天我们会一起编写一个编译器。一个非常非常简化的微型编译器！这个编译器非常小，如果你移除这个
 * 文件里的注释，那么这个文件只剩下大概200行代码。
 *
 * 我们会将类似于LISP的函数调用编译成类似于C的函数调用。
 *
 * 如果你对这两个语言中的一个或者两个不熟悉。下面是一个快速的介绍。
 *
 * 如果我有两个函数`add`和`subtract`，它们会像下面这样被写出来：
 *
 *                  LISP                      C
 *
 *   2 + 2          (add 2 2)                 add(2, 2)
 *   4 - 2          (subtract 4 2)            subtract(4, 2)
 *   2 + (4 - 2)    (add 2 (subtract 4 2))    add(2, subtract(4, 2))
 *
 * 非常简单直观不是吗？
 *
 * 非常好，因为这就是我们要编译的代码。尽管这并不是一个完整的LISP或者C的编译器，但是它足够展示
 * 现代编译器的很多大部分组成部件。
 */

/**
 * 大部分编译器的工作可以被分解为三个主要阶段：解析（Parsing），转换（Transformation）以及
 * 代码生成（Code Generation）。
 *
 * 1. *解析* 将源代码转换为一个更抽象的形式。
 *
 * 2. *转换* 接受解析产生的抽象形式并且操纵这些抽象形式做任何编译器想让它们做的事。
 *
 * 3. *代码生成* 基于转换后的代码表现形式（code representation）生成目标代码。
 */

/**
 * 解析
 * -------
 *
 * 解析一般被分为两个部分：词法分析和语法分析。
 *
 * 1. *词法分析* 通过一个叫做tokenizer（词素生成器，也叫lexer）的工具将源代码分解成一个个词素。
 *
 *    词素是描述编程语言语法的对象。它可以描述数字，标识符，标点符号，运算符等等。
 *
 * 2. *语法分析* 接收词素并将它们组合成一个描述了源代码各部分之间关系的中间表达形式：抽象语法树。
 *
 *    抽象语法树是一个深度嵌套的对象，这个对象以一种既能够简单地操作又提供很多关于源代码信息的形式
 *    来展现代码。
 *
 * 看下面的代码:
 *
 *   (add 2 (subtract 4 2))
 *
 * 上面代码产生的词素会像下面这样：
 *
 *   [
 *     { type: 'paren',  value: '('        },
 *     { type: 'name',   value: 'add'      },
 *     { type: 'number', value: '2'        },
 *     { type: 'paren',  value: '('        },
 *     { type: 'name',   value: 'subtract' },
 *     { type: 'number', value: '4'        },
 *     { type: 'number', value: '2'        },
 *     { type: 'paren',  value: ')'        },
 *     { type: 'paren',  value: ')'        },
 *   ]
 *
 * 而产生的抽象语法树会像下面这样：
 *
 *   {
 *     type: 'Program',
 *     body: [{
 *       type: 'CallExpression',
 *       name: 'add',
 *       params: [{
 *         type: 'NumberLiteral',
 *         value: '2',
 *       }, {
 *         type: 'CallExpression',
 *         name: 'subtract',
 *         params: [{
 *           type: 'NumberLiteral',
 *           value: '4',
 *         }, {
 *           type: 'NumberLiteral',
 *           value: '2',
 *         }]
 *       }]
 *     }]
 *   }
 */

/**
 * 转换
 * --------------
 *
 * 编译器的下一个阶段是转换阶段。再回顾一遍，这个过程接收解析生成的抽象语法树并对它做出改动。
 * 转换阶段可以改变抽象语法树使代码保持在同一个语言（例如Babel，Babel接收的是JS代码生成的也是
 * JS代码），或者编译成另外一门语言。
 *
 * 让我们一起来看如何转换一个抽象语法树。
 *
 * 你可能会注意到我们的抽象语法树包含了长得非常相似的元素。观察那些含有type属性的元素。这些元素
 * 被称为抽象语法树的节点。每一个节点都描述了源代码中的一部分。
 *
 * 针对NumberLiteral我们有一个节点：
 *
 *   {
 *     type: 'NumberLiteral',
 *     value: '2',
 *   }
 *
 * 针对CallExpression我们也有一个节点：
 *
 *   {
 *     type: 'CallExpression',
 *     name: 'subtract',
 *     params: [...nested nodes go here...],
 *   }
 *
 * 在转换抽象语法树的时候，我们可以通过添加/删除/替换节点属性来操纵节点。我们也可以添加节点，
 * 删除节点，或者基于现有的抽象语法树创建一个全新的抽象语法树。
 *
 * 由于我们的编译目标是另外一门语言，所以我们集中注意力新建一个针对目标语言的全新抽象语法树。
 *
 * 遍历
 * ---------
 *
 * 为了处理节点，我们需要遍历它们。这个遍历的过程按照深度优先规则遍历每一个节点。
 *
 *   {
 *     type: 'Program',
 *     body: [{
 *       type: 'CallExpression',
 *       name: 'add',
 *       params: [{
 *         type: 'NumberLiteral',
 *         value: '2'
 *       }, {
 *         type: 'CallExpression',
 *         name: 'subtract',
 *         params: [{
 *           type: 'NumberLiteral',
 *           value: '4'
 *         }, {
 *           type: 'NumberLiteral',
 *           value: '2'
 *         }]
 *       }]
 *     }]
 *   }
 *
 * 所以针对上面这个抽象语法树我们会按照下面步骤遍历节点：
 *
 *   1. Program - 从抽象语法树的最顶端开始
 *   2. CallExpression (add) - 移动到Program的body属性中的第一个元素
 *   3. NumberLiteral (2) - 移动到CallExpression的params中的第一个元素
 *   4. CallExpression (subtract) - 移动到CallExpression的params中的第二个元素
 *   5. NumberLiteral (4) - 移动到CallExpression的params中的第一个元素
 *   6. NumberLiteral (2) - 移动到CallExpression的params中的第二个元素
 *
 * 如果我们直接操纵这个抽象语法树，而不是创建一个新的抽象语法树，那么我们就需要在这个步骤使用到
 * 很多不同的抽象概念。然而为了满足我们的需求，在这一步我们仅仅需要访问抽象语法树中的每一个节点
 * 即可。
 *
 * The reason I use the word "visiting" is because there is this pattern of how
 * to represent operations on elements of an object structure.
 * 在这里我使用“访问”这个词的与原因是因为存在着下面这个用来表示一个对象结构中元素行为的模式。
 *
 * 访问者
 * --------
 *
 * 基本的思想是我们会创建一个“访问者”对象，这个访问者对象有不同的方法来接受不同的节点类型。
 *
 *   var visitor = {
 *     NumberLiteral() {},
 *     CallExpression() {},
 *   };
 *
 * 当我们遍历抽象语法树的时候，我们会根据现在“进入”的节点的类型调用访问者对象相对应的方法。
 *
 * 为了使这个对象能够正常工作，我们需要传入当前节点以及当前节点的父节点的引用。
 *
 *   var visitor = {
 *     NumberLiteral(node, parent) {},
 *     CallExpression(node, parent) {},
 *   };
 *
 * 然而，也存在着在“离开”节点的时候调用方法的可能性。假设我们有以下的抽象语法树结构：
 *
 *   - Program
 *     - CallExpression
 *       - NumberLiteral
 *       - CallExpression
 *         - NumberLiteral
 *         - NumberLiteral
 *
 * 当我们向下遍历语法树的时候，我们会碰到所谓的叶子节点。我们在处理完一个节点后会“离开”这个节点。
 * 所以向下遍历树的时候我们“进入”节点，而向上返回的时候我们“离开”节点。
 *
 *   -> Program (enter)
 *     -> CallExpression (enter)
 *       -> Number Literal (enter)
 *       <- Number Literal (exit)
 *       -> Call Expression (enter)
 *          -> Number Literal (enter)
 *          <- Number Literal (exit)
 *          -> Number Literal (enter)
 *          <- Number Literal (exit)
 *       <- CallExpression (exit)
 *     <- CallExpression (exit)
 *   <- Program (exit)
 *
 * 为了支持上面所讲的功能，我们的访问者对象的最终形态如下：
 *
 *   var visitor = {
 *     NumberLiteral: {
 *       enter(node, parent) {},
 *       exit(node, parent) {},
 *     }
 *   };
 */

/**
 * 代码生成
 * ---------------
 *
 * 编译器的最后步骤是代码生成。有时候编译器在这个步骤也会执行转换阶段的一些行为，但是大体而言代
 * 码生成阶段的工作就是基于转换步骤产生的抽象语法树生成目标代码。
 *
 * 代码生成器的工作方式多种多样，一些编译器会重新利用更早阶段产生的词素，还有一些编译器会创建一
 * 个独立的代码表达形式从而能够线性地打印节点，但是基于我的经验大部分编译器会使用我们刚刚创造的
 * 那个抽象语法树，这也是我们接下来讲的方法。
 *
 * 一个有效的代码生成器知道如何“打印”抽象语法树不同类型的节点，并且会递归地调用自己来打印嵌套的
 * 节点直到整个语法树被打印成一长串完整的代码字符串。
 */

/**
 * 上面所讲到的就是编译器的所有不同部分了。
 *
 * 这并不表明所有编译器都像我上面描述的那样工作。不同的编译器有各种各样不同的目的，它们可能需要
 * 一些我没有讲到的步骤。
 *
 * 但是现在你应该已经有了一个编译器如何工作的大体概念了。
 *
 * 既然现在我已经解释了所有东西，你就可以立马动手写一个你自己的编译器了不是吗？
 *
 * 开个玩笑，我会帮助你理解如何写一个编译器 :P。
 *
 * 那么我们开始吧
 */

/**
 * ============================================================================
 *                                   (/^▽^)/
 *                                THE TOKENIZER!
 * ============================================================================
 */

/**
 * 让我们从 parsing 的第一步开始吧，用 tokenizer 进行词法分析
 * 
 * 我们只是将字符串代码，拆分成下方的 tokens 数组
 *
 *   (add 2 (subtract 4 2))   =>   [{ type: 'paren', value: '(' }, ...]
 */

// 我们首先要接收 1 个字符串代码，并设置两个变量
function tokenizer(input) {

  // `current` 变量用于溯源我们在代码中的位置，就像代码中存在虚拟光标一样
  let current = 0;

  // `tokens` 数组用于收集 token
  let tokens = [];

  // 我们创建一个 `while` 循环来设置 `current`，我们根据需求来增加 current 的值
  // 因为 token 长度不同，在 1 次循环中，current 可能增加多次
  while (current < input.length) {

    // 缓存 `input` 中的 `current` 字段
    let char = input[current];

    // 我们需要检测的第一个情况就是开括号，这在之后会被函数调用`CallExpression`所用到。但是
    // 现在我们只需要关心字符即可。
    //
    // 我们检测是否有一个开括号
    if (char === '(') {

      // 如果字符为开括号，我们 push 1个新 token，type 为 `paren`，value 为 `(`
      tokens.push({
        type: 'paren',
        value: '(',
      });

      // current 虚拟光标往前移动一步
      current++;

      // 然后继续下个循环
      continue;
    }

    // 下面我们监测一下闭合括号，这里和前面一样，确认的话，新增 1 个 token，增加 current，继续下个循环
    if (char === ')') {
      tokens.push({
        type: 'paren',
        value: ')',
      });
      current++;
      continue;
    }

    // 我们现在要检测空格，这里很有趣，因为空格存在的意义是分离字符，实际上对于 token 的存储并不重要，我们这里略过它就行了
    let WHITESPACE = /\s/;
    if (WHITESPACE.test(char)) {
      current++;
      continue;
    }

    // 下种 token 类型是数字，这里和前面不同，因为数字可能是连续的
    //
    //   (add 123 456)
    //        ^^^ ^^^
    //        只能分出两个 token
    //
    // 所以当我们遇到第一个数字时，进行下面的处理
    let NUMBERS = /[0-9]/;
    if (NUMBERS.test(char)) {

      // 我们创建1个 `value` 变量来存储字符
      let value = '';

      // 我们不断向后循环，直到遇到的字符不是数字
      while (NUMBERS.test(char)) {
        value += char;
        char = input[++current];
      }

      // 推送 1 个数字类型的 token 到 tokens
      tokens.push({ type: 'number', value });

      // 继续下个循环
      continue;
    }

    // 我们的语言也支持字符串，1 段被 `"` 包裹起来的文本
    //
    //   (concat "foo" "bar")
    //            ^^^   ^^^ string tokens
    //
    // 我们开始做引号的检测
    if (char === '"') {
      // 用 `value` 来收集字符串 token
      let value = '';

      // 我们跳过双括号本身，从后面 1 位开始
      char = input[++current];

      // 向后迭代查找，直到找到另一个 `"`
      while (char !== '"') {
        value += char;
        char = input[++current];
      }

      // 跳过闭合的双引号
      char = input[++current];

      // 我们添加 string token 到 tokens
      tokens.push({ type: 'string', value });

      continue;
    }

    // 最后 1 种 token 是 `name` token，也是一个字母序列，在 lisp 中是函数名
    //
    //   (add 2 4)
    //    ^^^
    //    Name token
    //
    let LETTERS = /[a-z]/i;
    if (LETTERS.test(char)) {
      let value = '';

      // 我们遍历循环字母，添加到 value 变量
      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }

      // 我们添加 `name` token 并继续循环
      tokens.push({ type: 'name', value });

      continue;
    }

    // 最后我们进行语法校验，如果我们没有匹配到结果，则抛出错误，停止执行
    throw new TypeError('I dont know what this character is: ' + char);
  }

  // `tokenizer` 结束时，我们返回 tokens
  return tokens;
}

/**
 * ============================================================================
 *                                 ヽ/❀o ل͜ o\ﾉ
 *                                THE PARSER!!!
 * ============================================================================
 */

/**
 * 现在我们尝试将 tokens 数组解析成 AST（抽象语法树）
 *
 *   [{ type: 'paren', value: '(' }, ...]   =>   { type: 'Program', body: [...] }
 */

// 我们定义 `parser` 函数来接收 `tokens`
function parser(tokens) {

  // 我们还是创建 1 个 `current` 变量作为虚拟光标
  let current = 0;

  // 但是这次我们用递归代替 `while` 循环，所以我们创建 1 个 `walk` 函数
  function walk() {

    // Inside the walk function we start by grabbing the `current` token.
    let token = tokens[current];

    // We're going to split each type of token off into a different code path,
    // starting off with `number` tokens.
    //
    // We test to see if we have a `number` token.
    if (token.type === 'number') {

      // If we have one, we'll increment `current`.
      current++;

      // And we'll return a new AST node called `NumberLiteral` and setting its
      // value to the value of our token.
      return {
        type: 'NumberLiteral',
        value: token.value,
      };
    }

    // If we have a string we will do the same as number and create a
    // `StringLiteral` node.
    if (token.type === 'string') {
      current++;

      return {
        type: 'StringLiteral',
        value: token.value,
      };
    }

    // Next we're going to look for CallExpressions. We start this off when we
    // encounter an open parenthesis.
    if (
      token.type === 'paren' &&
      token.value === '('
    ) {

      // We'll increment `current` to skip the parenthesis since we don't care
      // about it in our AST.
      token = tokens[++current];

      // We create a base node with the type `CallExpression`, and we're going
      // to set the name as the current token's value since the next token after
      // the open parenthesis is the name of the function.
      let node = {
        type: 'CallExpression',
        name: token.value,
        params: [],
      };

      // We increment `current` *again* to skip the name token.
      token = tokens[++current];

      // And now we want to loop through each token that will be the `params` of
      // our `CallExpression` until we encounter a closing parenthesis.
      //
      // Now this is where recursion comes in. Instead of trying to parse a
      // potentially infinitely nested set of nodes we're going to rely on
      // recursion to resolve things.
      //
      // To explain this, let's take our Lisp code. You can see that the
      // parameters of the `add` are a number and a nested `CallExpression` that
      // includes its own numbers.
      //
      //   (add 2 (subtract 4 2))
      //
      // You'll also notice that in our tokens array we have multiple closing
      // parenthesis.
      //
      //   [
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'add'      },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'subtract' },
      //     { type: 'number', value: '4'        },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: ')'        }, <<< Closing parenthesis
      //     { type: 'paren',  value: ')'        }, <<< Closing parenthesis
      //   ]
      //
      // We're going to rely on the nested `walk` function to increment our
      // `current` variable past any nested `CallExpression`.

      // So we create a `while` loop that will continue until it encounters a
      // token with a `type` of `'paren'` and a `value` of a closing
      // parenthesis.
      while (
        (token.type !== 'paren') ||
        (token.type === 'paren' && token.value !== ')')
      ) {
        // we'll call the `walk` function which will return a `node` and we'll
        // push it into our `node.params`.
        node.params.push(walk());
        token = tokens[current];
      }

      // Finally we will increment `current` one last time to skip the closing
      // parenthesis.
      current++;

      // And return the node.
      return node;
    }

    // Again, if we haven't recognized the token type by now we're going to
    // throw an error.
    throw new TypeError(token.type);
  }

  // 现在我们创建 1 个 `Program` AST 根节点
  let ast = {
    type: 'Program',
    body: [],
  };

  // 然后我们启动 `walk` 函数，推送 nodes 到 `ast.body`
  //
  // 我们在1个循环里做的原因，是因为 `CallExpression` 可能是多个，且互不相关
  // 注：`CallExpression` 是函数调用表达式的意思
  //
  //   (add 2 2)
  //   (subtract 4 2)
  //
  while (current < tokens.length) {
    ast.body.push(walk());
  }

  // At the end of our parser we'll return the AST.
  return ast;
}

/**
 * ============================================================================
 *                                 ⌒(❀>◞౪◟<❀)⌒
 *                               THE TRAVERSER!!!
 * ============================================================================
 */

/**
 * So now we have our AST, and we want to be able to visit different nodes with
 * a visitor. We need to be able to call the methods on the visitor whenever we
 * encounter a node with a matching type.
 *
 *   traverse(ast, {
 *     Program: {
 *       enter(node, parent) {
 *         // ...
 *       },
 *       exit(node, parent) {
 *         // ...
 *       },
 *     },
 *
 *     CallExpression: {
 *       enter(node, parent) {
 *         // ...
 *       },
 *       exit(node, parent) {
 *         // ...
 *       },
 *     },
 *
 *     NumberLiteral: {
 *       enter(node, parent) {
 *         // ...
 *       },
 *       exit(node, parent) {
 *         // ...
 *       },
 *     },
 *   });
 */

// So we define a traverser function which accepts an AST and a
// visitor. Inside we're going to define two functions...
function traverser(ast, visitor) {

  // A `traverseArray` function that will allow us to iterate over an array and
  // call the next function that we will define: `traverseNode`.
  function traverseArray(array, parent) {
    array.forEach(child => {
      traverseNode(child, parent);
    });
  }

  // `traverseNode` will accept a `node` and its `parent` node. So that it can
  // pass both to our visitor methods.
  function traverseNode(node, parent) {

    // We start by testing for the existence of a method on the visitor with a
    // matching `type`.
    let methods = visitor[node.type];

    // If there is an `enter` method for this node type we'll call it with the
    // `node` and its `parent`.
    if (methods && methods.enter) {
      methods.enter(node, parent);
    }

    // Next we are going to split things up by the current node type.
    switch (node.type) {

      // We'll start with our top level `Program`. Since Program nodes have a
      // property named body that has an array of nodes, we will call
      // `traverseArray` to traverse down into them.
      //
      // (Remember that `traverseArray` will in turn call `traverseNode` so  we
      // are causing the tree to be traversed recursively)
      case 'Program':
        traverseArray(node.body, node);
        break;

      // Next we do the same with `CallExpression` and traverse their `params`.
      case 'CallExpression':
        traverseArray(node.params, node);
        break;

      // In the cases of `NumberLiteral` and `StringLiteral` we don't have any
      // child nodes to visit, so we'll just break.
      case 'NumberLiteral':
      case 'StringLiteral':
        break;

      // And again, if we haven't recognized the node type then we'll throw an
      // error.
      default:
        throw new TypeError(node.type);
    }

    // If there is an `exit` method for this node type we'll call it with the
    // `node` and its `parent`.
    if (methods && methods.exit) {
      methods.exit(node, parent);
    }
  }

  // Finally we kickstart the traverser by calling `traverseNode` with our ast
  // with no `parent` because the top level of the AST doesn't have a parent.
  traverseNode(ast, null);
}

/**
 * ============================================================================
 *                                   ⁽(◍˃̵͈̑ᴗ˂̵͈̑)⁽
 *                              THE TRANSFORMER!!!
 * ============================================================================
 */

/**
 * Next up, the transformer. Our transformer is going to take the AST that we
 * have built and pass it to our traverser function with a visitor and will
 * create a new ast.
 *
 * ----------------------------------------------------------------------------
 *   Original AST                     |   Transformed AST
 * ----------------------------------------------------------------------------
 *   {                                |   {
 *     type: 'Program',               |     type: 'Program',
 *     body: [{                       |     body: [{
 *       type: 'CallExpression',      |       type: 'ExpressionStatement',
 *       name: 'add',                 |       expression: {
 *       params: [{                   |         type: 'CallExpression',
 *         type: 'NumberLiteral',     |         callee: {
 *         value: '2'                 |           type: 'Identifier',
 *       }, {                         |           name: 'add'
 *         type: 'CallExpression',    |         },
 *         name: 'subtract',          |         arguments: [{
 *         params: [{                 |           type: 'NumberLiteral',
 *           type: 'NumberLiteral',   |           value: '2'
 *           value: '4'               |         }, {
 *         }, {                       |           type: 'CallExpression',
 *           type: 'NumberLiteral',   |           callee: {
 *           value: '2'               |             type: 'Identifier',
 *         }]                         |             name: 'subtract'
 *       }]                           |           },
 *     }]                             |           arguments: [{
 *   }                                |             type: 'NumberLiteral',
 *                                    |             value: '4'
 * ---------------------------------- |           }, {
 *                                    |             type: 'NumberLiteral',
 *                                    |             value: '2'
 *                                    |           }]
 *  (sorry the other one is longer.)  |         }
 *                                    |       }
 *                                    |     }]
 *                                    |   }
 * ----------------------------------------------------------------------------
 */

// So we have our transformer function which will accept the lisp ast.
function transformer(ast) {

  // We'll create a `newAst` which like our previous AST will have a program
  // node.
  let newAst = {
    type: 'Program',
    body: [],
  };

  // Next I'm going to cheat a little and create a bit of a hack. We're going to
  // use a property named `context` on our parent nodes that we're going to push
  // nodes to their parent's `context`. Normally you would have a better
  // abstraction than this, but for our purposes this keeps things simple.
  //
  // Just take note that the context is a reference *from* the old ast *to* the
  // new ast.
  ast._context = newAst.body;

  // We'll start by calling the traverser function with our ast and a visitor.
  traverser(ast, {

    // The first visitor method accepts any `NumberLiteral`
    NumberLiteral: {
      // We'll visit them on enter.
      enter(node, parent) {
        // We'll create a new node also named `NumberLiteral` that we will push to
        // the parent context.
        parent._context.push({
          type: 'NumberLiteral',
          value: node.value,
        });
      },
    },

    // Next we have `StringLiteral`
    StringLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: 'StringLiteral',
          value: node.value,
        });
      },
    },

    // Next up, `CallExpression`.
    CallExpression: {
      enter(node, parent) {

        // We start creating a new node `CallExpression` with a nested
        // `Identifier`.
        let expression = {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: node.name,
          },
          arguments: [],
        };

        // Next we're going to define a new context on the original
        // `CallExpression` node that will reference the `expression`'s arguments
        // so that we can push arguments.
        node._context = expression.arguments;

        // Then we're going to check if the parent node is a `CallExpression`.
        // If it is not...
        if (parent.type !== 'CallExpression') {

          // We're going to wrap our `CallExpression` node with an
          // `ExpressionStatement`. We do this because the top level
          // `CallExpression` in JavaScript are actually statements.
          expression = {
            type: 'ExpressionStatement',
            expression: expression,
          };
        }

        // Last, we push our (possibly wrapped) `CallExpression` to the `parent`'s
        // `context`.
        parent._context.push(expression);
      },
    }
  });

  // At the end of our transformer function we'll return the new ast that we
  // just created.
  return newAst;
}

/**
 * ============================================================================
 *                               ヾ（〃＾∇＾）ﾉ♪
 *                            THE CODE GENERATOR!!!!
 * ============================================================================
 */

/**
 * Now let's move onto our last phase: The Code Generator.
 *
 * Our code generator is going to recursively call itself to print each node in
 * the tree into one giant string.
 */

function codeGenerator(node) {

  // We'll break things down by the `type` of the `node`.
  switch (node.type) {

    // If we have a `Program` node. We will map through each node in the `body`
    // and run them through the code generator and join them with a newline.
    case 'Program':
      return node.body.map(codeGenerator)
        .join('\n');

    // For `ExpressionStatement` we'll call the code generator on the nested
    // expression and we'll add a semicolon...
    case 'ExpressionStatement':
      return (
        codeGenerator(node.expression) +
        ';' // << (...because we like to code the *correct* way)
      );

    // For `CallExpression` we will print the `callee`, add an open
    // parenthesis, we'll map through each node in the `arguments` array and run
    // them through the code generator, joining them with a comma, and then
    // we'll add a closing parenthesis.
    case 'CallExpression':
      return (
        codeGenerator(node.callee) +
        '(' +
        node.arguments.map(codeGenerator)
          .join(', ') +
        ')'
      );

    // For `Identifier` we'll just return the `node`'s name.
    case 'Identifier':
      return node.name;

    // For `NumberLiteral` we'll just return the `node`'s value.
    case 'NumberLiteral':
      return node.value;

    // For `StringLiteral` we'll add quotations around the `node`'s value.
    case 'StringLiteral':
      return '"' + node.value + '"';

    // And if we haven't recognized the node, we'll throw an error.
    default:
      throw new TypeError(node.type);
  }
}

/**
 * ============================================================================
 *                                  (۶* ‘ヮ’)۶”
 *                         !!!!!!!!THE COMPILER!!!!!!!!
 * ============================================================================
 */

/**
 * FINALLY! We'll create our `compiler` function. Here we will link together
 * every part of the pipeline.
 *
 *   1. input  => tokenizer   => tokens
 *   2. tokens => parser      => ast
 *   3. ast    => transformer => newAst
 *   4. newAst => generator   => output
 */

function compiler(input) {
  let tokens = tokenizer(input);
  let ast    = parser(tokens);
  let newAst = transformer(ast);
  let output = codeGenerator(newAst);

  // and simply return the output!
  return output;
}

/**
 * ============================================================================
 *                                   (๑˃̵ᴗ˂̵)و
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!YOU MADE IT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * ============================================================================
 */

// Now I'm just exporting everything...
module.exports = {
  tokenizer,
  parser,
  traverser,
  transformer,
  codeGenerator,
  compiler,
};
