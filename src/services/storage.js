import store from 'store2';

export default {
  delete(key) {
    store.remove(key);

    return this;
  },

  get(key, defaultValue = null) {
    return store.get(key, defaultValue);
  },

  has(key) {
    return store.has(key);
  },

  set(key, value) {
    store.set(key, value);

    return this;
  },
};
