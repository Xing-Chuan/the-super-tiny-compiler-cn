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

// 我们接收源码，并设置两个变量 current、tokens
function tokenizer(input) {

  // 词法分析需要从头到尾遍历代码，`current` 变量用于表示当前遍历的位置，就像虚拟光标一样
  let current = 0;

  // `tokens` 数组用于收集 token
  let tokens = [];

  // 我们创建一个 `while` 循环来进行源码的遍历
  // 因为 token 长度不同，在 1 次循环中，current 可能会增加多次
  while (current < input.length) {

    // 缓存 `input` 中的 `current` 字段
    let char = input[current];

    // 我们需要检测的第一个情况就是开括号，这在之后会被函数调用 `CallExpression` 所用到。但是
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
 * 我们尝试将 tokens 数组解析成 AST（抽象语法树）
 *
 *   [{ type: 'paren', value: '(' }, ...]   =>   { type: 'Program', body: [...] }
 */

// 我们定义 `parser` 函数来接收 tokenizer 产出的 `tokens`
function parser(tokens) {

  // 我们还是创建 `current` 变量来表示当前虚拟光标的位置
  let current = 0;

  // 我们创建 AST 的根节点，`Program` 是 AST 的顶层节点
  let ast = {
    type: 'Program',
    body: [],
  };

  // 我们会遇到函数嵌套这种情况，所以这次我们用递归代替 `while` 循环
  function walk() {

    // 提取虚拟光标位置的token
    let token = tokens[current];

    // 我们检测是否为 `number` 类型的 token
    if (token.type === 'number') {

      // 如果是 `number`，current +1
      current++;

      // 我们返回 1 个 AST node 叫 `NumberLiteral（数字字面量）`
      return {
        type: 'NumberLiteral',
        value: token.value,
      };
    }

    // 如果是 `string` token，我们像 `number` 一样，创建 1 个 `StringLiteral（字符串字面量）` node
    if (token.type === 'string') {
      current++;

      return {
        type: 'StringLiteral',
        value: token.value,
      };
    }

    // 接下来我们看 CallExpressions(调用表达式)，它是从 1 个开括号开始的
    if (
      token.type === 'paren' &&
      token.value === '('
    ) {

      // current +1，跳过开括号，我们不关心它
      token = tokens[++current];

      // 我们创建一个 type 为 `CallExpression` 的基础 node 节点，设置 name 为 token 的 value
      // 开括号后面就是函数名
      let node = {
        type: 'CallExpression',
        name: token.value,
        params: [],
      };

      // current +1，我们跳过函数名，直接看表达式
      token = tokens[++current];

      // 为了收集 `CallExpression` 的 `params`，我们往后查询每个 token，直到遇到闭合括号
      //
      // 这就是需要递归的时候。我们使用递归而不是试图直接分析可能有无限多层嵌套节点的参数。
      //
      // 为了解释这个概念，以我们的 lisp 代码为例。你可以观察到 `add` 的参数是一个数字和一个嵌套
      // 的 `CallExpression`，而这个 `CallExpression` 又拥有自己的参数。
      //
      //   (add 2 (subtract 4 2))
      //
      // 你应该注意到了，我们的 tokens 数组有多个闭合括号
      //
      //   [
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'add'      },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'subtract' },
      //     { type: 'number', value: '4'        },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: ')'        }, <<< 闭合括号
      //     { type: 'paren',  value: ')'        }, <<< 闭合括号
      //   ]
      //
      // 我们依赖 `walk` 函数来增加 current

      // 所以我们创建 1 个 `while` 循环，继续循环token，直到遇到 1 个闭合括号
      while (
        (token.type !== 'paren') ||
        (token.type === 'paren' && token.value !== ')')
      ) {
        // 我们调用 `walk` 函数直到返回 1 个 `node` 节点，并且我们将 push 它到 `node.params`
        node.params.push(walk());
        token = tokens[current];
      }

      // 最后，我们将 current+1，跳过闭合括号
      current++;

      // 返回 node
      return node;
    }

    // 还是如此，如果 token 没有匹配，抛出类型错误
    throw new TypeError(token.type);
  }

  // 然后我们启动 `walk` 函数，推送 nodes 到 `ast.body`
  //
  // 我们在1个循环里做的原因，是因为 `CallExpression（函数调用表达式）` 可能是多个，且互不相关
  //
  //   (add 2 2)
  //   (subtract 4 2)
  //
  while (current < tokens.length) {
    ast.body.push(walk());
  }

  // parser 的最后，我们返回 AST
  return ast;
}

