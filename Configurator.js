export class Configurator {
  constructor(appstateType, defaultValue = null) {
    this.appstateType = appstateType;
    this.defaultValue = defaultValue;
  }
}

export class ShapeConfigurator {
  constructor(shapeConfig, bubbleUp) {
    this.shapeConfig = shapeConfig;
    this.bubbleUp = bubbleUp;
  }
}

export class ValidationConfigurator {
  constructor(path) {
    this.path = path;
  }
}
