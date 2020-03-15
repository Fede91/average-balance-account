const get = (key: string): string | null => localStorage.getItem(key);

const set = (key: string, value: string) => localStorage.setItem(key, value);

export default {
  get,
  set
};
