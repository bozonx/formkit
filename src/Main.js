import Config from './Config';
import Log from './Log';
import Form from './Form';
import Storage from './Storage';

export default class Main {
  constructor() {
    var configInstance = new Config({});
    this.config = configInstance.get();
    // TODO: не подключать так
    this.events = this.config.eventEmitter;
    // TODO: не хранить silent - использовать глобальную опцию
    this.log = new Log({silent: this.config.silent});
    this.storage = new Storage();

    return new Form(this.storage, this.events, this.log);
  }
}
