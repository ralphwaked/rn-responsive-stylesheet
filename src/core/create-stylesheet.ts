'use client';

import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { deepMerge } from '../utils/deepmerge';

import { useConfig, type Config } from './config';
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

    const { isDark, theme, breakpoints, colorVars } = useConfig();

    const { width, height } = useDimensionsWithEnable({
      enable: Platform.OS !== 'web' || (Platform.OS === 'web' && mounted),
    });

    const parsedStyles = useMemo(
      () =>
        typeof stylesheet === 'function'
          ? stylesheet(theme, units(mounted, { width, height }))
          : stylesheet,
      [theme, mounted, width, height]
    );

    const styles = useMemo(() => {
      const entries = Object.entries(parsedStyles);

      return entries.reduce<ReactNativeStyleSheet<S>>((acc, cur) => {
        const key = cur[0];
        const value = cur[1] as StyleSheet[number];

        const cssClass = parsedStyles
          ? `responsive-${generateHash(JSON.stringify({ parsedStyles, key }))}`
          : undefined;

        if (typeof value === 'function') {
          return deepMerge(acc, {
            [key]: new Proxy(value, {
              apply: (target, thisArg, argArray) => {
                const parsed = parseStyleValues(
                  target.apply(thisArg, argArray),
                  breakpoints,
                  colorVars,
                  mounted,
                  isDark
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
          const parsed = parseStyleValues(
            value,
            breakpoints,
            colorVars,
            mounted,
            isDark
          );

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
    }, [breakpoints, parsedStyles, width, colorVars, mounted, isDark]);

    return styles;
  };
};

const getServerResponsiveStyle = (
  parsed: ParsedStyleValues<StyleValues>,
  cssClass: string | undefined,
  // @ts-ignore
  breakpoints: Config['breakpoints']
) => {
  const classSelector = `.${cssClass}`;

  if (parsed.initial) {
    const cssString = Object.entries(parsed.initial ?? {})
      .map(
        ([subKey, subValue]) =>
          `${camelToKebab(subKey)}: ${convertValue(subValue)} !important;`
      )
      .join('\n');

    const rule = `${classSelector}{${cssString}}`;

    if (rule) {
      insert(rule);
      textContentMap[rule] = true;
    }
  }

  for (const query of Object.keys(parsed.queries)) {
    // @ts-ignore
    const queryValue = parsed.queries[query as keyof Config['breakpoints']];

    const cssString = Object.entries(queryValue ?? {})
      .map(
        ([subKey, subValue]) =>
          `${camelToKebab(subKey)}: ${convertValue(subValue)} !important;`
      )
      .join('\n');

    const rule = `${classSelector}{${cssString}}`;

    const cssRuleWithMediaQuery = breakpoints[
      // @ts-ignore
      query as keyof Config['breakpoints']
    ]
      ? `@media only screen and (min-width: ${
          // @ts-ignore
          breakpoints[query as keyof Config['breakpoints']]
        }px) { ${rule} }`
      : undefined;

    if (cssRuleWithMediaQuery) {
      insert(cssRuleWithMediaQuery);
      textContentMap[cssRuleWithMediaQuery] = true;
    }
  }

  return [{ $$css: true, [cssClass as string]: cssClass } as any];
};

const getResponsiveStyle = (
  parsed: ParsedStyleValues<StyleValues>,
  // @ts-ignore
  breakpoints: Config['breakpoints'],
  width: number
) => {
  return deepMerge(
    parsed.initial,
    Object.keys(parsed.queries)
      .sort(
        (a, b) =>
          // @ts-ignore
          breakpoints[a as keyof Config['breakpoints']] -
          // @ts-ignore
          breakpoints[b as keyof Config['breakpoints']]
      )
      .reduce((subAcc, subCur) => {
        // @ts-ignore
        const subValue = parsed.queries[subCur as keyof Config['breakpoints']];

        // @ts-ignore
        if (breakpoints[subCur as keyof Config['breakpoints']] <= width) {
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
    // @ts-ignore
    [Breakpoint in keyof Config['breakpoints']]?: T;
  };
};

const extractValueFromVar = (value: string) => {
  const match = /var\(\s*--([^)\s]+)\s*\)/.exec(value);

  return match ? match[1] : null;
};

export const parseStyleValues = <T extends StyleSheet[number]>(
  style: T,
  // @ts-ignore
  breakpoints: Config['breakpoints'],
  // @ts-ignore
  vars: Config['colorVars'],
  mounted: boolean,
  isDark?: boolean
): ParsedStyleValues<T> => {
  const fixColorValue = (value: any) => {
    if (typeof value === 'string' && value.startsWith('var(--')) {
      if (mounted) {
        const val = extractValueFromVar(value);

        // @ts-ignore
        const colorVar = vars[val as keyof Config['colorVars']];

        if (typeof colorVar === 'object') {
          return isDark ? colorVar.dark : colorVar.light;
        } else {
          return colorVar;
        }
      } else {
        return value;
      }
    }

    return value;
  };

  return Object.keys(style ?? {}).reduce<ParsedStyleValues<T>>(
    (acc, cur) => {
      const value = style[cur as keyof typeof style];

      if (!value) {
        return acc;
      }

      if (typeof value !== 'object' || isPlatformColor(value)) {
        acc.initial = { ...acc.initial, [cur]: fixColorValue(value) };

        return acc;
      }

      if (cur === 'shadowOffset' || cur === 'textShadowOffset') {
        const parsed = parseStyleValues(
          value,
          breakpoints,
          vars,
          mounted,
          isDark
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
                  // @ts-ignore
                  ...((subAcc[subCur as keyof Config['breakpoints']] as {}) ??
                    {}),
                  [cur]: {
                    ...((parsed.queries[
                      // @ts-ignore
                      subCur as keyof Config['breakpoints']
                    ] as {}) ?? {}),
                  },
                },
              } as any;
            },
            {} as ParsedStyleValues<T>['queries']
          ),
        }) as ParsedStyleValues<T>;
      }

      if (cur === 'transform' && Array.isArray(value)) {
        value.map((subValue) => {
          const parsed = parseStyleValues(
            subValue,
            breakpoints,
            vars,
            mounted,
            isDark
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
          const is0 =
            // @ts-ignore
            breakpoints[breakpoint as keyof Config['breakpoints']] === 0;

          if (is0) {
            acc.initial = { ...acc.initial, [cur]: fixColorValue(subValue) };

            continue;
          }

          acc.queries = {
            ...acc.queries,
            [breakpoint]: {
              ...((acc.queries[
                // @ts-ignore
                breakpoint as keyof Config['breakpoints']
              ] as {}) ?? {}),
              [cur]: fixColorValue(subValue),
            },
          } as any;
        }
      }

      return acc;
    },
    { initial: {}, queries: {} } as ParsedStyleValues<T>
  );
};
