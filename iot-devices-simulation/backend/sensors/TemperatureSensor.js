export default class TemperatureSensor {
  constructor(base = 30) {
    this.base = base;
  }

  read() {
    return +(this.base + (Math.random() * 4 - 2)).toFixed(2);
  }
}
