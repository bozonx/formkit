import Config from './Config';
import Log from './Log';
import Form from './Form';

export default class Main {
  constructor() {
    var configInstance = new Config({});
    this.config = configInstance.get();
    // TODO: не подключать так
    this.events = this.config.eventEmitter;
    // TODO: не хранить silent - использовать глобальную опцию
    this.log = new Log({silent: this.config.silent});

    return new Form(this.events, this.log);
  }
}
