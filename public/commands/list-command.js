
class ListCommand extends ConsoleCommand {
  constructor(receiver, ...args) {
    super(...args);
    this.receiver = receiver;
  }

  saveState() {
    return {
      prevList : this.receiver.slice()
    }
  }

  // replace array contents in place
  restoreState(state) {
    this.receiver.splice(0, this.receiver.length, ...state.prevList);
  }
}

class ListLengthCommand extends ListCommand { 

  precheckArguments() {
    this.checkArgsLength(0);
  }

  executeSelf() {
    return this.receiver.length;
  }

  saveState() {}
  restoreState() {}
}

class ListPushCommand extends ListCommand {

  precheckArguments() {
    this.checkArgsLength(1);
  }

  getChildValues() {
    this.element = this.args[0];
  }

  executeSelf() {
    this.receiver.push(this.element);
  }
}



class ListPopCommand extends ListCommand {

  precheckArguments() {
    this.checkArgsLength(0);
  }

  executeSelf() {
    return this.receiver.pop();
  }
}

class ListEmptyCommand extends ListCommand {

  precheckArguments() {
    this.checkArgsLength(0);
  }

  executeSelf() {
    return this.receiver.length == 0;
  }
}