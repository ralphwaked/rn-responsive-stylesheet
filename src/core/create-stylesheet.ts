'use client';

import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { deepMerge } from '../utils/deepmerge';

import { useConfig, type Breakpoints } from '../config';
import type {
  ExtendedStyleSheet,
  ReactNativeStyleSheet,
  StyleSheet,
  StyleValues,
} from '../types';
import { units } from './units';
import { useDimensionsWithEnable } from './use-dimensions-with-enable';
import { generateHash } from '../utils/generate-hash';
import { camelToKebab, convertValue } from '../utils/string';
import { insert, textContentMap } from './inject-web-styles';

export const createStyleSheet = <S extends ExtendedStyleSheet>(
  stylesheet: S
): (() => ReactNativeStyleSheet<S>) => {
  return () => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
      setMounted(true);
    }, []);

    const { theme, breakpoints } = useConfig();

    const { width } = useDimensionsWithEnable({
      enable: Platform.OS !== 'web' || (Platform.OS === 'web' && mounted),
    });

    const parsedStyles = useMemo(
      () =>
        typeof stylesheet === 'function'
          ? stylesheet(theme, units(mounted))
          : stylesheet,
      [theme, mounted]
    );

    const cssClass = parsedStyles
      ? `responsive-${generateHash(JSON.stringify(parsedStyles))}`
      : undefined;

    const styles = useMemo(() => {
      const entries = Object.entries(parsedStyles);

      return entries.reduce<ReactNativeStyleSheet<S>>((acc, cur) => {
        const key = cur[0];
        const value = cur[1] as StyleSheet[number];

        if (typeof value === 'function') {
          return deepMerge(acc, {
            [key]: new Proxy(value, {
              apply: (target, thisArg, argArray) => {
                const parsed = parseStyleValues(
                  target.apply(thisArg, argArray),
                  breakpoints
                );

                if (Platform.OS !== 'web' || mounted) {
                  return getResponsiveStyle(parsed, breakpoints, width);
                } else {
                  return getServerResponsiveStyle(
                    parsed,
                    cssClass,
                    breakpoints
                  );
                }
              },
            }),
          }) as unknown as ReactNativeStyleSheet<S>;
        } else {
          const parsed = parseStyleValues(value, breakpoints);

          if (Platform.OS !== 'web' || mounted) {
            return deepMerge(acc, {
              [key]: getResponsiveStyle(parsed, breakpoints, width),
            }) as unknown as ReactNativeStyleSheet<S>;
          } else {
            return deepMerge(acc, {
              [key]: getServerResponsiveStyle(parsed, cssClass, breakpoints),
            }) as unknown as ReactNativeStyleSheet<S>;
          }
        }
      }, {} as ReactNativeStyleSheet<S>);
    }, [breakpoints, parsedStyles, width, mounted, cssClass]);

    return styles;
  };
};

const getServerResponsiveStyle = (
  parsed: ParsedStyleValues<StyleValues>,
  cssClass: string | undefined,
  breakpoints: Breakpoints
) => {
  const classSelector = `.${cssClass}`;

  if (parsed.initial) {
    const cssString = Object.entries(parsed.initial ?? {})
      .map(
        ([subKey, subValue]) =>
          `${camelToKebab(subKey)}: ${convertValue(subValue)};`
      )
      .join('\n');

    const rule = `${classSelector}{${cssString}}`;

    if (rule) {
      insert(rule);
      textContentMap[rule] = true;
    }
  }

  for (const query of Object.keys(parsed.queries)) {
    const queryValue = parsed.queries[query as keyof typeof parsed.queries];

    const cssString = Object.entries(queryValue ?? {})
      .map(
        ([subKey, subValue]) =>
          `${camelToKebab(subKey)}: ${convertValue(subValue)};`
      )
      .join('\n');

    const rule = `${classSelector}{${cssString}}`;

    const cssRuleWithMediaQuery = breakpoints[query as keyof Breakpoints]
      ? `@media only screen and (min-width: ${
          breakpoints[query as keyof Breakpoints]
        }px) { ${rule} }`
      : undefined;

    if (cssRuleWithMediaQuery) {
      insert(cssRuleWithMediaQuery);
      textContentMap[cssRuleWithMediaQuery] = true;
    }
  }

  return [{ $$css: true, responsiveStyles: cssClass } as any];
};

const getResponsiveStyle = (
  parsed: ParsedStyleValues<StyleValues>,
  breakpoints: Breakpoints,
  width: number
) => {
  return deepMerge(
    parsed.initial,
    Object.keys(parsed.queries)
      .sort(
        (a, b) =>
          breakpoints[a as keyof Breakpoints] -
          breakpoints[b as keyof Breakpoints]
      )
      .reduce((subAcc, subCur) => {
        const subValue = parsed.queries[subCur as keyof typeof parsed.queries];

        if (breakpoints[subCur as keyof Breakpoints] <= width) {
          return deepMerge(subAcc, subValue ?? {});
        }

        return subAcc;
      }, {})
  );
};

export const isPlatformColor = <T extends {}>(value: T): boolean => {
  if (Platform.OS === 'web') {
    return 'semantic' in value && typeof value.semantic === 'object';
  }

  return (
    Platform.OS === 'android' &&
    'resource_paths' in value &&
    typeof value.resource_paths === 'object'
  );
};

type ParsedStyleValues<T> = {
  initial: T;
} & {
  queries: {
    [Breakpoint in keyof Breakpoints]?: T;
  };
};

export const parseStyleValues = <T>(
  style: T,
  breakpoints: Breakpoints
): ParsedStyleValues<T> => {
  return Object.keys(style ?? {}).reduce<ParsedStyleValues<T>>(
    (acc, cur) => {
      const value = style[cur as keyof typeof style];

      if (!value) {
        return acc;
      }

      if (typeof value !== 'object' || isPlatformColor(value)) {
        acc.initial = { ...acc.initial, [cur]: value };

        return acc;
      }

      if (cur === 'shadowOffset' || cur === 'textShadowOffset') {
        const parsed = parseStyleValues(
          value,
          breakpoints
        ) as ParsedStyleValues<T>;

        return deepMerge(acc, {
          initial: { [cur]: parsed.initial },
          queries: Object.keys(parsed.queries).reduce<
            ParsedStyleValues<T>['queries']
          >(
            (subAcc, subCur) => {
              return {
                ...(subAcc ?? {}),
                [subCur]: {
                  ...((subAcc[subCur as keyof typeof subAcc] as {}) ?? {}),
                  [cur]: {
                    ...((parsed.queries[subCur as keyof Breakpoints] as {}) ??
                      {}),
                  },
                },
              };
            },
            {} as ParsedStyleValues<T>['queries']
          ),
        }) as ParsedStyleValues<T>;
      }

      if (cur === 'transform' && Array.isArray(value)) {
        value.map((subValue) => {
          const parsed = parseStyleValues(
            subValue,
            breakpoints
          ) as ParsedStyleValues<T>;

          return deepMerge(acc, {
            initial: { [cur]: parsed.initial },
            queries: {},
          }) as ParsedStyleValues<T>;
        });
      }

      for (const breakpoint of Object.keys(value)) {
        const subValue = value[breakpoint as keyof typeof value];

        if (breakpoint in breakpoints) {
          acc.queries = {
            ...acc.queries,
            [breakpoint]: {
              ...((acc.queries[breakpoint as keyof Breakpoints] as {}) ?? {}),
              [cur]: subValue,
            },
          };
        }
      }

      return acc;
    },
    { initial: {}, queries: {} } as ParsedStyleValues<T>
  );
};
