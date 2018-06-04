import { AppState, ArrayAppState, CompositeAppState, ValidationAppState, find } from 'oxssy-appstate';
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

export function config(appStatesConfig, bubbleUp = true, name = '/') {
  if (appStatesConfig instanceof Configurator) {
    return new AppState(name, appStatesConfig.appstateType, appStatesConfig.defaultValue);
  }
  if (appStatesConfig instanceof ShapeConfigurator) {
    return config(appStatesConfig.shapeConfig, appStatesConfig.bubbleUp, name);
  }

  const configurator = inferType(appStatesConfig);
  if (configurator) {
    return new AppState(name, configurator.appstateType, configurator.defaultValue);
  }

  if (Array.isArray(appStatesConfig)) {
    const arrayState = new ArrayAppState(name);
    appStatesConfig.forEach(([childConfig, childIndex]) => {
      arrayState.push(config(childConfig, bubbleUp, `${childIndex}`));
    });
    return arrayState;
  }

  const compositeState = new CompositeAppState(name);
  const validations = {};
  Object.entries(appStatesConfig).forEach(([childName, childConfig]) => {
    if (childConfig instanceof ValidationConfigurator) {
      validations[childName] = childConfig;
    } else {
      compositeState.add(config(childConfig, bubbleUp, childName));
    }
  });

  Object.entries(validations).forEach(([childName, validation]) => {
    compositeState.add(new ValidationAppState(childName, find(compositeState, validation.path)));
  });
  return compositeState;
}
