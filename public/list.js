/** LinkedList
 *    CanvasObject class for linked lists. Lists
 *    may be linear or have branches. 
 *
 *    Nodes can be
 *    positioned individually by dragging or 
 *    snapped into a linear or circular shape,
 *    provided they fit the linear/circular constraints.
 *    
 *    Nodes are CanvasChildObjects, so their labels are
 *    not drawn. Instead they are assigned indices incrementally.
 *    
 */
class LinkedList extends LinearCanvasObject {
  constructor(canvasState, x1, y1, x2, y2) {
    super(canvasState, x1, y1, x2, y2);
    LinkedList.defaultLength = 4;

    // ids used purely for unique mapping
    this.ids = new Map();
    
    // list actually tracks linked list state
    // so nodes get added/removed
    this.list = new Map();
    this.arrows = new Map();

    this.nodeStyle = "circle";

    this.head = this.addNode(null, 0);
  }

  toString() {
    return `LinkedList(${this.list.size})`;
  }

  /** LinkedList.nodes
   *    getter method for super class methods
   */
  get nodes() {
    return Array.from(this.list.values());
  }

  config() {
    var parentConfig = super.config();
    return {
      ...parentConfig,
      nodeStyle: this.nodeStyle,
    };
  }

  propNames() {
    return {
      ...super.propNames(),
      "display": "nodeStyle",
      "ds": "nodeStyle",
    };
  }

  methodNames() {
    return {
      "insert": LinkedListInsertCommand,
      "link": LinkedListLinkCommand,
      "cut": LinkedListCutCommand,
      "remove": LinkedListRemoveCommand,
    };
  }

  clone() {
    var copy = super.clone();

    // copy config of each node
    // for (var idx in this.list) {
    this.list.forEach((node, idx) => {
      copy.list.set(idx, new ListNode(this.cState, copy, 
        node.value, node.index, node.x, node.y));
      copy.ids.set(idx, copy.list.get(idx));
      Object.assign(copy.list.get(idx), node.config()); 
    });

    console.log(`${copy._label}: `, Array.from((copy.ids).keys()), `${this._label}: `, Array.from((this.ids).keys()));

    this.arrows.forEach((arr, index) => {
      var i1 = index[0];
      var i2 = index[1];

      var from = this.ids.get(i1);
      var to = this.ids.get(i2);

      // var cparrow = new ChildArrow(this.cState, copy, 
      //   from.x, from.y, to.x, to.y);
      var cparrow = arr.clone();
      cparrow.parentObject = copy; 
      cparrow.x1 = from.x;
      cparrow.y1 = from.y;
      cparrow.x2 = to.x;
      cparrow.y2 = to.y;

      cparrow.cp1.x = arr.cp1.x;
      cparrow.cp1.y = arr.cp1.y;
      cparrow.cp2.x = arr.cp2.x;
      cparrow.cp2.y = arr.cp2.y;

      copy.arrows.set(index, cparrow);
    });

    // copy head of list
    copy.head = copy.list.get(this.head.index);

    this._cloneRef = copy; return copy;
  }

  /** LinkedList.getChildren
   */
  getChildren(low, high) {
    if (low == null) 
      return this.nodes;

    var children = [];
    this.list.forEach((node, idx) => {
      if (idx >= low && idx < high)
        children.push(node);
    });
    return children;
  }

  draw() {
    super.draw();

    this.nodes.forEach((node, idx) => {
      node.draw(idx);
      idx++;
    });

    this.drawArrows();
  }

  /** LinekdList.newIndex
   *    create a unique index by taking max of current indices + 1
   */
  newIndex() {
    return Array.from(this.list.keys()).reduce(
      (acc, val) => Math.max(acc, val), -1) + 1;
  }

  /** LinkedList.append
   *    add a new node from the current node with highest index
   */
  append(value) {
    var maxId = this.newIndex() - 1;
    this.addNode(this.nodes[maxId], value);
  }

  /** LinkedList.addNode
   *    add a new node to linked list
   *    with incoming link from fromNode
   *
   *    fromNode must be actual NodeObject
   *
   *    after insertion check if list is still
   *    'linear' i.e. no branches
   */
  addNode(fromNode=null, value=null) {
    // new node uses LinkedList x1, y1, others are placed
    // to right of newest node
    var x, y;
    if (this.list.size) {
      var maxIdx = this.newIndex() - 1;
      x = this.list.get(maxIdx).x + this.cellSize * 4;
      y = this.list.get(maxIdx).y;
    }
    else {
      x = this.x1;
      y = this.y1;
    }
   
    var newNode = new ListNode(this.cState, this, value, this.newIndex(), x, y);
    this.list.set(newNode.index, newNode);

    this.ids.set(newNode.index, newNode);

    // add edge/link
    if (fromNode)
      this.addEdge(fromNode, newNode);

    return newNode;
  }


