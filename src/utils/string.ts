export function camelToKebab(str: string) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function convertValue(value: unknown) {
  return isNaN(value as number) ? value : `${value}px`;
}
