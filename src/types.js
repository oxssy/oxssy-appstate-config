import { isValidElement } from 'react';
import { datatype, Oxssy, OxssyMap } from 'oxssy';
import {
  Configurator,
  InvalidConfigurator,
  ShapeConfigurator,
  ValidationConfigurator,
} from './Configurator';

const exports = {};

export const createConfigType = (dataType, shouldResetOnDisconnect = false) =>
  (options) => {
    const configurator = new Configurator(
      options ? dataType.withOption(options) : dataType,
      null,
      shouldResetOnDisconnect,
    );
    configurator.defaultsTo = defaultValue =>
      new Configurator(
        options ? dataType.withOption(options) : dataType,
        defaultValue,
        shouldResetOnDisconnect,
      );
    if (dataType.isRequired) {
      configurator.isRequired = new InvalidConfigurator();
      configurator.isRequired.defaultsTo = defaultValue =>
        new Configurator(
          options ? dataType.isRequired.withOption(options) : dataType.isRequired,
          defaultValue,
          shouldResetOnDisconnect,
        );
    }
    return configurator;
  };

const createSimpleCompoundConfigType = (dataType, shouldResetOnDisconnect = false) =>
  (spec, options) =>
    createConfigType(dataType(spec), shouldResetOnDisconnect)(options);

const createCustomConfigType = () =>
  validationFunction => createConfigType(datatype.custom(validationFunction))();

const createShortcutConfigType = (dataType, shouldResetOnDisconnect, builtInOptions) =>
  options =>
    createConfigType(dataType, shouldResetOnDisconnect)({ ...builtInOptions, ...options });

const primitives = {
  Any: datatype.any,
  Array: datatype.array,
  Bool: datatype.bool,
  Element: datatype.element,
  Func: datatype.func,
  Node: datatype.node,
  Number: datatype.number,
  Object: datatype.object,
  String: datatype.string,
  Symbol: datatype.symbol,
};

Object.entries(primitives).forEach(([name, baseType]) => {
  exports[`O${name}`] = createConfigType(baseType);
});

const simpleCompounds = {
  Enum: datatype.oneOf,
  InstanceOf: datatype.instanceOf,
};

Object.entries(simpleCompounds).forEach(([name, baseType]) => {
  exports[`O${name}`] = createSimpleCompoundConfigType(baseType);
});

exports.OValidate = createCustomConfigType();
exports.OEmail = createShortcutConfigType(datatype.string, false, { isEmail: true });
exports.OUrl = createShortcutConfigType(datatype.string, false, { isUrl: true });
exports.OUuid = createShortcutConfigType(datatype.string, false, { isUuid: true });
exports.OPassword = createShortcutConfigType(datatype.string, true, {});

export const inferType = (value) => {
  if (value === null) {
    return exports.OAny();
  } else if (typeof value === 'boolean') {
    return exports.OBool().isRequired.defaultsTo(value);
  } else if (typeof value === 'function') {
    return exports.OFunc().isRequired.defaultsTo(value);
  } else if (typeof value === 'number') {
    return exports.ONumber().isRequired.defaultsTo(value);
  } else if (typeof value === 'string') {
    return exports.OString().isRequired.defaultsTo(value);
  } else if (typeof value === 'symbol') {
    return exports.OSymbol().isRequired.defaultsTo(value);
  } else if (isValidElement(value)) {
    return exports.OElement().isRequired.defaultsTo(value);
  } else if (Array.isArray(value)
    && !value.some(el => el instanceof Configurator
      || el instanceof ShapeConfigurator
      || el instanceof ValidationConfigurator)) {
    return exports.OArray().isRequired.defaultsTo(value);
  } else if (value.constructor !== Object) {
    return exports.OInstanceOf(value.constructor).defaultsTo(value);
  } else if (Object.keys(value).length === 0) {
    return exports.OObject().isRequired.defaultsTo(value);
  }
  return null;
};

export const isConfigured = (shapeConfig) =>
  shapeConfig instanceof Oxssy || shapeConfig instanceof OxssyMap;

const getDataTypeForShape = (shapeConfig) => {
  if (isConfigured(shapeConfig)) {
    throw new Error('Configured data is not allowed in shape definitions');
  }
  if (shapeConfig instanceof ShapeConfigurator) {
    return getDataTypeForShape(shapeConfig.shapeConfig);
  }
  if (shapeConfig instanceof Configurator) {
    return shapeConfig.dataType;
  }
  if (shapeConfig instanceof ValidationConfigurator) {
    return datatype.symbol;
  }
  const configurator = inferType(shapeConfig);
  if (configurator) {
    return configurator.dataType;
  }
  if (Array.isArray(shapeConfig)) {
    const setOfTypes = new Set();
    shapeConfig.forEach(child => setOfTypes.add(getDataTypeForShape(child)));
    const childTypes = setOfTypes.values();
    if (childTypes.length === 1) {
      return datatype.arrayOf(childTypes[0]);
    }
    return datatype.arrayOf(datatype.oneOfType(childTypes));
  }

  const shapeType = {};
  Object.entries(shapeConfig).forEach(([name, child]) => {
    shapeType[name] = getDataTypeForShape(child);
  });
  return datatype.exact(shapeType);
};

const createCompoundConfigType = (dataType, shouldResetOnDisconnect = false) =>
  (spec, options) =>
    createConfigType(dataType(getDataTypeForShape(spec)), shouldResetOnDisconnect)(options);

const compounds = {
  ArrayOf: datatype.arrayOf,
  ObjectOf: datatype.objectOf,
  OneOf: datatype.oneOfType,
  ShapeOf: datatype.shape,
  ExactShapeOf: datatype.exact,
};

Object.entries(compounds).forEach(([name, baseType]) => {
  exports[`O${name}`] = createCompoundConfigType(baseType);
});

export default exports;