/**
 * ============================================================================
 *                                 ⌒(❀>◞౪◟<❀)⌒
 *                               THE TRAVERSER!!!
 * ============================================================================
 */

/**
 * 现在我们有AST了，并且我们可以用访问者模式来访问不同的 node 节点，
 * 当我们遇到匹配的 type 时，调用 visitor 上不同的方法，
 * 访问者模式是一种数据操作与数据操作分离的设计模式，
 * 如下方，我们需要在 enter、exit中处理节点
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

// 我们定义 traverser 函数来接收 AST 和 1个visitor，里面我们将要定义两个函数
function traverser(ast, visitor) {

  // `traverseArray` 函数将允许我们遍历数组，我们下面还要定义 1 个 `traverseNode` 函数
  function traverseArray(array, parent) {
    array.forEach(child => {
      traverseNode(child, parent);
    });
  }

  // `traverseNode` 将接收 node 节点和它们的父 node 节点
  // 可以把它们两个作为参数传递给我们的 visitor 方法，也就是
  function traverseNode(node, parent) {

    // 初始时，看看node type是否有对应的 visitor 方法
    let methods = visitor[node.type];

    // 如果有 enter 方法，我们就调用它，并传递两个参数
    if (methods && methods.enter) {
      methods.enter(node, parent);
    }

    // 接下来，我们根据当前 node type 的不同，需要区别处理
    switch (node.type) {

      // 开始时，最顶层的结构是 `Program`，它有名为 `body` 的属性，
      // 我们使用 `traverseArray` 递归处理所有子节点
      case 'Program':
        traverseArray(node.body, node);
        break;

      // 接下来，我们对 `CallExpression` 一样处理，循环它的 `params`，也就是下面的表达式体
      case 'CallExpression':
        traverseArray(node.params, node);
        break;

      // `NumberLiteral` 和 `StringLiteral`，它们下面已经没有子节点了，就不用额外处理了
      case 'NumberLiteral':
      case 'StringLiteral':
        break;

      // 如果没有触发上面的匹配，和之前一样抛出 1 个类型错误
      default:
        throw new TypeError(node.type);
    }

    // 如果 visitor 上有 `exit` 方法，我们执行它
    if (methods && methods.exit) {
      methods.exit(node, parent);
    }
  }

  // 最后我们用 AST 作为参数启动 `traverseNode` 函数，初始时在最顶层，所以是没父节点的
  traverseNode(ast, null);
}

/**
 * ============================================================================
 *                                   ⁽(◍˃̵͈̑ᴗ˂̵͈̑)⁽
 *                              THE TRANSFORMER!!!
 * ============================================================================
 */

/**
 * 接下来是 `transformer`，我们遍历 AST 节点树，通过 visitor 上的方法进行处理，生成新的 AST 树
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
 *                                    |         }
 *                                    |       }
 *                                    |     }]
 *                                    |   }
 * ----------------------------------------------------------------------------
 */

