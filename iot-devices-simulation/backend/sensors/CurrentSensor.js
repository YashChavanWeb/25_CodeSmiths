export default class CurrentSensor {
  constructor(base = 5) {
    this.base = base;
  }

  read() {
    return +(this.base + (Math.random() * 2 - 1)).toFixed(2);
  }
}
