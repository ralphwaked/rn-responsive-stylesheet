import { createContext, createElement, useContext, useMemo } from 'react';

import { DEFAULT_THEME, type ThemeType, type ColorValue } from './theme';
import type { DeepMergeTwoTypes } from './merge';
import { insert, textContentMap } from '../inject-web-styles';
import { Platform } from 'react-native';

type CreateConfig<
  V extends Record<
    string,
    ColorValue | { light: ColorValue; dark: ColorValue }
  >,
  B extends Record<string, number>,
  T extends ThemeType<V>,
> = {
  colorVars: V;
  breakpoints: B;
  theme: Required<DeepMergeTwoTypes<T, typeof DEFAULT_THEME>>;
};

export interface Config {}

export const ConfigContext = createContext<{
  isDark: boolean;
  colorVars: CreateConfig<any, any, any>['colorVars'];
  // @ts-ignore
  theme: Config['theme'];
  // @ts-ignore
  breakpoints: Config['breakpoints'];
}>(null!);

export const useConfig = () => {
  return useContext(ConfigContext);
};

// @ts-ignore
export const useTheme = (): Config['theme'] => {
  return useContext(ConfigContext).theme;
};

export const StyleProvider = ({
  colorScheme,
  config,
  children,
}: {
  colorScheme?: 'light' | 'dark';
  config: CreateConfig<any, any, any>;
  children?: React.ReactNode;
}) => {
  const context = useMemo(() => {
    if (Object.keys(config.colorVars).length > 0 && Platform.OS === 'web') {
      let rootVars = ':root { ';
      let darkVars = '.dark { ';

      for (const key of Object.keys(config.colorVars)) {
        const varValue = config.colorVars[key];

        if (typeof varValue === 'object') {
          rootVars = `${rootVars} --${key}: ${varValue.light};`;
          darkVars = `${darkVars} --${key}: ${varValue.dark};`;
        } else {
          rootVars = `${rootVars} --${key}: ${varValue};`;
        }
      }

      if (rootVars.length > 8) {
        const rule = `${rootVars} }`;

        insert(rule);
        textContentMap[rule] = true;
      }

      if (darkVars.length > 8) {
        const rule = `${darkVars} }`;

        insert(rule);
        textContentMap[rule] = true;
      }
    }

    return {
      isDark: colorScheme === 'dark',
      ...(config as any),
    };
  }, [colorScheme, config]);

  return createElement(ConfigContext.Provider, { value: context }, [children]);
};

export const createConfig = <
  V extends Record<
    string,
    ColorValue | { light: ColorValue; dark: ColorValue }
  >,
  B extends Record<string, number>,
  T extends ThemeType<V>,
>(config: {
  colorVars?: V;
  breakpoints: B;
  theme: T;
}): CreateConfig<V, B, T> => {
  for (const key of Object.keys(config.theme)) {
    config.theme[key as keyof ThemeType] = {
      ...DEFAULT_THEME[key as keyof typeof DEFAULT_THEME],
      ...config.theme[key as keyof ThemeType],
    } as any;
  }

  return config as any;
};
