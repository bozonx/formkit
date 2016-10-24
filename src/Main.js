import Config from './Config';
import Log from './Log';
import Form from './Form';

export default class Main {
  constructor() {
    var configInstance = new Config({});
    this.config = configInstance.get();
    this.events = this.config.eventEmitter;
    this.log = new Log({silent: this.config.silent});

    return new Form(this.events, this.log);
  }
}
