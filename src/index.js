import {
  Oxssy,
  OxssyMap,
  OxssyValidation,
  find,
} from 'oxssy';
import {
  Configurator,
  InvalidConfigurator,
  ShapeConfigurator,
  ValidationConfigurator,
} from './Configurator';
import Types, { inferType, isConfigured } from './types';

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

export function shape(dataConfig) {
  return new ShapeConfigurator(dataConfig);
}

export function validates(path) {
  return new ValidationConfigurator(path);
}

export function config(dataConfig) {
  if (isConfigured(dataConfig)) {
    return dataConfig;
  }
  if (dataConfig instanceof InvalidConfigurator) {
    throw new Error('Required data must have a default value');
  }
  if (dataConfig instanceof Configurator) {
    return new Oxssy(
      dataConfig.dataType,
      dataConfig.defaultValue,
      dataConfig.resetOnBlink,
    );
  }
  if (dataConfig instanceof ShapeConfigurator) {
    return config(dataConfig.shapeConfig);
  }

  const configurator = inferType(dataConfig);
  if (configurator) {
    return new Oxssy(
      configurator.dataType,
      configurator.defaultValue,
      configurator.resetOnBlink,
    );
  }

  if (Array.isArray(dataConfig)) {
    const oxssyArray = new OxssyArray();
    dataConfig.forEach((childConfig) => {
      oxssyArray.push(config(childConfig));
    });
    return oxssyArray;
  }

  const children = {};
  const validations = {};
  Object.entries(dataConfig).forEach(([childName, childConfig]) => {
    if (childConfig instanceof ValidationConfigurator) {
      validations[childName] = childConfig;
    } else {
      children[childName] = config(childConfig);
    }
  });
  const oxssyMap = new OxssyMap(children);
  Object.entries(validations).forEach(([childName, validation]) => {
    oxssyMap.set(childName, new OxssyValidation(find(oxssyMap, validation.path)));
  });
  return oxssyMap;
}
