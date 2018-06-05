import { AppStateTypes, isAppState } from 'oxssy-appstate';
import { createConfigType, inferType } from './basic-types';
import { Configurator, ShapeConfigurator, ValidationConfigurator } from './Configurator';

const getAppStateTypeForShape = (shapeConfig) => {
  if (isAppState(shapeConfig)) {
    return shapeConfig.type;
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

const createCompoundConfigType = (appstateType, isRequired) =>
  (spec, options) =>
    createConfigType(isRequired
      ? appstateType(getAppStateTypeForShape(spec)).isRequired
      : appstateType(getAppStateTypeForShape(spec)))(options);

const exports = {};

const compounds = {
  ArrayOf: AppStateTypes.arrayOf,
  ObjectOf: AppStateTypes.objectOf,
  OneOf: AppStateTypes.oneOfType,
  ShapeOf: AppStateTypes.shape,
  ExactShapeOf: AppStateTypes.exact,
};

Object.entries(compounds).forEach(([name, baseType]) => {
  exports[`O${name}`] = createCompoundConfigType(baseType, false);
  exports[`ORequired${name}`] = createCompoundConfigType(baseType, true);
});

export default exports;
