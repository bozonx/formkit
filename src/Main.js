import Config from './Config';
import Log from './Log';

export default class Main {
  constructor(config) {
    var configInstance = new Config(config);
    this.config = configInstance.get();
    this.events = this.config.eventEmitter;
    this.log = new Log({silent: this.config.silent});
  }
}