// 定义 `transformer` 函数接收 Lisp AST
function transformer(ast) {

  // 我们创建 `newAst`，像前面的 AST 一样，都有 Program 类型的根节点
  let newAst = {
    type: 'Program',
    body: [],
  };

  // 接下来我们做 hack 写法，我们在旧 AST 上挂 1 个 _content 方法，用来存储新 AST 的引用，
  // 只要记住它是一个引用就行了，通常可以有更好的抽象方法，这里我们尽量用简单的方法处理
  ast._context = newAst.body;

  // 我们调用 traverser 函数，用 ast、visitor 函数作为参数
  traverser(ast, {

    // 第一个 visitor 方法用来处理 `NumberLiteral`
    NumberLiteral: {
      // 我们将在访问到这个节点类型时被调用
      enter(node, parent) {
        // 新节点也是叫 `NumberLiteral`，我们将它 push 到新的 AST 树上
        parent._context.push({
          type: 'NumberLiteral',
          value: node.value,
        });
      },
    },

    // 接下来处理 `StringLiteral`
    StringLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: 'StringLiteral',
          value: node.value,
        });
      },
    },

    // 现在轮到 `CallExpression`
    CallExpression: {
      enter(node, parent) {
        // 我们创建新语言的 `CallExpression` 表达式结构
        let expression = {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: node.name,
          },
          arguments: [],
        };

        // 现在我们定义新的 _context 在原始 `CallExpression` node 上，将想转换的 node 节点 expression.arguments 挂载上去
        node._context = expression.arguments;

        // 那么，我们确认一下父节点是否是 `CallExpression`
        if (parent.type !== 'CallExpression') {

          // 我们用 `ExpressionStatement` node 包裹 `CallExpression` node，
          // 为什么这么做呢，因为在 JavaScript 语言中，顶层节点应该是个表达式声明
          expression = {
            type: 'ExpressionStatement',
            expression: expression,
          }; 
        }

        // 最后我们推送 `CallExpression` 到父节点的 _context 中，它的父节点可能是另一个函数调用
        parent._context.push(expression);
      },
    }
  });

  // 最后我们返回新创建的AST
  return newAst;
}

/**
 * ============================================================================
 *                               ヾ（〃＾∇＾）ﾉ♪
 *                            THE CODE GENERATOR!!!!
 * ============================================================================
 */

/**
 * 现在让我们看最后一步：代码生成
 * 递归调用它自身的所有子节点，最终通过 AST 树生成目标字符串
 */

function codeGenerator(node) {

  switch (node.type) {

    // 如果是 `Program` 根节点. 我们遍历其所有的子节点
    case 'Program':
      return node.body.map(codeGenerator)
        .join('\n');

    // `ExpressionStatement` 是包裹层，我们在最后面加 1 个 `;`，继续处理它的表达式体
    case 'ExpressionStatement':
      return (
        codeGenerator(node.expression) +
        ';' // << (...因为我们想让它是正确的语法格式)
      );

    // 对于 `CallExpression`，我们将打印它的 `callee`，拼接 `(`，map遍历处理它的 `arguments`，最后再加上 `)`
    case 'CallExpression':
      return (
        codeGenerator(node.callee) +
        '(' +
        node.arguments.map(codeGenerator)
          .join(', ') +
        ')'
      );

    // 对于 `Identifier`，我们返回 node 的 name 即可
    case 'Identifier':
      return node.name;

    // 对于 `NumberLiteral`，我们返回 node 的 value 即可
    case 'NumberLiteral':
      return node.value;

    // 对于 `NumberLiteral`，我们用 `""` 包裹 node 的 value 再返回
    case 'StringLiteral':
      return '"' + node.value + '"';

    // 如果未匹配到处理规则，抛出类型错误
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
 * 最终，我们创建 1 个 `compiler（编译器）` 函数
 * 这里，我们用这样的路径将它们串起来，这样更加直观
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

  return output;
}

/**
 * ============================================================================
 *                                   (๑˃̵ᴗ˂̵)و
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!YOU MADE IT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * ============================================================================
 */

// 现在，我们把所有方法导出
module.exports = {
  tokenizer,
  parser,
  traverser,
  transformer,
  codeGenerator,
  compiler,
};
