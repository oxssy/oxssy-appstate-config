export class InvalidConfigurator {}

export class Configurator {
  constructor(dataType, defaultValue = null, resetOnBlink = false) {
    this.dataType = dataType;
    this.defaultValue = defaultValue;
    this.resetOnBlink = resetOnBlink;
  }
}

export class ShapeConfigurator {
  constructor(shapeConfig) {
    this.shapeConfig = shapeConfig;
  }
}

export class ValidationConfigurator {
  constructor(path) {
    this.path = path;
  }
}
