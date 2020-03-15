const format = (value: number): string =>
  `€ ${Number(value.toFixed(2)).toLocaleString(undefined, {
    minimumFractionDigits: 2
  })}`;

export default {
  format
};
