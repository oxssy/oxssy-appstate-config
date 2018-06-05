import { AppState, ArrayAppState, CompositeAppState, ValidationAppState, find, isAppState } from 'oxssy-appstate';
import { Configurator, ShapeConfigurator, ValidationConfigurator } from './Configurator';
import BasicTypes, { inferType } from './basic-types';
import CompoundTypes from './compound-types';

export const {
  OAny,
  OArray,
  OBool,
  OElement,
  OEnum,
  OFunc,
  OInstance,
  ONode,
  ONumber,
  OObject,
  ORequiredAny,
  ORequiredArray,
  ORequiredBool,
  ORequiredElement,
  ORequiredEnum,
  ORequiredFunc,
  ORequiredInstance,
  ORequiredNode,
  ORequiredNumber,
  ORequiredObject,
  ORequiredString,
  ORequiredSymbol,
  ORequiredValidate,
  OString,
  OSymbol,
  OValidate,
} = BasicTypes;

export const {
  OArrayOf,
  OExactShapeOf,
  OObjectOf,
  OOneOfType,
  ORequiredArrayOf,
  ORequiredExactShapeOf,
  ORequiredObjectOf,
  ORequiredOneOfType,
  ORequiredShapeOf,
  OShapeOf,
} = CompoundTypes;

export function shape(appStatesConfig, bubbleUp = true) {
  return new ShapeConfigurator(appStatesConfig, bubbleUp);
}

export function validates(path) {
  return new ValidationConfigurator(path);
}

export function config(appStatesConfig, bubbleUp = true) {
  if (isAppState(appStatesConfig)) {
    return appStatesConfig;
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
      compositeState.add(childName, config(childConfig, bubbleUp));
    }
  });

  Object.entries(validations).forEach(([childName, validation]) => {
    compositeState.add(childName, new ValidationAppState(find(compositeState, validation.path)));
  });
  return compositeState;
}
