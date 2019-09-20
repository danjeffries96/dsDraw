
class LanguageObject {

  propNames() {
    return {};
  }

  methodNames() {
    return {};
  }

  propMethodNames() {
    return {
      ...this.propNames(),
      ...this.methodNames(),
    };
  }
}

class Dictionary extends LanguageObject {
  constructor(keyValueList) {
    super();

    // store data in map
    this.map = new Map();

    if (keyValueList)
      keyValueList.forEach(([k, v]) => {
        this.set(k, v);
      });
  }

  toString() {
    return `{${
      Array.from(this.entries())
      .map(([k, v]) => `${stringify(k)} : ${stringify(v)}`)
      .join(", ")}}`;
  }

  methodNames() {
    return {
      "keys" : DictionaryKeysCommand,
      "values": DictionaryValuesCommand,
      "delete": DictionaryDeleteCommand
    }
  }

  checkKeyValue(key) {
    if (! (typeof key == "number" || typeof key == "string"))
      throw `Dictionary keys must be string or number: ${key}.`;
  }

  has(key) {
    return this.map.has(key);
  }

  set(key, value) {
    this.checkKeyValue(key);
    this.map.set(key, value);
  }

  delete(key) {
    this.checkKeyValue(key);
    if (this.has(key))
      this.map.delete(key);
  }

  get(key) { 
    return this.map.get(key);
  }

  keys() {
    return this.map.keys();
  }

  values() {
    return this.map.values();
  }

  entries() {
    return this.map.entries();
  }

  forEach(f) {
    this.map.forEach(f);
  }
}
