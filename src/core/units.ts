import { Dimensions, PixelRatio, Platform } from 'react-native';

export const units = (mounted: boolean) => {
  const useLiteral = Platform.OS === 'web' && !mounted;

  const em = useLiteral
    ? (value: number): number => `${value}em` as unknown as number
    : (value: number): number => PixelRatio.getFontScale() * 16 * value;

  const rem = useLiteral
    ? (value: number): number => `${value}rem` as unknown as number
    : em;

  const vw = useLiteral
    ? (value: number): number => `${value}vw` as unknown as number
    : (value: number): number => (value * Dimensions.get('window').width) / 100;

  const vh = useLiteral
    ? (value: number): number => `${value}vh` as unknown as number
    : (value: number): number =>
        (value * Dimensions.get('window').height) / 100;

  const min = useLiteral
    ? (...values: number[]): number =>
        `min(${values.join(', ')})` as unknown as number
    : (...values: number[]): number => Math.min(...values);

  const max = useLiteral
    ? (...values: number[]): number =>
        `max(${values.join(', ')})` as unknown as number
    : (...values: number[]): number => Math.max(...values);

  const calc = useLiteral
    ? (
        first: number,
        operator: '+' | '-' | '*' | '/',
        second: number
      ): number => `calc(${first} ${operator} ${second})` as unknown as number
    : (
        first: number,
        operator: '+' | '-' | '*' | '/',
        second: number
      ): number => {
        switch (operator) {
          case '+':
            return first + second;
          case '-':
            return first - second;
          case '*':
            return first * second;
          case '/':
            return first / second;
        }
      };

  return {
    em,
    rem,
    vw,
    vh,
    min,
    max,
    calc,
  };
};