  /** LinkedList.removeNode
   *    remove node from map
   */
  removeNode(node) {
    // this.arrows.forEach((arr, index) => {
    //   var from = this.list.get(index[0]);
    //   var to = this.list.get(index[1]);

    //   if (from === node || to === node)
    //     this.removeEdge(from, to);
    // });
    this.list.delete(node.index);
  }

  /** LinkedList.addEdge
   *    add an edge and create new CurvedArrow
   *
   *    arcs belong to LinkedList (manage drawing)
   *    as well as its source and destination ListNodes
   *    (manage dragging endpoints)
   *
   *    first check that edge doesn't already exist
   */
  addEdge(fromNode, toNode) {
    var e = [fromNode.index, toNode.index];
    
    // fancy Map.has because [1, 2] !== [1, 2]
    if (this.arrows.hasEquiv(e))
      throw `Edge ${e} already exists.`;

    // create new curved arrow that is locked to 
    // this linked list 
    var arrow = new ChildArrow(this.cState, this,
      fromNode.x, fromNode.y, toNode.x, toNode.y, fromNode, toNode);

    this.arrows.set(e, arrow);
  }

  removeEdge(fromNode, toNode) {
    var e = [fromNode.index, toNode.index];
    if (! (this.arrows.hasEquiv(e)))
      throw `Edge ${e} does not exist.`;
     
    var edge = this.arrows.getEquiv(e);
    this.arrows.deleteEquiv(e);
    // edge.destroy();
    return edge;
  }

  get floatingChildren() {
    return this.nodes.concat(Array.from(this.arrows.values()));
  }
}

class ListNode extends NodeObject {
  constructor(canvasState, parentObject, value, index, x, y) {
    super(canvasState, parentObject, value);

    this.borderThickness = 2;

    this.index = index;
    this.x = x;
    this.y = y;
  }

  toString() {
    return `ListNode(${this.value})`;
  }

  configureOptions() {
    super.configureOptions();
    this.nodeStyle = this.getParent().nodeStyle;
  }

  /** ListNode.draw
   */
  draw() {
    super.draw();
    // list uses unique (i.e. not positional like array)
    // indices
    var idx = this.index;

    this.ctx.beginPath();
    this.hitCtx.beginPath();

    if (this.nodeStyle == "circle") {
      this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      this.hitCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    }
    if (this.nodeStyle == "square") {
      var h = Math.floor(this.cellSize / 2);
      this.ctx.rect(this.x - h, this.y - h, this.cellSize, this.cellSize);
      this.ctx.fillRect(this.x - h, this.y - h, this.cellSize, this.cellSize);
      this.hitCtx.fillRect(this.x - h, this.y - h, this.cellSize, this.cellSize);
    }

    this.ctx.stroke();
    this.ctx.fill();

    this.hitCtx.fill();

    // leave node blank if value is null
    if (this.getParent().showValues && this.showValues && this.value !== null)
      this.drawValue();

    if (this.getParent().showIndices && this.showIndices)
      this.drawIndex(idx);
  }

  /** ListNode.drawValue
   */
  drawValue() {
    var valStr = this.value.toString();
    var textWidth = this.ctx.measureText(valStr).width;

    if (textWidth > this.cellSize) {
      valStr = "..";
      textWidth = this.ctx.measureText(valStr).width;
    }

    this.ctx.textBaseline = "middle";
    this.ctx.textAlign = "center";

    this.ctx.fillStyle = this.textColor;
    this.ctx.fillText(valStr, this.x, this.y);
  }

  /** ListNode.drawIndex
   *    draw index above or below
   */
  drawIndex(idx) {
    var yOffset;
    if (this.getParent().indexPlacement == "above") 
      yOffset = -this.cellSize;
    else 
      yOffset = this.cellSize;

    this.ctx.textBaseline = "alphabetic";
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "black";

    this.ctx.fillText(idx, this.x, this.y + yOffset);

  }
    
  /** ListNode.shiftDrag
   *    shift + regular drag moves individual nodes around
   *
   *    dragging head moves list label
   */
  shiftDrag(deltaX, deltaY) {
    this.x += deltaX;
    this.y += deltaY;

    var list = this.getParent();
    if (this === this.getParent().head) {
      list.x1 += deltaX;
      list.y1 += deltaY;
      list.x2 += deltaX;
      list.y2 += deltaY;
    }
  }
}

