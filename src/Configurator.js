export class InvalidConfigurator {}

export class Configurator {
  constructor(dataType, defaultValue = null, resetOnBlink = false) {
    this.dataType = dataType;
    this.defaultValue = defaultValue;
    this.resetOnBlink = resetOnBlink;
  }
}

export class ShapeConfigurator {
  constructor(shapeConfig, isRequired = false) {
    this.shapeConfig = shapeConfig;
    this.isShapeRequired = isRequired;
    if (!isRequired) {
      this.isRequired = new ShapeConfigurator(shapeConfig, true);
    }
  }
}

export class ValidationConfigurator {
  constructor(path) {
    this.path = path;
  }
}
