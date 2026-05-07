/* global jest */
jest.mock('@react-native-async-storage/async-storage', () => {
  let store = {};
  return {
    setItem: jest.fn(async (key, value) => {
      store[key] = String(value);
    }),
    getItem: jest.fn(async key => store[key] ?? null),
    removeItem: jest.fn(async key => {
      delete store[key];
    }),
    clear: jest.fn(async () => {
      store = {};
    }),
    getAllKeys: jest.fn(async () => Object.keys(store)),
    multiGet: jest.fn(async keys => keys.map(k => [k, store[k] ?? null])),
    multiSet: jest.fn(async pairs => {
      pairs.forEach(([k, v]) => {
        store[k] = v;
      });
    }),
    multiRemove: jest.fn(async keys => {
      keys.forEach(k => {
        delete store[k];
      });
    }),
  };
});
