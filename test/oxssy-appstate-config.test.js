import { AppState, find } from 'oxssy-appstate';
import {
  OEnum,
  OString,
  OArrayOf,
  config,
  shape,
  validates,
} from '../src';

class TestClass {}

describe('AppState config', () => {
  test('configuring AppStates', () => {
    const testAppState = new AppState();
    const testClassObject = new TestClass();
    const enumValue = OEnum(['A', 'B', 'C']).isRequired.defaultsTo('B');

    const type = shape({
      withPrimitive: OString(),
      withPrimitiveDefault: OString().defaultsTo('default'),
      withRequiredPrimitive: OString().isRequired.defaultsTo('required default'),
      withDefaultValue: 'another default',
      withShape: enumValue,
      withEnumInArray: OArrayOf(enumValue).isRequired.defaultsTo(['A']),
    });

    const states = config({
      withType: type,
      withEnum: enumValue,
      withArray: [1, 2, 3],
      withArrayOfDifferentTypes: [1, 'string', {}],
      withClassObject: testClassObject,
      withEmptyObject: {},
      nested: {
        nestedString: OString().defaultsTo('nested'),
        withNull: null,
      },
      withAppState: testAppState,
      validation: validates('withEnum'),
    });

    expect(find(states, 'withEnum').value).toBe('B');
    expect(find(states, 'withArray').value).toEqual([1, 2, 3]);
    expect(find(states, 'withArrayOfDifferentTypes').value).toEqual([1, 'string', {}]);
    expect(find(states, 'withClassObject').value).toBe(testClassObject);
    expect(find(states, 'withEmptyObject').value).toEqual({});
    expect(find(states, 'nested/nestedString').value).toBe('nested');
    expect(find(states, 'nested/withNull').value).toBeNull();
    expect(find(states, 'withAppState')).toBe(testAppState);
    expect(find(states, 'withType').value).toEqual({
      withPrimitive: null,
      withPrimitiveDefault: 'default',
      withRequiredPrimitive: 'required default',
      withDefaultValue: 'another default',
      withShape: 'B',
      withEnumInArray: ['A'],
    });
  });
});
