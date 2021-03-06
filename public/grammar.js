// Generated automatically by nearley, version 2.16.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }


/** About the grammar
 *    math expressions involve the following operators:
 *      +: numeric addition, concatenate strings, concatenate lists
 *      -: unary numeric negation or numeric subtraction
 *      *: numeric mult or list build e.g. '[0] * 4'
 *      /: numeric (float and int (javascript / )) division
 *      ^: numeric exponentiation
 *
 *      math expressions reduce to the following single 'terms':
 *        number, list, string, callable, varName
 *
 *      math expressions are a strict subset of bool expressions
 *
 *    bool expressions are a superset of math expressions 
 *    (5 || 0 makes sense; True * False does not). bool
 *    expressions involve the following operators:
 *      ||: logical incluisve or
 *      &&: logical and
 *      !: logical not
 *
 *    bool expressions reduce to the following single 'terms':
 *      math expression terms + true, false, or parenthesized 
 *      boolean expressions
 *
 *    expressions (most generic) are simply the union of bool expressions
 *    and dictionary terms. dictionary terms have no applicable
 *    operators, so they get their own classification
 */

  const lexer = moo.compile({
    " ": " ",
    "\t": "\t",
    "\n": "\n",
    "-": "-",
    "+": "+",
    "*": "*",
    "//": "//",
    "/": "/",
    "^": "^",
    MOD: "%",
    DOT: ".",
    LESSEQ: "<=",
    GREATEQ: ">=",
    EQEQ: "==",
    NOTEQ: "!=",
    TRUE: "true",
    FALSE: "false",
    OR: "||",
    AND: "&&",
    NOT: "!",
    ">": ">",
    "<": "<",
    ",": ",",
    "(": "(",
    ")": ")",
    "=": "=",
    "{": "{",
    "}": "}",
    "[": "[",
    "]": "]",
    ":": ":",
    ";": ";",
    "$": "$",
    QUOTE: "\"",
    FOR: "for",
    WHILE: "while",
    IF: "if",
    ELSE: "else",
    ELIF: "elif",
    DEF: "define",
    RET: "return",
    NULL: "null",
    number: /-?(?:[0-9]|[0-9][0-9]+)(?:\.[0-9]+)?(?:[eE][-+]?[0-9]+)?\b/,
    varName: /[a-zA-Z][a-zA-Z0-9_]*/,
    character: /[^\n"]/, 
  });



// overloaded + for str-like objects
// including react <span> elements 
function combineStrings(...strings) {
  return makeSpan(strings);
}

/** Postprocessors build a tree of function/operator calls
 *  where each node is an object with the following properties:
 *
 *  isLiteral: this subtree is composed entirely of literal (string/number) nodes
 *  opNodes: references to child nodes
 *  command: command object that calculates the desired result by calling 
 *           child node commands and combining these with the operator or function
 *
 *  About Command object nodes and evaluation:
 *    semantic checks for errors in expressions like ("cat" + 3)
 *    occur when the function is evaluated (i.e. when node.command.execute() is called), 
 *    not when the tree is built. 
 *    This is because the types of some operands may not be known at compiile time 
 *    (i.e. variable and function calls)
 */


/** cloneOperands
 *    helper method to clone an array of operands
 */
function cloneOperands(operands) {
  return operands.map(x => {
    if (x == null) return null;
    if (x.isLiteral) return x;
    if (x.clone) return x.clone();
    if (x instanceof Array) return cloneOperands(x);
    return x;
  });
}

/** buildAddSub 
 *    create addition or subtraction node
 *
 *    pattern:
 *    sum -> sum _ ("+"|"-") _ product 
 */
function buildAddSub(operands) {
  var operator = operands[2];
  if (operator == "+")
    return buildAdd(operands[0], operands[4]);
  return buildSub(operands[0], operands[4]);
}

/** buildAdd 
 *    valid operator only for two string/number results
 */
function buildAdd(opNode1, opNode2) {
  return {
    isLiteral: opNode1.isLiteral && opNode2.isLiteral,
    opNodes: [opNode1, opNode2],
    command: new AddCommand(opNode1, opNode2),
    clone: function() {
      return buildAdd(opNode1.clone(), opNode2.clone());
    },
    toString: () => "buildAdd",
    text: opNode1.text + " + " + opNode2.text,
    formatTrace: (o1, o2) => combineStrings(o1," + ", o2),
  };
}

function buildSub(opNode1, opNode2) {
  return {
    isLiteral: opNode1.isLiteral && opNode2.isLiteral,
    opNodes: [opNode1, opNode2],
    command: new SubCommand(opNode1, opNode2),
    clone: function() {
      return buildSub(opNode1.clone(), opNode2.clone());
    },
    toString: () => "buildSub",
    text: opNode1.text + " - " + opNode2.text,
    formatTrace: (o1, o2) => combineStrings(o1, " - ",  o2),
  };
}


/** buildMultDiv
 *    create multiplication or division node
 *
 *    pattern:
 *    product -> product _ ("*"|"/") _ exp
 */
function buildMultDiv(operands) {
  var operator = operands[2];
  if (operator == "*")
    return buildMult(operands[0], operands[4]);
  else if (operator == "/")
    return buildDiv(operands[0], operands[4]);
  else if (operator == "//")
    return buildFloorDiv(operands[0], operands[4]);
  else 
    return buildMod(operands[0], operands[4]);
}


/** buildMult 
 *    valid operator only for two string/number results
 */
function buildMult(opNode1, opNode2) {
  return {
    isLiteral: opNode1.isLiteral && opNode2.isLiteral,
    opNodes: [opNode1, opNode2],
    command: new MultCommand(opNode1, opNode2),
    clone: function() {
      return buildMult(opNode1.clone(), opNode2.clone());
    },
    toString: () => "buildMult",
    text: opNode1.text + " * " + opNode2.text,
    formatTrace: (o1, o2) => combineStrings(o1, " * ",  o2),
  };
}

/** buildDiv 
 *    valid operator only for two number results
 */
function buildDiv(opNode1, opNode2) {
  return {
    isLiteral: opNode1.isLiteral && opNode2.isLiteral,
    opNodes: [opNode1, opNode2],
    command: new DivCommand(opNode1, opNode2),
    clone: function() {
      return buildDiv(opNode1.clone(), opNode2.clone());
    },
    toString: () => "buildDiv",
    text: opNode1.text + " / " + opNode2.text,
    formatTrace: (o1, o2) => combineStrings(o1, " / ",  o2),
  };
}
function buildFloorDiv(opNode1, opNode2) {
  return {
    isLiteral: opNode1.isLiteral && opNode2.isLiteral,
    opNodes: [opNode1, opNode2],
    command: new FloorDivCommand(opNode1, opNode2),
    clone: function() {
      return buildFloorDiv(opNode1.clone(), opNode2.clone());
    },
    toString: () => "buildFloorDiv",
    text: opNode1.text + " // " + opNode2.text,
    formatTrace: (o1, o2) => combineStrings(o1, " // ",  o2),
  };
}

function buildMod(opNode1, opNode2) {
  return {
    isLiteral: opNode1.isLiteral && opNode2.isLiteral,
    opNodes: [opNode1, opNode2],
    command: new ModCommand(opNode1, opNode2),
    clone: function() {
      return buildMod(opNode1.clone(), opNode2.clone());
    },
    toString: () => "buildMod",
    text: opNode1.text + " % " + opNode2.text,
    formatTrace: (o1, o2) => combineStrings(o1, " % ",  o2),
  }
}

/** buildExp
 *    create exponentiation node (right associative)
 *
 *    pattern:
 *    exp -> unaryNeg _ "^" _ exp  
 */
function buildExp(operands) {
  var opNode1 = operands[0];
  var opNode2 = operands[4];
  return {
    isLiteral: opNode1.isLiteral && opNode2.isLiteral,
    opNodes: [opNode1, opNode2],
    command: new ExponentCommand(opNode1, opNode2),
    clone: function() {
      return buildExp(cloneOperands(operands));
    },
    toString: () => "buildExp",
    text: opNode1.text + " ^ " + opNode2.text,
    formatTrace: (o1, o2) => combineStrings(o1, " ^ ",  o2),
  };
}

/** buildNegate
 *    create unary negation node 
 *
 *    pattern:
 *    Negate -> "-" factor 
 */
function buildNegate(operands) {
  var opNode = operands[1];
  return {
    isLiteral: opNode.isLiteral,
    opNodes: [opNode],
    command: new NegateNumberCommand(opNode),
    clone: function() {
      return buildNegate(cloneOperands(operands));
    },
    toString: () => "buildNegate",
    text: "- " + opNode.text,
    formatTrace: (o1) => combineStrings(" - ",  o1),
  };
}


/** buildFunctionCall 
 *    build command node using 
 *    factory method for function Command
 *    objects
 *
 *    isLiteral false by definition
 *
 *  pattern:
 *    function -> objExpr "(" _ args _ ")" 
 *              | objExpr "(" ")"      
 *              | "$" "(" _ args _ ")" 
 *   
 */
function buildFunctionCall(operands) {
  var functionNode = operands[0];
  var functionArgs = []; // default (no args function)

  // save function name for interpreter
  var functionName = operands[0].varName || operands[0].text || "";

  if (operands.length == 6) 
    functionArgs = operands[3];

  return {
    isLiteral: false,
    functionName: operands[0].text,
    opNodes: functionArgs,
    command: new FunctionCallCommand(functionName, functionNode, functionArgs),
    clone: function() {
      return buildFunctionCall(cloneOperands(operands));
    },
    toString: () => "buildFunctionCall",
    text: operands[0].text + "( " + functionArgs.map(x => x.text).join(", ") + " )",
    formatTrace: (o1, ...args) => combineStrings(o1, "(", joinStrings(args, ", "), ")"),
  };
}

/** buildBuckGet 
 *    interpret this as $("objLabel")
 *    by creating a function ast node
 * 
 *    "$" %varName 
 */
function buildBuckGet(operands) {
  var functionName = operands[0].text;
  var functionNode = operands[0]; // never gets executed because "$" is built-in
  var functionArgs = [wrapUnquotedString([operands[1]])];

  return {
    isLiteral: false,
    opNodes: functionArgs,
    command: new FunctionCallCommand(functionName, functionNode, functionArgs),
    clone: function() {
      return buildBuckGet(cloneOperands(operands));
    },
    toString: () => "buildBuckGet",
    text: "$" + operands[1].text,
    formatTrace: (op) => combineStrings("$", op),
  };
}

/**
 *
 *  "$" %varName _ "=" _ expr  
 */
function buildBuckSet(operands) {
  var functionName = operands[0].text;
  var functionNode = operands[0];
  var functionArgs = [wrapUnquotedString([operands[1]]), operands[5]];
  return {
    isLiteral: false,
    opNodes: functionArgs,
    command: new FunctionCallCommand(functionName, functionNode, functionArgs),
    clone: function() {
      return buildBuckSet(cloneOperands(operands));
    },
    toString: () => "buildBuckSet",
    text: "$" + operands[1].text + " = " + operands[5].text,
    formatTrace: (o1, o2) => combineStrings("$", o1, " = ", o2),
  };
}

/** buildFunctionArguments
 *    returns an array of nodes for use
 *    in building function Command node
 *
 *    pattern: 
 *      args -> funcarg (_ "," _ funcarg):* 
 *      funcarg -> expr 
 */
function buildFunctionArguments(operands) {
  var argNodes = [operands[0]];
  for (var idx in operands[1]) 
    argNodes.push(operands[1][idx][3]);
  return argNodes;
}

function wrapNumber(operands) {
  return {
    isLiteral: true,
    opNodes: [],
    command: { 
      execute: function() { return Number(operands[0]); },
      undo: function() {},
    },
    clone: function() {
      return this;
    },
    toString: () => "wrapNumber",
    text: operands[0].text,
  }
}

/** wrapString
 *  
 *  pattern:
 *    "\"" [.]:* "\""
 */
function wrapString(operands) {
  return {
    isLiteral: true,
    opNodes: [],
    command: {
      execute: function() { 
        return operands[1].join("");
      },
      undo: function() {},
    },
    clone: function() {
      return this;
    },
    toString: () => "wrapString",
    text: '"' + operands[1].join("") + '"',
  };
}

function wrapUnquotedString(operands) {
  return {
    isLiteral: true,
    opNodes: [],
    command: {
      execute: function() { 
        return operands[0].text;
      },
      undo: function() {},
    },
    clone: function() {
      return this;
    },
    toString: () => "wrapUnquotedString",
    text: operands[0].text,
  };
}

/** wrapBool
 *    create boolean evaluation node
 *    pattern: %TRUE | %FALSE
 */
function wrapBool(operands) {
  return {
    isLiteral: true,
    opNodes: [],
    command: {
      execute: function() { return operands[0] == "true"; },
      undo: function() {},
    },
    clone: function() {
      return this;
    },
    toString: () => "wrapBool",
    text: operands[0].text,
  };
}

/** wrapNull
 *  create null eval node
 *  pattern: %NULL
 */
function wrapNull(operands) {
  return {
    isLiteral: true,
    opNodes: [],
    command: {
      execute: function() { return null; },
      undo: function() {},
    },
    clone: function() {
      return this;
    },
    toString: () => "wrapNull",
    text: "null",
  }
}

/** buildVariable
 *    create getVariable node
 *
 *    pattern:
 *      varName -> %varName
 */
function buildVariable(operands) {
  var varName = operands[0].text;
  return {
    varName: varName,
    isLiteral: false,
    opNodes: [],
    command: new GetVariableCommand(varName),
    clone: function() {
      return buildVariable(cloneOperands(operands));
    },
    toString: () => "buildVariable",
    text: operands[0].text,
  }
}

/** buildAssignment
 *    create assignment node
 *
 *    pattern:
 *      assignment -> %varName _ "=" _ math
 */
function buildAssignment(operands) {
  var lValue = operands[0].text;
  var rValue = operands[4];
  return {
    isLiteral: false,
    opNodes: [],
    command: new AssignVariableCommand(lValue, rValue),
    clone: function() {
      return buildAssignment(cloneOperands(operands));
    },
    toString: () => "buildAssignment",
    text: lValue + " = " + rValue.text,
    formatTrace: (op) => combineStrings(lValue, " = ", op),
  };
}

/** buildRangePropertyAssignment
 *    create a RangeConfig node 
 *    pattern:
 *      assignment -> expr %DOT %varName _ "=" _ expr        
 */
function buildRangePropertyAssignment(operands) {
  var receiverNode = operands[0];
  var propName = operands[2].text;
  var rValueNode = operands[6];
  return {
    isLiteral: false,
    opNodes: [],
    command: new RangeConfigCommand(receiverNode, propName, rValueNode),
    clone: function() {
      return buildRangePropertyAssignment(cloneOperands(operands));
    },
    toString: () => "buildRangePropertyAssignment",
    text: operands[0].text + "." + propName + " = " + operands[6].text,
    formatTrace: (o1, o2) => combineStrings(o1, ".", propName, " = ", o2),
  };
}

/** buildComparison
 *    create comparison (<, >, <=, >=) node
 *       
 *    pattern:
 *      comp -> bool _ comparator _ bool  
 */
function buildComparison(operands) {
  var opNode1 = operands[0];
  var opNode2 = operands[4];

  var comp = operands[2];
  var compCommand;
  if (comp == "<")
    compCommand = LessThanCommand;
  else if (comp == "<=")
    compCommand = LessEqualThanCommand;
  else if (comp == ">")
    compCommand = GreaterThanCommand;
  else if (comp == ">=")
    compCommand = GreaterEqualThanCommand;

  // wrap comp for react to avoid
  //Error: Invariant Violation: Objects are not valid as a React child (found: <). 
  // If you meant to render a collection of children, use an array instead or wrap the object 
  // using createFragment(object) from the React add-ons. 
  var wrappedComp = " " + comp + " "  

  return {
    isLiteral: opNode1.isLiteral && opNode2.isLiteral,
    opNodes: [opNode1, opNode2],
    command: new compCommand(opNode1, opNode2),
    clone: function() {
      return buildComparison(cloneOperands(operands));
    },
    toString: () => "buildComparison",
    text: opNode1.text + " " + comp + " " + opNode2.text,
    formatTrace: (o1, o2) => combineStrings(o1, wrappedComp, o2),
  }
}


/** buildCommaSepStatements
 *    return array of comma separated statement
 *    nodes
 *
 *    pattern:
 *      commaSepStatement -> statement (_ "," _ statement):*
 */
function buildCommaSepStatements(operands) {
  var statements = [operands[0]];
  for (var idx in operands[1]) 
    statements.push(operands[1][idx][3]);
  return statements; 
}

/** buildBlock
 *    return array of line opNodes
 *    pattern: 
 *      block -> "{" _ (line _):* "}" 
 */
function buildBlock(operands) {  
  var lines = [];
  for (var idx in operands[2])
    lines.push(operands[2][idx][0]);
  return lines;
}

/** buildForPars
 *    return a 2d array of statements
 *
 *    pattern:
 *    forPars -> 
 *      "(" _ (commaSepStatements _ ):? ";" _ (bool _):? ";" _ (commaSepStatements _):?  ")" 
 *      
 */
function buildForPars(operands) {
  var initStatements = operands[2] ? operands[2][0] : [];
  var condition = operands[5] ? operands[5][0] : wrapBool(["true"]); // empty condition always evaluates to true
  var incrStatements = operands[8] ? operands[8][0] : [];
  return [initStatements, condition, incrStatements];
}

/** buildForLoop
 *    create for loop node with
 *    statement subtrees or empty arrays as 'arguments'
 *    i.e. setup statements, test condition, increment statements
 *
 *    pattern:
 *      forLoop 
          -> %FOR _  forPars _ block
 */
function buildForLoop(operands) {
  var initStatements = operands[2][0];
  var condition = operands[2][1];
  var incrStatements = operands[2][2];
  var loopStatements = operands[4];

  return {
    isLiteral: false,
    opNodes: loopStatements,
    command: new ForLoopCommand(initStatements, condition, 
          incrStatements, loopStatements),
    clone: function() {
      return buildForLoop(cloneOperands(operands));
    },
    toString: () => "buildForLoop",
    text: forLoopText(initStatements, condition, incrStatements, loopStatements),
  };
}

/** buildWhileLoop
 *    create while loop node (single condition)
 *
 *    pattern:
 *      whileLoop ->
 *        %WHILE _ "(" _ bool _ ")" _ block
 */
function buildWhileLoop(operands) {
  var condition = operands[4];
  
  var loopStatements = operands[8];
  return {
    isLiteral: false,
    opNodes: loopStatements,
    command: new WhileLoopCommand(condition, loopStatements),
    clone: function() {
      return buildWhileLoop(cloneOperands(operands));
    },
    toString: () => "buildWhileLoop",
    // text: `while ( ${condition.text} ) { `
    //   + loopStatements.map(x => x.text).join(";\n") + "\n}",
    text: whileLoopText(condition, loopStatements),
  };
}

/** buildSingleAccess
 *    create 
 *  accessor -> expr "[" _ expr _ "]               
 *
 */
function buildSingleAccess(operands) {
  var receiver = operands[0];
  var keyNode = operands[3]; 
  return {
    isLiteral: false,
    opNodes: [],
    command: new GetChildCommand(receiver, keyNode),
    clone: function() {
      return buildSingleAccess(cloneOperands(operands));
    },
    toString: () => "buildSingleAccess",
    text: receiver.text + "[ " + keyNode.text + " ]",
    formatTrace: (o1, o2) => combineStrings(o1, "[", o2, "]"),
  };
}

/** buildRangeAccess
 *    create GetChildren node. When evaluated,
 *    this node returns an array of children
 *
 *    syntax: 
 *      arr[3:] - get children from index 3 to end (inclusive)
 *      arr[:3] - get children from starting index up to 2
 *      arr[3:5] - get children from index 3 to 4
 *      arr[:] - get all children
 *
 *    pattern:
 *      accessor -> %varName "[" _ (expr _):? ":" _ (expr _):? "]" 
 */
function buildRangeAccess(operands) {
  var receiver = operands[0];
  var low = operands[3] ? operands[3][0] : wrapNull();
  var high = operands[6] ? operands[6][0] : wrapNull();

  return {
    isLiteral: false,
    opNodes: [],
    command: new GetChildrenCommand(receiver, low, high),
    clone: function() {
      return buildRangeAccess(cloneOperands(operands));
    },
    toString: () => "buildRangeAccess",
    text: operands[0].text + "[ " + low.text + ":" + high.text + " ]",
    formatTrace: (o1, o2) => combineStrings(operands[0].text, "[", o1, ":", o2, "]"),
  };
}

/** buildList
 *    create op node that just returns an array. List elements
 *    get evaluated upon instantiation,
 *    so the following sequence won't change the list:
 *
 *    x = 3
 *    list = [x, 4, 5]
 *    x = 4
 *
 *    pattern:
 *      list -> "[" _ "]" 
 *      list -> "[" _ args _ "]" 
 *    
 *    buildList clones opnodes so function calls get re-evaluated
 *    when list is cloned
 */
function buildList(operands) {
  var elements = [];
  if (operands.length > 3)
    elements = operands[2];

  return {
    isLiteral: elements.every(x => x.isLiteral),
    opNodes: elements,
    command: new BuildListCommand(...elements),
    clone: function() {
      return buildList(cloneOperands(operands));
    },
    toString: () => "buildList",
    text: "[" + elements.map(x => x.text).join(", ") + "]",
    formatTrace: (...xs) => combineStrings("[", joinStrings(xs, ", "), "]"),
  };
}

/** buildListAssignment
 *    create op node that assigns
 *    a value to a list
 *
 *    pattern:
 *      assignment -> expr "[" _ expr _ "]" _ "=" _ expr      
 */
function buildListAssignment(operands) {
  var listNode = operands[0];
  var indexNode = operands[3];
  var rValueNode = operands[9];

  return {
    isLiteral: false,
    opNodes: [],
    command: new AssignListElementCommand(listNode, indexNode, rValueNode),
    clone: function() {
      return buildListAssignment(cloneOperands(operands));
    },
    toString: () => "buildListAssignment",
    text: operands[0].text + "[" + operands[3].text + "] = " + operands[9].text, 
    formatTrace: (o1, o2, o3) => combineStrings(o1, "[", o2, "] = ", o),
  };
}

/** buildPropGet
 *    create node that performs property access
 *    on result of expression
 *
 *    pattern:
 *      propGet -> expr "." %varName      
 */
function buildPropGet(operands) {
  var receiverNode = operands[0];
  var propName = operands[2].text;
  return { 
    isLiteral: false,
    opNodes: [],
    command: new GetPropertyCommand(receiverNode, propName),
    clone: function() {
      return buildPropGet(cloneOperands(operands));
    },
    toString: () => "buildPropGet",
    text: operands[0].text + "." + propName,
    formatTrace: (op) => combineStrings(op, ".", propName),
  };
}


/** buildConjunction
 *  pattern: 
 *    bool -> bool _ %AND _ disj  
 */
function buildConjunction(operands) {
  var opNode1 = operands[0];
  var opNode2 = operands[4];
  return {
    isLiteral: opNode1.isLiteral && opNode2.isLiteral,
    opNodes: [opNode1, opNode2],
    command: new ConjunctionCommand(opNode1, opNode2),
    clone: function() {
      return buildConjunction(cloneOperands(operands));
    },
    toString: () => "buildConjunction",
    text: opNode1.text + " && " + opNode2.text,
    formatTrace: (o1, o2) => combineStrings(o1, " && ", o2),
  };
}

/** buildDisjunction
 *  pattern:
 *    disj -> disj _ %OR _ not   
 */
function buildDisjunction(operands) {
  var opNode1 = operands[0];
  var opNode2 = operands[4];
  return {
    isLiteral: opNode1.isLiteral && opNode2.isLiteral,
    opNodes: [opNode1, opNode2],
    command: new DisjunctionCommand(opNode1, opNode2),
    clone: function() {
      return buildDisjunction(cloneOperands(operands));
    },
    toString: () => "buildDisjunction",
    text: opNode1.text + " || " + opNode2.text,
    formatTrace: (o1, o2) => combineStrings(o1, " || ", o2),
  };
}

/** buildLogicalNot
 *  pattern:
 *    not -> %NOT _ boolTerminal 
 */
function buildLogicalNot(operands) {
  var opNode1 = operands[2];
  return {
    isLiteral: opNode1.isLiteral,
    opNodes: [opNode1],
    command: new LogicalNotCommand(opNode1),
    clone: function() {
      return buildLogicalNot(cloneOperands(operands));
    },
    toString: () => "buildLogicalNot",
    text: "! " + opNode1.text,
    formatTrace: op => combineStrings("! ", op),
  };
}

/**
 *  pattern:
 *    eqcomp -> eqcomp _ %EQEQ _ noteqcomp 
 */
function buildEquals(operands) {
  var opNode1 = operands[0];
  var opNode2 = operands[4];
  return {
    isLiteral: opNode1.isLiteral && opNode2.isLiteral,
    opNodes: [opNode1, opNode2],
    command: new LogicalEqualsCommand(opNode1, opNode2),
    clone: function() {
      return buildEquals(cloneOperands(operands));
    },
    toString: () => "buildEquals",
    text: opNode1.text + " == " + opNode2.text,
    formatTrace: (o1, o2) => combineStrings(o1, " == ", o2),
  };
}

/** buildNotEquals
 *  pattern:
 *    noteqcomp -> noteqcomp _ %NOTEQ _ lcomp 
 */
function buildNotEquals(operands) {
  var opNode1 = operands[0];
  var opNode2 = operands[4];
  return {
    isLiteral: opNode1.isLiteral && opNode2.isLiteral,
    opNodes: [opNode1, opNode2],
    command: new LogicalNotEqualsCommand(opNode1, opNode2),
    clone: function() {
      return buildNotEquals(cloneOperands(operands));
    },
    toString: () => "buildNotEquals",
    text: opNode1.text + " != " + opNode2.text,
    formatTrace: (o1, o2) => combineStrings(o1, " != ", o2),
  };
}


/** buildDictArgs
 *    return array of [key, value] pair (arrays)
 * 
 *    dictPair -> %varName _ ":" _ expr        [d[0], d[4]]
 *  
 *    dictArgs -> dictPair (_ "," _ dictPair):* 
 * 
 *    safe to execute because keys must be
 *    number or str
 */
function buildDictArgs(operands) {
  var keys = [operands[0][0].command.execute()];
  var values = [operands[0][1]];

  for (var idx in operands[1]) {
    keys.push(operands[1][idx][3][0].command.execute());
    values.push(operands[1][idx][3][1]);
  }
  return [keys, values];
}

/** buildDict
 *    build dictionary AST node
 *    
 *    for now, dictionary keys must be literals or
 *    variables, which are evaluated once and 
 *    those literals values are used. 
 *    For instance:
 *    i = 3
 *    d = { i : "asdf" } 
 *    i = 5
 *    d[3] still == "asdf" (not  d[5])
 *
 */
function buildDict(operands) {
  var keys = [];
  var values = [];
  if (operands.length > 3) {
    keys = operands[2][0];
    values = operands[2][1];
  }
  return {
    isLiteral: values.every(x => x.isLiteral),
    opNodes: values,
    command: new BuildDictCommand(keys, ...values),
    clone: function() {
      return buildDict(cloneOperands(operands));
    },
    toString: () => "buildDict",
    text: "{ " 
      + keys.map((x, i) => stringify(x) + " : " + values[i].text).join(", ")
      + " }",
    formatTrace: (...vs) => { 
      return combineStrings("{ ", 
        ...joinStrings(keys.map((k, i) => combineStrings(...joinStrings([k, " : ", vs[i]]))), ", "),
      "}");
    },
  };
}

/** buildFunctionDefinition
 *    build AST node for function definition
 *    when executed it binds the name to 
 *    a new UserFunctionCommand object
 *    
 *    pattern:
 *      funcdef -> 
 *        %DEF " " %varName _ "(" _ funcdefargs _ ")" _ block
 *        %DEF " " %varName _ "(" ")" _ block
 */
function buildFunctionDefinition(operands) {
  var funcName = operands[2].text;
  var argNames = [];
  if (operands.length > 8) 
    argNames = operands[6].map(x => x.text);

  var funcStatements = operands[operands.length - 1];
  return {
    isFunctionDef: true,
    isLiteral: false,
    opNodes: funcStatements,
    command: { 
      execute: function() {
        createFunctionDefinition(funcName, argNames, funcStatements);
        this.defined = true;
      },
      undo: function() {
        if (this.defined) // don't undo unless it was successfully defined
          undoFunctionDefinition(funcName);
      }
    },
    clone: function() {
      return buildFunctionDefinition(cloneOperands(operands));
    },
    toString: () => "buildFunctionDefinition",
    text: `define ${funcName}(${argNames.join(", ")}) {\n ${funcStatements.map(x => x.text).join(";\n")} \n}`,
  };
}

/** buildReturn
 *    build AST node for return statement
 *    pattern:
 *      return -> %RET " " expr
 */
function buildReturn(operands) {
  var exprNode = operands[2];
  return {
    isLiteral: false,
    opNodes: [exprNode],
    command: new ReturnCommand(exprNode),
    clone: function() {
      return buildReturn(cloneOperands(operands));
    },
    toString: () => "buildReturn",
    text: "return " + exprNode.text,
    formatTrace: op => combineStrings("return ", op),
  };
}

/** buildIf
 *    build AST node (opNode) for if-else if-else block.
 *    note elseIf and else return arrays of pairs (2 element arrays)
 *    [bool expr, [lines]]
 *    If block command object is parameterized with complete 
 *    array of [bool expr, [lines]], so if, else if, and else 
 *    arrays must be combined
 *
 *    pattern:
 *      %IF _ "(" _ bool _ ")" _ block (_ elseIf):* (_ else):? 
 */
function buildIf(operands) {
  var condBlockPairs = [];
  condBlockPairs.push([operands[4], operands[8]]);

  var elseIfIdx = 9;
  for (var idx in operands[elseIfIdx])
    condBlockPairs.push(operands[elseIfIdx][idx][1]);
  
  // if final else block
  var finalElse = false; 
  if (operands[operands.length - 1]) {
    condBlockPairs.push(operands[operands.length - 1][1]);
    finalElse = true;
  }

  return {
    isLiteral: false,
    opNodes: condBlockPairs,
    command: new IfBlockCommand(condBlockPairs, finalElse),
    clone: function() {
      return buildIf(cloneOperands(operands));
    },
    toString: () => "buildIf",
    text: breakLines(...ifBlockText(condBlockPairs, finalElse)),
  };
}

/** buildElseIf
 *    return arrays of pairs (2 element arrays)
 *    [bool expr, [lines]]
 *
 *    pattern:
 *      elseIf -> %ELIF _ "(" _ bool _ ")" _ block 
 */
function buildElseIf(operands) {
  return [operands[4], operands[8]];
}

/** buildElse
 *    return arrays of pairs (2 element arrays)
 *    [bool expr, [lines]]
 *
 *    pattern:
 *      else -> %ELSE _ block 
 */
function buildElse(operands) {
  return [wrapBool(["true"]), operands[2]];
}

/** buildCodeBlock
 *    return array of line opNodes
 *    pattern: 
 *      block -> (line _):* 
 */
function buildCodeBlock(operands) {  
  var lines = [];
  for (var idx in operands[0])
    lines.push(operands[0][idx][0]);

  return { 
    isLiteral: false,
    opNodes: lines,
    command: new CodeBlockCommand(lines),
    clone: function() {
      return buildCodeBlock(cloneOperands(operands));
    },
    toString: () => "buildCodeBlock",
    text: lines.map(x => x.text).join(";\n"),
  }
}

var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "unsigned_int$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "unsigned_int$ebnf$1", "symbols": ["unsigned_int$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "unsigned_int", "symbols": ["unsigned_int$ebnf$1"], "postprocess": 
        function(d) {
            return parseInt(d[0].join(""));
        }
        },
    {"name": "int$ebnf$1$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "int$ebnf$1$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "int$ebnf$1", "symbols": ["int$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "int$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "int$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "int$ebnf$2", "symbols": ["int$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "int", "symbols": ["int$ebnf$1", "int$ebnf$2"], "postprocess": 
        function(d) {
            if (d[0]) {
                return parseInt(d[0][0]+d[1].join(""));
            } else {
                return parseInt(d[1].join(""));
            }
        }
        },
    {"name": "unsigned_decimal$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "unsigned_decimal$ebnf$1", "symbols": ["unsigned_decimal$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "unsigned_decimal$ebnf$2$subexpression$1$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "unsigned_decimal$ebnf$2$subexpression$1$ebnf$1", "symbols": ["unsigned_decimal$ebnf$2$subexpression$1$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "unsigned_decimal$ebnf$2$subexpression$1", "symbols": [{"literal":"."}, "unsigned_decimal$ebnf$2$subexpression$1$ebnf$1"]},
    {"name": "unsigned_decimal$ebnf$2", "symbols": ["unsigned_decimal$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "unsigned_decimal$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "unsigned_decimal", "symbols": ["unsigned_decimal$ebnf$1", "unsigned_decimal$ebnf$2"], "postprocess": 
        function(d) {
            return parseFloat(
                d[0].join("") +
                (d[1] ? "."+d[1][1].join("") : "")
            );
        }
        },
    {"name": "decimal$ebnf$1", "symbols": [{"literal":"-"}], "postprocess": id},
    {"name": "decimal$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "decimal$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "decimal$ebnf$2", "symbols": ["decimal$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "decimal$ebnf$3$subexpression$1$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "decimal$ebnf$3$subexpression$1$ebnf$1", "symbols": ["decimal$ebnf$3$subexpression$1$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "decimal$ebnf$3$subexpression$1", "symbols": [{"literal":"."}, "decimal$ebnf$3$subexpression$1$ebnf$1"]},
    {"name": "decimal$ebnf$3", "symbols": ["decimal$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "decimal$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "decimal", "symbols": ["decimal$ebnf$1", "decimal$ebnf$2", "decimal$ebnf$3"], "postprocess": 
        function(d) {
            return parseFloat(
                (d[0] || "") +
                d[1].join("") +
                (d[2] ? "."+d[2][1].join("") : "")
            );
        }
        },
    {"name": "percentage", "symbols": ["decimal", {"literal":"%"}], "postprocess": 
        function(d) {
            return d[0]/100;
        }
        },
    {"name": "jsonfloat$ebnf$1", "symbols": [{"literal":"-"}], "postprocess": id},
    {"name": "jsonfloat$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "jsonfloat$ebnf$2", "symbols": ["jsonfloat$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "jsonfloat$ebnf$3$subexpression$1$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "jsonfloat$ebnf$3$subexpression$1$ebnf$1", "symbols": ["jsonfloat$ebnf$3$subexpression$1$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "jsonfloat$ebnf$3$subexpression$1", "symbols": [{"literal":"."}, "jsonfloat$ebnf$3$subexpression$1$ebnf$1"]},
    {"name": "jsonfloat$ebnf$3", "symbols": ["jsonfloat$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "jsonfloat$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$1", "symbols": [/[+-]/], "postprocess": id},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$2", "symbols": ["jsonfloat$ebnf$4$subexpression$1$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "jsonfloat$ebnf$4$subexpression$1", "symbols": [/[eE]/, "jsonfloat$ebnf$4$subexpression$1$ebnf$1", "jsonfloat$ebnf$4$subexpression$1$ebnf$2"]},
    {"name": "jsonfloat$ebnf$4", "symbols": ["jsonfloat$ebnf$4$subexpression$1"], "postprocess": id},
    {"name": "jsonfloat$ebnf$4", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat", "symbols": ["jsonfloat$ebnf$1", "jsonfloat$ebnf$2", "jsonfloat$ebnf$3", "jsonfloat$ebnf$4"], "postprocess": 
        function(d) {
            return parseFloat(
                (d[0] || "") +
                d[1].join("") +
                (d[2] ? "."+d[2][1].join("") : "") +
                (d[3] ? "e" + (d[3][1] || "+") + d[3][2].join("") : "")
            );
        }
        },
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "__$ebnf$1", "symbols": ["wschar"]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "wschar", "symbols": [/[ \t\n\v\f]/], "postprocess": id},
    {"name": "codeblock", "symbols": ["statement"], "postprocess": d => buildCodeBlock([d.map(x => [x, null])])},
    {"name": "codeblock$ebnf$1$subexpression$1", "symbols": ["code", "_"]},
    {"name": "codeblock$ebnf$1", "symbols": ["codeblock$ebnf$1$subexpression$1"]},
    {"name": "codeblock$ebnf$1$subexpression$2", "symbols": ["code", "_"]},
    {"name": "codeblock$ebnf$1", "symbols": ["codeblock$ebnf$1", "codeblock$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "codeblock", "symbols": ["codeblock$ebnf$1"], "postprocess": buildCodeBlock},
    {"name": "code", "symbols": ["line"], "postprocess": id},
    {"name": "code", "symbols": ["funcdef"], "postprocess": id},
    {"name": "line", "symbols": ["statement", "_", {"literal":";"}], "postprocess": id},
    {"name": "line", "symbols": ["controlBlock"], "postprocess": id},
    {"name": "controlBlock", "symbols": ["forLoop"], "postprocess": id},
    {"name": "controlBlock", "symbols": ["whileLoop"], "postprocess": id},
    {"name": "controlBlock", "symbols": ["if"], "postprocess": id},
    {"name": "statement", "symbols": ["assignment"], "postprocess": id},
    {"name": "statement", "symbols": ["expr"], "postprocess": id},
    {"name": "statement", "symbols": ["return"], "postprocess": id},
    {"name": "assignment", "symbols": [(lexer.has("varName") ? {type: "varName"} : varName), "_", {"literal":"="}, "_", "expr"], "postprocess": buildAssignment},
    {"name": "assignment", "symbols": ["expr", (lexer.has("DOT") ? {type: "DOT"} : DOT), (lexer.has("varName") ? {type: "varName"} : varName), "_", {"literal":"="}, "_", "expr"], "postprocess": buildRangePropertyAssignment},
    {"name": "assignment", "symbols": ["expr", {"literal":"["}, "_", "expr", "_", {"literal":"]"}, "_", {"literal":"="}, "_", "expr"], "postprocess": buildListAssignment},
    {"name": "assignment", "symbols": [{"literal":"$"}, (lexer.has("varName") ? {type: "varName"} : varName), "_", {"literal":"="}, "_", "expr"], "postprocess": buildBuckSet},
    {"name": "expr", "symbols": ["bool"], "postprocess": id},
    {"name": "bool", "symbols": ["bool", "_", (lexer.has("AND") ? {type: "AND"} : AND), "_", "disj"], "postprocess": buildConjunction},
    {"name": "bool", "symbols": ["disj"], "postprocess": id},
    {"name": "disj", "symbols": ["disj", "_", (lexer.has("OR") ? {type: "OR"} : OR), "_", "not"], "postprocess": buildDisjunction},
    {"name": "disj", "symbols": ["eqcomp"], "postprocess": id},
    {"name": "eqcomp", "symbols": ["eqcomp", "_", (lexer.has("EQEQ") ? {type: "EQEQ"} : EQEQ), "_", "noteqcomp"], "postprocess": buildEquals},
    {"name": "eqcomp", "symbols": ["noteqcomp"], "postprocess": id},
    {"name": "noteqcomp", "symbols": ["noteqcomp", "_", (lexer.has("NOTEQ") ? {type: "NOTEQ"} : NOTEQ), "_", "lcomp"], "postprocess": buildNotEquals},
    {"name": "noteqcomp", "symbols": ["lcomp"], "postprocess": id},
    {"name": "lcomp", "symbols": ["lcomp", "_", {"literal":"<"}, "_", "gcomp"], "postprocess": buildComparison},
    {"name": "lcomp", "symbols": ["gcomp"], "postprocess": id},
    {"name": "gcomp", "symbols": ["gcomp", "_", {"literal":">"}, "_", "lecomp"], "postprocess": buildComparison},
    {"name": "gcomp", "symbols": ["lecomp"], "postprocess": id},
    {"name": "lecomp", "symbols": ["lecomp", "_", (lexer.has("LESSEQ") ? {type: "LESSEQ"} : LESSEQ), "_", "gecomp"], "postprocess": buildComparison},
    {"name": "lecomp", "symbols": ["gecomp"], "postprocess": id},
    {"name": "gecomp", "symbols": ["gecomp", "_", (lexer.has("GREATEQ") ? {type: "GREATEQ"} : GREATEQ), "_", "not"], "postprocess": buildComparison},
    {"name": "gecomp", "symbols": ["not"], "postprocess": id},
    {"name": "not", "symbols": [(lexer.has("NOT") ? {type: "NOT"} : NOT), "_", "boolTerminal"], "postprocess": buildLogicalNot},
    {"name": "not", "symbols": ["boolTerminal"], "postprocess": id},
    {"name": "boolTerminal", "symbols": ["math"], "postprocess": id},
    {"name": "boolTerminal", "symbols": [(lexer.has("TRUE") ? {type: "TRUE"} : TRUE)], "postprocess": wrapBool},
    {"name": "boolTerminal", "symbols": [(lexer.has("FALSE") ? {type: "FALSE"} : FALSE)], "postprocess": wrapBool},
    {"name": "comparator$subexpression$1", "symbols": [{"literal":"<"}]},
    {"name": "comparator$subexpression$1", "symbols": [{"literal":">"}]},
    {"name": "comparator$subexpression$1", "symbols": [(lexer.has("LESSEQ") ? {type: "LESSEQ"} : LESSEQ)]},
    {"name": "comparator$subexpression$1", "symbols": [(lexer.has("GREATEQ") ? {type: "GREATEQ"} : GREATEQ)]},
    {"name": "comparator$subexpression$1", "symbols": [(lexer.has("EQEQ") ? {type: "EQEQ"} : EQEQ)]},
    {"name": "comparator$subexpression$1", "symbols": [(lexer.has("NOTEQ") ? {type: "NOTEQ"} : NOTEQ)]},
    {"name": "comparator", "symbols": ["comparator$subexpression$1"], "postprocess": id},
    {"name": "comp", "symbols": ["bool", "_", "comparator", "_", "bool"], "postprocess": buildComparison},
    {"name": "math$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "math$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "math", "symbols": ["math", "_", "math$subexpression$1", "_", "product"], "postprocess": buildAddSub},
    {"name": "math", "symbols": ["product"], "postprocess": id},
    {"name": "product$subexpression$1", "symbols": [{"literal":"*"}]},
    {"name": "product$subexpression$1", "symbols": [{"literal":"/"}]},
    {"name": "product$subexpression$1", "symbols": [{"literal":"//"}]},
    {"name": "product$subexpression$1", "symbols": [(lexer.has("MOD") ? {type: "MOD"} : MOD)]},
    {"name": "product", "symbols": ["product", "_", "product$subexpression$1", "_", "exp"], "postprocess": buildMultDiv},
    {"name": "product", "symbols": ["exp"], "postprocess": id},
    {"name": "exp", "symbols": ["unaryNeg", "_", {"literal":"^"}, "_", "exp"], "postprocess": buildExp},
    {"name": "exp", "symbols": ["unaryNeg"], "postprocess": id},
    {"name": "unaryNeg", "symbols": [{"literal":"-"}, "mathTerminal"], "postprocess": buildNegate},
    {"name": "unaryNeg", "symbols": ["mathTerminal"], "postprocess": id},
    {"name": "nonQuote", "symbols": [{"literal":" "}]},
    {"name": "nonQuote", "symbols": [{"literal":"\t"}]},
    {"name": "nonQuote", "symbols": [{"literal":"\n"}]},
    {"name": "nonQuote", "symbols": [{"literal":"-"}]},
    {"name": "nonQuote", "symbols": [{"literal":"+"}]},
    {"name": "nonQuote", "symbols": [{"literal":"*"}]},
    {"name": "nonQuote", "symbols": [{"literal":"/"}]},
    {"name": "nonQuote", "symbols": [{"literal":"//"}]},
    {"name": "nonQuote", "symbols": [{"literal":"^"}]},
    {"name": "nonQuote", "symbols": [(lexer.has("MOD") ? {type: "MOD"} : MOD)]},
    {"name": "nonQuote", "symbols": [(lexer.has("LESSEQ") ? {type: "LESSEQ"} : LESSEQ)]},
    {"name": "nonQuote", "symbols": [(lexer.has("GREATEQ") ? {type: "GREATEQ"} : GREATEQ)]},
    {"name": "nonQuote", "symbols": [(lexer.has("EQEQ") ? {type: "EQEQ"} : EQEQ)]},
    {"name": "nonQuote", "symbols": [(lexer.has("DOT") ? {type: "DOT"} : DOT)]},
    {"name": "nonQuote", "symbols": [(lexer.has("NOTEQ") ? {type: "NOTEQ"} : NOTEQ)]},
    {"name": "nonQuote", "symbols": [(lexer.has("TRUE") ? {type: "TRUE"} : TRUE)]},
    {"name": "nonQuote", "symbols": [(lexer.has("FALSE") ? {type: "FALSE"} : FALSE)]},
    {"name": "nonQuote", "symbols": [{"literal":">"}]},
    {"name": "nonQuote", "symbols": [{"literal":"<"}]},
    {"name": "nonQuote", "symbols": [{"literal":","}]},
    {"name": "nonQuote", "symbols": [{"literal":"("}]},
    {"name": "nonQuote", "symbols": [{"literal":")"}]},
    {"name": "nonQuote", "symbols": [{"literal":"="}]},
    {"name": "nonQuote", "symbols": [{"literal":"{"}]},
    {"name": "nonQuote", "symbols": [(lexer.has("OR") ? {type: "OR"} : OR)]},
    {"name": "nonQuote", "symbols": [(lexer.has("AND") ? {type: "AND"} : AND)]},
    {"name": "nonQuote", "symbols": [(lexer.has("NOT") ? {type: "NOT"} : NOT)]},
    {"name": "nonQuote", "symbols": [{"literal":"}"}]},
    {"name": "nonQuote", "symbols": [{"literal":"["}]},
    {"name": "nonQuote", "symbols": [{"literal":"]"}]},
    {"name": "nonQuote", "symbols": [{"literal":";"}]},
    {"name": "nonQuote", "symbols": [{"literal":":"}]},
    {"name": "nonQuote", "symbols": [{"literal":"$"}]},
    {"name": "nonQuote", "symbols": [(lexer.has("FOR") ? {type: "FOR"} : FOR)]},
    {"name": "nonQuote", "symbols": [(lexer.has("WHILE") ? {type: "WHILE"} : WHILE)]},
    {"name": "nonQuote", "symbols": [(lexer.has("IF") ? {type: "IF"} : IF)]},
    {"name": "nonQuote", "symbols": [(lexer.has("ELSE") ? {type: "ELSE"} : ELSE)]},
    {"name": "nonQuote", "symbols": [(lexer.has("ELIF") ? {type: "ELIF"} : ELIF)]},
    {"name": "nonQuote", "symbols": [(lexer.has("DEF") ? {type: "DEF"} : DEF)]},
    {"name": "nonQuote", "symbols": [(lexer.has("RET") ? {type: "RET"} : RET)]},
    {"name": "nonQuote", "symbols": [(lexer.has("NULL") ? {type: "NULL"} : NULL)]},
    {"name": "nonQuote", "symbols": [(lexer.has("number") ? {type: "number"} : number)]},
    {"name": "nonQuote", "symbols": [(lexer.has("varName") ? {type: "varName"} : varName)]},
    {"name": "nonQuote", "symbols": [(lexer.has("character") ? {type: "character"} : character)]},
    {"name": "string$ebnf$1", "symbols": []},
    {"name": "string$ebnf$1", "symbols": ["string$ebnf$1", "nonQuote"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "string", "symbols": [(lexer.has("QUOTE") ? {type: "QUOTE"} : QUOTE), "string$ebnf$1", (lexer.has("QUOTE") ? {type: "QUOTE"} : QUOTE)], "postprocess": wrapString},
    {"name": "mathTerminal", "symbols": ["number"], "postprocess": id},
    {"name": "mathTerminal", "symbols": ["callable"], "postprocess": id},
    {"name": "mathTerminal", "symbols": ["accessor"], "postprocess": id},
    {"name": "mathTerminal", "symbols": ["list"], "postprocess": id},
    {"name": "mathTerminal", "symbols": ["dict"], "postprocess": id},
    {"name": "mathTerminal", "symbols": ["string"], "postprocess": id},
    {"name": "mathTerminal", "symbols": [(lexer.has("NULL") ? {type: "NULL"} : NULL)], "postprocess": wrapNull},
    {"name": "mathTerminal", "symbols": [(lexer.has("varName") ? {type: "varName"} : varName)], "postprocess": buildVariable},
    {"name": "mathTerminal", "symbols": [{"literal":"$"}, (lexer.has("varName") ? {type: "varName"} : varName)], "postprocess": buildBuckGet},
    {"name": "mathTerminal", "symbols": [{"literal":"("}, "_", "bool", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "mathTerminal", "symbols": ["propGet"], "postprocess": id},
    {"name": "number", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": wrapNumber},
    {"name": "list", "symbols": [{"literal":"["}, "_", {"literal":"]"}], "postprocess": buildList},
    {"name": "list", "symbols": [{"literal":"["}, "_", "args", "_", {"literal":"]"}], "postprocess": buildList},
    {"name": "accessor", "symbols": ["objExpr", {"literal":"["}, "_", "expr", "_", {"literal":"]"}], "postprocess": buildSingleAccess},
    {"name": "accessor$ebnf$1$subexpression$1", "symbols": ["expr", "_"]},
    {"name": "accessor$ebnf$1", "symbols": ["accessor$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "accessor$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "accessor$ebnf$2$subexpression$1", "symbols": ["expr", "_"]},
    {"name": "accessor$ebnf$2", "symbols": ["accessor$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "accessor$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "accessor", "symbols": ["objExpr", {"literal":"["}, "_", "accessor$ebnf$1", {"literal":":"}, "_", "accessor$ebnf$2", {"literal":"]"}], "postprocess": buildRangeAccess},
    {"name": "objExpr", "symbols": ["callable"], "postprocess": id},
    {"name": "objExpr", "symbols": ["dict"], "postprocess": id},
    {"name": "objExpr", "symbols": ["accessor"], "postprocess": id},
    {"name": "objExpr", "symbols": ["list"], "postprocess": id},
    {"name": "objExpr", "symbols": ["propGet"], "postprocess": id},
    {"name": "objExpr", "symbols": [(lexer.has("varName") ? {type: "varName"} : varName)], "postprocess": buildVariable},
    {"name": "objExpr", "symbols": [{"literal":"$"}, (lexer.has("varName") ? {type: "varName"} : varName)], "postprocess": buildBuckGet},
    {"name": "propGet", "symbols": ["objExpr", (lexer.has("DOT") ? {type: "DOT"} : DOT), (lexer.has("varName") ? {type: "varName"} : varName)], "postprocess": buildPropGet},
    {"name": "callable", "symbols": ["function"], "postprocess": id},
    {"name": "buck", "symbols": [{"literal":"$"}, {"literal":"("}, "_", "args", "_", {"literal":")"}], "postprocess": buildFunctionCall},
    {"name": "function", "symbols": ["objExpr", {"literal":"("}, "_", "args", "_", {"literal":")"}], "postprocess": buildFunctionCall},
    {"name": "function", "symbols": ["objExpr", {"literal":"("}, {"literal":")"}], "postprocess": buildFunctionCall},
    {"name": "function", "symbols": ["buck"], "postprocess": id},
    {"name": "args$ebnf$1", "symbols": []},
    {"name": "args$ebnf$1$subexpression$1", "symbols": ["_", {"literal":","}, "_", "funcarg"]},
    {"name": "args$ebnf$1", "symbols": ["args$ebnf$1", "args$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "args", "symbols": ["funcarg", "args$ebnf$1"], "postprocess": buildFunctionArguments},
    {"name": "funcarg", "symbols": ["expr"], "postprocess": id},
    {"name": "unquotedString", "symbols": [(lexer.has("varName") ? {type: "varName"} : varName)], "postprocess": wrapUnquotedString},
    {"name": "strOrNum", "symbols": ["unquotedString"], "postprocess": id},
    {"name": "strOrNum", "symbols": ["number"], "postprocess": id},
    {"name": "strOrNum", "symbols": ["string"], "postprocess": id},
    {"name": "dictArgs$ebnf$1", "symbols": []},
    {"name": "dictArgs$ebnf$1$subexpression$1", "symbols": ["_", {"literal":","}, "_", "dictPair"]},
    {"name": "dictArgs$ebnf$1", "symbols": ["dictArgs$ebnf$1", "dictArgs$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "dictArgs", "symbols": ["dictPair", "dictArgs$ebnf$1"], "postprocess": buildDictArgs},
    {"name": "dictPair", "symbols": ["strOrNum", "_", {"literal":":"}, "_", "expr"], "postprocess": d => [d[0], d[4]]},
    {"name": "dict", "symbols": [{"literal":"{"}, {"literal":"}"}], "postprocess": buildDict},
    {"name": "dict", "symbols": [{"literal":"{"}, "_", "dictArgs", "_", {"literal":"}"}], "postprocess": buildDict},
    {"name": "commaSepStatements$ebnf$1", "symbols": []},
    {"name": "commaSepStatements$ebnf$1$subexpression$1", "symbols": ["_", {"literal":","}, "_", "statement"]},
    {"name": "commaSepStatements$ebnf$1", "symbols": ["commaSepStatements$ebnf$1", "commaSepStatements$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "commaSepStatements", "symbols": ["statement", "commaSepStatements$ebnf$1"], "postprocess": buildCommaSepStatements},
    {"name": "forPars$ebnf$1$subexpression$1", "symbols": ["commaSepStatements", "_"]},
    {"name": "forPars$ebnf$1", "symbols": ["forPars$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "forPars$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "forPars$ebnf$2$subexpression$1", "symbols": ["bool", "_"]},
    {"name": "forPars$ebnf$2", "symbols": ["forPars$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "forPars$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "forPars$ebnf$3$subexpression$1", "symbols": ["commaSepStatements", "_"]},
    {"name": "forPars$ebnf$3", "symbols": ["forPars$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "forPars$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "forPars", "symbols": [{"literal":"("}, "_", "forPars$ebnf$1", {"literal":";"}, "_", "forPars$ebnf$2", {"literal":";"}, "_", "forPars$ebnf$3", {"literal":")"}], "postprocess": buildForPars},
    {"name": "forLoop", "symbols": [(lexer.has("FOR") ? {type: "FOR"} : FOR), "_", "forPars", "_", "block"], "postprocess": buildForLoop},
    {"name": "whileLoop", "symbols": [(lexer.has("WHILE") ? {type: "WHILE"} : WHILE), "_", {"literal":"("}, "_", "bool", "_", {"literal":")"}, "_", "block"], "postprocess": buildWhileLoop},
    {"name": "block$ebnf$1", "symbols": []},
    {"name": "block$ebnf$1$subexpression$1", "symbols": ["line", "_"]},
    {"name": "block$ebnf$1", "symbols": ["block$ebnf$1", "block$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "block", "symbols": [{"literal":"{"}, "_", "block$ebnf$1", {"literal":"}"}], "postprocess": buildBlock},
    {"name": "if$ebnf$1", "symbols": []},
    {"name": "if$ebnf$1$subexpression$1", "symbols": ["_", "elseIf"]},
    {"name": "if$ebnf$1", "symbols": ["if$ebnf$1", "if$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "if$ebnf$2$subexpression$1", "symbols": ["_", "else"]},
    {"name": "if$ebnf$2", "symbols": ["if$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "if$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "if", "symbols": [(lexer.has("IF") ? {type: "IF"} : IF), "_", {"literal":"("}, "_", "bool", "_", {"literal":")"}, "_", "block", "if$ebnf$1", "if$ebnf$2"], "postprocess": buildIf},
    {"name": "elseIf", "symbols": [(lexer.has("ELIF") ? {type: "ELIF"} : ELIF), "_", {"literal":"("}, "_", "bool", "_", {"literal":")"}, "_", "block"], "postprocess": buildElseIf},
    {"name": "else", "symbols": [(lexer.has("ELSE") ? {type: "ELSE"} : ELSE), "_", "block"], "postprocess": buildElse},
    {"name": "funcdefargs$ebnf$1", "symbols": []},
    {"name": "funcdefargs$ebnf$1$subexpression$1", "symbols": ["_", {"literal":","}, "_", (lexer.has("varName") ? {type: "varName"} : varName)]},
    {"name": "funcdefargs$ebnf$1", "symbols": ["funcdefargs$ebnf$1", "funcdefargs$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "funcdefargs", "symbols": [(lexer.has("varName") ? {type: "varName"} : varName), "funcdefargs$ebnf$1"], "postprocess": buildCommaSepStatements},
    {"name": "funcdef", "symbols": [(lexer.has("DEF") ? {type: "DEF"} : DEF), {"literal":" "}, (lexer.has("varName") ? {type: "varName"} : varName), "_", {"literal":"("}, "_", "funcdefargs", "_", {"literal":")"}, "_", "block"], "postprocess": buildFunctionDefinition},
    {"name": "funcdef", "symbols": [(lexer.has("DEF") ? {type: "DEF"} : DEF), {"literal":" "}, (lexer.has("varName") ? {type: "varName"} : varName), "_", {"literal":"("}, {"literal":")"}, "_", "block"], "postprocess": buildFunctionDefinition},
    {"name": "return", "symbols": [(lexer.has("RET") ? {type: "RET"} : RET), {"literal":" "}, "expr"], "postprocess": buildReturn}
]
  , ParserStart: "codeblock"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
