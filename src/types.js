import { isValidElement } from 'react';
import { AppStateTypes, isAppState } from 'oxssy-appstate';
import {
  Configurator,
  InvalidConfigurator,
  ShapeConfigurator,
  ValidationConfigurator,
} from './Configurator';

const exports = {};

export const createConfigType = (appstateType, shouldResetOnDisconnect = false) =>
  (options) => {
    const configurator = new Configurator(
      options ? appstateType.withOptions(options) : appstateType,
      null,
      shouldResetOnDisconnect,
    );
    configurator.defaultsTo = defaultValue =>
      new Configurator(
        options ? appstateType.withOptions(options) : appstateType,
        defaultValue,
        shouldResetOnDisconnect,
      );
    if (appstateType.isRequired) {
      configurator.isRequired = new InvalidConfigurator();
      configurator.isRequired.defaultsTo = defaultValue =>
        new Configurator(
          options ? appstateType.isRequired.withOptions(options) : appstateType.isRequired,
          defaultValue,
          shouldResetOnDisconnect,
        );
    }
    return configurator;
  };

const createSimpleCompoundConfigType = (appstateType, shouldResetOnDisconnect = false) =>
  (spec, options) =>
    createConfigType(appstateType(spec), shouldResetOnDisconnect)(options);

const createCustomConfigType = () =>
  validationFunction => createConfigType(AppStateTypes.custom(validationFunction))();

const createShortcutConfigType = (appstateType, shouldResetOnDisconnect, builtInOptions) =>
  options =>
    createConfigType(appstateType, shouldResetOnDisconnect)({ ...builtInOptions, ...options });

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
});

const simpleCompounds = {
  Enum: AppStateTypes.oneOf,
  InstanceOf: AppStateTypes.instanceOf,
};

Object.entries(simpleCompounds).forEach(([name, baseType]) => {
  exports[`O${name}`] = createSimpleCompoundConfigType(baseType);
});

exports.OValidate = createCustomConfigType();
exports.OEmail = createShortcutConfigType(AppStateTypes.string, false, { isEmail: true });
exports.OUrl = createShortcutConfigType(AppStateTypes.string, false, { isUrl: true });
exports.OUuid = createShortcutConfigType(AppStateTypes.string, false, { isUuid: true });
exports.OPassword = createShortcutConfigType(AppStateTypes.string, true, {});

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

const getAppStateTypeForShape = (shapeConfig) => {
  if (isAppState(shapeConfig)) {
    throw new Error('AppState is not allowed in shape definitions');
  }
  if (shapeConfig instanceof ShapeConfigurator) {
    return getAppStateTypeForShape(shapeConfig.shapeConfig);
  }
  if (shapeConfig instanceof Configurator) {
    return shapeConfig.appstateType;
  }
  if (shapeConfig instanceof ValidationConfigurator) {
    return AppStateTypes.symbol;
  }
  const configurator = inferType(shapeConfig);
  if (configurator) {
    return configurator.appstateType;
  }
  if (Array.isArray(shapeConfig)) {
    const setOfTypes = new Set();
    shapeConfig.forEach(child => setOfTypes.add(getAppStateTypeForShape(child)));
    const childTypes = setOfTypes.values();
    if (childTypes.length === 1) {
      return AppStateTypes.arrayOf(childTypes[0]);
    }
    return AppStateTypes.arrayOf(AppStateTypes.oneOfType(childTypes));
  }

  const shapeType = {};
  Object.entries(shapeConfig).forEach(([name, child]) => {
    shapeType[name] = getAppStateTypeForShape(child);
  });
  return AppStateTypes.exact(shapeType);
};

const createCompoundConfigType = (appstateType, shouldResetOnDisconnect = false) =>
  (spec, options) =>
    createConfigType(appstateType(getAppStateTypeForShape(spec)), shouldResetOnDisconnect)(options);

const compounds = {
  ArrayOf: AppStateTypes.arrayOf,
  ObjectOf: AppStateTypes.objectOf,
  OneOf: AppStateTypes.oneOfType,
  ShapeOf: AppStateTypes.shape,
  ExactShapeOf: AppStateTypes.exact,
};

Object.entries(compounds).forEach(([name, baseType]) => {
  exports[`O${name}`] = createCompoundConfigType(baseType);
});

export default exports;
