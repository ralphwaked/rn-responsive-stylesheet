import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
} from 'react';

export interface Theme {}
export interface Breakpoints {}

export const ConfigContext = createContext<{
  mounted: boolean;
  theme: Theme;
  breakpoints: Breakpoints;
}>(null!);

export const useConfig = () => {
  return useContext(ConfigContext);
};

export const useTheme = (): Theme => {
  return useContext(ConfigContext).theme;
};

export const StyleProvider = ({
  theme,
  breakpoints,
  children,
}: {
  theme: Theme;
  breakpoints: Breakpoints;
  children?: React.ReactNode;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return createElement(
    ConfigContext.Provider,
    { value: { mounted, theme, breakpoints } },
    [children]
  );
};
