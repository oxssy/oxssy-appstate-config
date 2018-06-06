import {
  AppState,
  ArrayAppState,
  CompositeAppState,
  ValidationAppState,
  find,
  isAppState,
} from 'oxssy-appstate';
import {
  Configurator,
  InvalidConfigurator,
  ShapeConfigurator,
  ValidationConfigurator,
} from './Configurator';
import Types, { inferType } from './types';

export const {
  OAny,
  OArray,
  OArrayOf,
  OBool,
  OElement,
  OEnum,
  OExactShapeOf,
  OFunc,
  OInstance,
  ONode,
  ONumber,
  OObject,
  OObjectOf,
  OOneOfType,
  OShapeOf,
  OString,
  OSymbol,
  OValidate,
} = Types;

export function shape(appStatesConfig, bubbleUp = true) {
  return new ShapeConfigurator(appStatesConfig, bubbleUp);
}

export function validates(path) {
  return new ValidationConfigurator(path);
}

export function config(appStatesConfig, bubbleUp = true, key = null) {
  if (isAppState(appStatesConfig)) {
    return appStatesConfig;
  }
  if (appStatesConfig instanceof InvalidConfigurator) {
    throw new Error(`Required AppState must have a default value${key ? `: ${key}` : ''}`);
  }
  if (appStatesConfig instanceof Configurator) {
    return new AppState(
      appStatesConfig.appstateType,
      appStatesConfig.defaultValue,
      appStatesConfig.shouldResetOnDisconnect,
    );
  }
  if (appStatesConfig instanceof ShapeConfigurator) {
    return config(appStatesConfig.shapeConfig, appStatesConfig.bubbleUp);
  }

  const configurator = inferType(appStatesConfig);
  if (configurator) {
    return new AppState(
      configurator.appstateType,
      configurator.defaultValue,
      configurator.shouldResetOnDisconnect,
    );
  }

  if (Array.isArray(appStatesConfig)) {
    const arrayState = new ArrayAppState();
    appStatesConfig.forEach((childConfig) => {
      arrayState.push(config(childConfig, bubbleUp));
    });
    return arrayState;
  }

  const compositeState = new CompositeAppState();
  const validations = {};
  Object.entries(appStatesConfig).forEach(([childName, childConfig]) => {
    if (childConfig instanceof ValidationConfigurator) {
      validations[childName] = childConfig;
    } else {
      compositeState.add(childName, config(childConfig, bubbleUp, childName));
    }
  });

  Object.entries(validations).forEach(([childName, validation]) => {
    compositeState.add(childName, new ValidationAppState(find(compositeState, validation.path)));
  });
  return compositeState;
}
