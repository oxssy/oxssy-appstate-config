import { find } from 'oxssy-appstate';
import {
  ORequiredEnum,
  ORequiredString,
  ORequiredArrayOf,
  OString,
  config,
  shape,
  validates,
} from '../index';

class TestClass {}

describe('AppState config', () => {
  test('configuring AppStates', () => {
    const enumValue = ORequiredEnum(['A', 'B', 'C']).defaultsTo('B');

    const type = shape({
      withType: OString(),
      withRequiredType: ORequiredString().defaultsTo('default'),
      withDefaultValue: 'another default',
      withShape: enumValue,
      withEnumInArray: ORequiredArrayOf(enumValue),
    });

    const states = config({
      withType: type,
      withEnum: enumValue,
      withArray: [1, 2, 3],
      withArrayOfDifferentTypes: [1, 'string', {}],
      withClass: TestClass,
      withEmptyObject: {},
      nested: {
        nestedString: ORequiredString().defaultsTo('nested'),
        withNull: null,
      },
      validation: validates('withEnum'),
    });

    expect(find(states, 'withEnum').value).toBe('B');
    expect(find(states, 'withArray').value).toEqual([1, 2, 3]);
    expect(find(states, 'withArrayOfDifferentTypes').value).toEqual([1, 'string', {}]);
    expect(find(states, 'withClass').value).toBeNull();
    expect(find(states, 'withEmptyObject').value).toEqual({});
    expect(find(states, 'nested/nestedString').value).toBe('nested');
    expect(find(states, 'nested/withNull').value).toBeNull();
    expect(find(states, 'withType').value).toEqual({
      withType: null,
      withRequiredType: 'default',
      withDefaultValue: 'another default',
      withShape: 'B',
      withEnumInArray: null,
    });
  });
});
