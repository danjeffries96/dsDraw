/** LinkedList commands
 */

class LinkedListCommand extends CanvasObjectMethod {
  checkIndices(...indices) {
    indices.forEach(i => {
      if (! (this.receiver.list.hasEquiv(i))) {
        console.log(i, "not in ", this.receiver.list);
        this.argsError(`Invalid index: ${i}.`);
      }
    });
  }
}

class LinkedListInsertCommand extends LinkedListCommand {

  executeChildren() {
    super.executeChildren();
    this.fromIndex = this.args[0];
    this.value = this.args[1];
  }

  checkArguments() {
    this.checkIndices(this.fromIndex);
    if (isNaN(Number(this.value)))
      this.argsError("Invalid value for linked list:" + this.value);
  }

  executeSelf() {
    this.fromNode = this.receiver.list.get(this.fromIndex);
    // addNode creates new node and new edge
    this.newNode = this.receiver.addNode(this.fromNode, this.value);
  }

  undo() {
    // remove node and newly created edge
    this.receiver.removeNode(this.newNode);
  }
}

class LinkedListLinkCommand extends LinkedListCommand {

  executeChildren() {
    super.executeChildren();
    this.fromIndex = this.args[0];
    this.toIndex = this.args[1];
  }

  checkArguments() {
    this.checkIndices(this.fromIndex, this.toIndex);
  }

  executeSelf() {
    this.fromNode = this.receiver.list.get(this.fromIndex);
    this.toNode = this.receiver.list.get(this.toIndex);
    this.receiver.addEdge(this.fromNode, this.toNode);
  }

  undo() {
    this.receiver.removeEdge(this.fromNode, this.toNode);
  }
}

class LinkedListCutCommand extends LinkedListCommand {

  executeChildren() {
    super.executeChildren();
    this.fromIndex = this.args[0];
    this.toIndex = this.args[1];

    // // save arrow object for undo
    // this.edge = null;
  }

  checkArguments() {
    this.checkIndices(this.fromIndex, this.toIndex);
  }

  executeSelf() {
    this.fromNode = this.receiver.list.get(this.fromIndex);
    this.toNode = this.receiver.list.get(this.toIndex);
    this.edge = this.receiver.removeEdge(this.fromNode, this.toNode);
  }

  /** LinkedListCutCommand.undo 
   *    restore cut edge (it will add itself back
   *    to parent map in its restore method)
   */
  undo() {
    // this.edge.restore();
    this.receiver.arrows.set([this.fromIndex, this.toIndex], this.edge);
  }
}

class LinkedListRemoveCommand extends LinkedListCommand {
  constructor(receiver, removeIdx) {
    super(receiver, removeIdx);

    this.node = null;
    this.removedArrows = [];
  }

  executeChildren() {
    super.executeChildren();
    this.removeIndex = this.args[0];
  }

  checkArguments() {
    this.checkIndices(this.removeIndex);
  }

  executeSelf() {
    if (this.node == null) {
      this.node = this.receiver.list.get(this.removeIndex);
      // this.receiver.arrows.forEach((arr, idx) => {
      //   if (idx.includes(this.removeIndex))
      //     this.removedArrows.push(arr);
      // });

      // TODO implement arrow save/restore
      this.oldArrows = new Map();
      this.receiver.arrows.forEach((v, k) => {
        this.oldArrows.set(k, v);
      });
    }
    this.receiver.list.delete(this.removeIndex);

    // deprecated bc of child arrow class
    // this.removedArrows.forEach(arr => arr.destroy());
  }

  undo() {
    this.receiver.list.set(this.removeIndex, this.node);

    // deprecated bc of child arrow class
    // this.removedArrows.forEach(arr => arr.restore());
  }
}