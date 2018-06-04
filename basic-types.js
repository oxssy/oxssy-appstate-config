import { isValidElement } from 'react';
import { AppStateTypes } from 'oxssy-appstate';
import { Configurator, ShapeConfigurator, ValidationConfigurator } from './Configurator';


const exports = {};

export const createConfigType = appstateType => (options) => {
  let configurator;
  if (options) {
    configurator = new Configurator(appstateType.withOptions(options));
    configurator.defaultsTo = defaultValue =>
      new Configurator(appstateType.withOptions(options), defaultValue);
  } else {
    configurator = new Configurator(appstateType);
    configurator.defaultsTo = defaultValue =>
      new Configurator(appstateType, defaultValue);
  }
  return configurator;
};

const createCompoundConfigType = (appstateType, isRequired) =>
  (spec, options) =>
    createConfigType(isRequired ? appstateType(spec).isRequired : appstateType(spec))(options);

const createCustomConfigType = isRequired => (validationFunction) => {
  const configurator = new Configurator(isRequired
    ? AppStateTypes.custom(validationFunction).isRequired
    : AppStateTypes.custom(validationFunction));
  configurator.defaultsTo = defaultValue =>
    new Configurator(isRequired
      ? AppStateTypes.custom(validationFunction).isRequired
      : AppStateTypes.custom(validationFunction), defaultValue);
  return configurator;
};

const primitives = {
  Any: AppStateTypes.any,
  Array: AppStateTypes.array,
  Bool: AppStateTypes.bool,
  Element: AppStateTypes.element,
  Func: AppStateTypes.func,
  Node: AppStateTypes.node,
  Number: AppStateTypes.number,
  Object: AppStateTypes.object,
  String: AppStateTypes.string,
  Symbol: AppStateTypes.symbol,
};

Object.entries(primitives).forEach(([name, baseType]) => {
  exports[`O${name}`] = createConfigType(baseType);
  exports[`ORequired${name}`] = createConfigType(baseType.isRequired);
});

const simpleCompounds = {
  Enum: AppStateTypes.oneOf,
  InstanceOf: AppStateTypes.instanceOf,
};

Object.entries(simpleCompounds).forEach(([name, baseType]) => {
  exports[`O${name}`] = createCompoundConfigType(baseType, false);
  exports[`ORequired${name}`] = createCompoundConfigType(baseType, true);
});

exports.OValidate = createCustomConfigType(false);
exports.ORequiredValidate = createCustomConfigType(true);

export default exports;

export const inferType = (value) => {
  if (value === null) {
    return exports.OAny();
  } else if (typeof value === 'boolean') {
    return exports.ORequiredBool().defaultsTo(value);
  } else if (typeof value === 'function') {
    if (typeof value.constructor === 'function') {
      return exports.ORequiredInstanceOf(value);
    }
    return exports.ORequiredFunc().defaultsTo(value);
  } else if (typeof value === 'number') {
    return exports.ORequiredNumber().defaultsTo(value);
  } else if (typeof value === 'string') {
    return exports.ORequiredString().defaultsTo(value);
  } else if (typeof value === 'symbol') {
    return exports.ORequiredSymbol().defaultsTo(value);
  } else if (isValidElement(value)) {
    return exports.ORequiredElement().defaultsTo(value);
  } else if (Array.isArray(value)
    && !value.some(el => el instanceof Configurator
      || el instanceof ShapeConfigurator
      || el instanceof ValidationConfigurator)) {
    return exports.ORequiredArray().defaultsTo(value);
  } else if (Object.keys(value).length === 0) {
    return exports.ORequiredObject().defaultsTo(value);
  }
  return null;
};
