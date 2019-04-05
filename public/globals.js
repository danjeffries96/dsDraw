const expressionChars = /^[a-zA-Z0-9\s\(\)\=\*\+\-\/\^,\."]+$/;
const variablePattern = /^[a-z]\w*$/;
const numberPattern = /^\d+(|\.\d+)$/;
const assignmentPattern = /^[a-zA-Z]\w*\s*\=\s*/;
const methodPattern = /^[\w\[\],]+\.[a-zA-Z]+\(/;
const functionPattern = /^[a-zA-Z]+\(/;
const stringLiteralPattern = /^"[a-zA-Z0-9]+"$/;
const mathCharsPattern = /^[0-9\.\(\)\*\/\-\+\^\s]+$/;

Object.defineProperty(Array.prototype, "peek", {
  value: function() {
    return this.length ? this[this.length - 1] : null;
  },
  enumerable: false,
});

// array max
Object.defineProperty(Array.prototype, "max", {
  value: function() {
    if (this.length == 0) return null;
    if (! this.every(x => typeof x == "number")) 
      throw "Array.prototype.max only defined for numeric arrays";
    return this.reduce((acc, cur) => Math.max(acc, cur));
  },
  enumerable: false,
});

// object equivalence
Object.defineProperty(Object.prototype, "equiv", {
  value: 
    function(other) {
      var thisProps = Object.getOwnPropertyNames(this);
      var otherProps = Object.getOwnPropertyNames(other);

      if (thisProps.length != otherProps.length) return false;

      for (let prop in this) {
        thisType = typeof this[prop];
        otherType = typeof other[prop];

        if (thisType !== otherType) return false;

        if (thisType == "object") {
          // recursive case for objects
          if (! this[prop].equiv(other[prop])) return false;
        }
        else if (this[prop] !== other[prop])
          return false;
      }
      return true;
    },
  enumerable: false,
});


// wrapper for generic a, b (not necc object)
function equivalent(a, b) {
  if (typeof a != typeof b) return false;
  if (typeof a == "object") return a.equiv(b);
  return a === b;
}

Object.defineProperty(Map.prototype, "hasEquiv", {
  value: function(key) {
    return Array.from(this.keys()).some(k => equivalent(k, key));
  },
  enumerable: false,
});

Object.defineProperty(Map.prototype, "hasValue", {
  value: function(obj) {
    return Array.from(this.values()).includes(obj);
  },
  enumerable: false,
});

Object.defineProperty(Map.prototype, "getEquiv", {
  value: function(key) {
    for ([k, v] of this.entries())
      if (equivalent(k, key)) return v;
  },
  enumerable: false,
});

Object.defineProperty(Map.prototype, "deleteEquiv", {
  value: function(key) {
    this.forEach((v, k) => {
      if (equivalent(k, key)) this.delete(k);
    });
  },
  enumerable: false,
});

/** randomArray
 *    return array of random ints (0-max) with
 *    given length (distinct values)
 */
function randomArray(length, max) {
  var arr = [];
  if (max == undefined) max = 100;
  var x;
  while (arr.length < length) {
    x = Math.random() * max | 0;
    if (! arr.includes(x)) arr.push(x);
  }
  return arr;
}

// extend JSON.stringify slightly for better array/dict representation
function stringify(object) {
  if (object == null) return "null";
  if (typeof object == "function") return "function";
  if (typeof object == "string" 
      || typeof object == "number" || typeof object == "boolean") return String(object);
  if (object.command) return "method";
  if (object instanceof CanvasChildObject
    || object instanceof CanvasObject)
    return String(object);
  if (object instanceof Array) // 'list' object
    return "[" + object.map(stringify) + "]";
  if (object instanceof Dictionary)
    return `{${Object.entries(object).map(([k, v]) => k + ": "  + v).join(", ")}}`;
  if (object.funcName) return "function " + object.funcName;
  if (object.methodClass) return "method";
  // console.log("Unknown string representation for:", object);
}

// allow dict objects to be printed as such
Object.prototype.toString = function() { return stringify(this); }

const SHIFT = 16;
const CTRL = 17;
const ALT = 18;
const ENTER = 13;
const ESC = 27;
const UP = 38;
const DOWN = 40;

// global hotkey state 
const hotkeys = {
  [CTRL]: false,
  [SHIFT]: false,
  [ALT]: false,
};

window.onkeydown = (event) => {
  if (event.keyCode in hotkeys)
    hotkeys[event.keyCode] = true;
};
window.onkeyup = (event) => {
  if (event.keyCode in hotkeys)
    hotkeys[event.keyCode] = false;
};

const C = 67;
const L = 76;
const Y = 89;
const Z = 90;

const PLAYBTN = "url(../images/play.png)";
const PAUSEBTN = "url(../images/pause.png)";
      
const DEFAULT_THUMBNAIL = "images/default_thumb.png";
      
// text height for flowchart text
const TEXT_HEIGHT = 14;
