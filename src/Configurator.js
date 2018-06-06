export class InvalidConfigurator {}

export class Configurator {
  constructor(appstateType, defaultValue = null, shouldResetOnDisconnect = false) {
    this.appstateType = appstateType;
    this.defaultValue = defaultValue;
    this.shouldResetOnDisconnect = shouldResetOnDisconnect;
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
