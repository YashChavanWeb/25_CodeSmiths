class PressureSensor {
  constructor(base = 2) {
    this.base = base;
  }

  read() {
    return +(this.base + (Math.random() * 0.4 - 0.2)).toFixed(2);
  }
}

module.exports = PressureSensor;
