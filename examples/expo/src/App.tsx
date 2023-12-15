import * as React from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';

import {
  StyleProvider,
  createStyleSheet,
  createConfig,
  useTheme,
} from 'rn-responsive-stylesheet';

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <StyleProvider colorScheme={colorScheme ?? 'light'} config={config}>
      <Component />
    </StyleProvider>
  );
}

export function Component() {
  const styles = useStyles();
  const theme = useTheme();

  const [active, setActive] = React.useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text>Works: {theme.colors.tets}</Text>
      </View>
      <Pressable
        style={styles.button({ active })}
        onPressIn={() => setActive(true)}
        onPressOut={() => setActive(false)}
      >
        <Text>active: {active.toString()}</Text>
      </Pressable>
    </View>
  );
}

const useStyles = createStyleSheet((theme, { vw, vh }) => ({
  container: {
    flex: 1,
    width: vw(100),
    height: vh(100),
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    width: vw(50),
    height: 200,
    shadowOffset: {
      height: {
        xs: 200,
        md: 400,
      },
      width: 200,
    },
    backgroundColor: {
      xs: theme.colors.primary0,
      md: theme.colors.primary,
    },
  },
  button: ({ active }: { active: boolean }) => ({
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 150,
    backgroundColor: active ? theme.colors.primary : theme.colors.tets,
  }),
}));

const config = createConfig({
  colorVars: {
    primary: '#F9F',
    secondary: {
      light: '#FF9',
      dark: '#AA9',
    },
  },
  breakpoints: {
    xs: 0,
    sm: 300,
    md: 500,
    lg: 800,
    xl: 1200,
  },
  theme: {
    colors: {
      primary: '#F9F',
      secondary: '#FF9',
      tets: 'var(--secondary)',
    },
  },
});

type ConfigType = typeof config;

declare module 'rn-responsive-stylesheet' {
  export interface Config extends ConfigType {}
}
