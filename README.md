# rn-responsive-stylesheet

Cross-platform styling for react-native and react-native-web

## Installation

```sh
yarn add rn-responsive-stylesheet
```

## Setup

You'll need to wrap your app with `StyleProvider`. If you are using typescript, you will also
need to use module augmentation to add your properties to the theme and breakpoint object.

```tsx
import { StyleProvider } from 'rn-responsive-stylesheet';

const theme = {
  colors: {
    primary: "#F9F",
    secondary: "#FF9",
  },
} as const

type ThemeType = typeof theme

const breakpoints = {
  xs: 0,
  sm: 300,
  md: 500,
  lg: 800,
  xl: 1200,
} as const

type BreakpointsType = typeof breakpoints

declare module "rn-responsive-stylesheet" {
  export interface Theme extends ThemeType {}
  export interface Breakpoints extends BreakpointsType {}
}

const App = () => {
  return (
     <StyleProvider theme={theme} breakpoints={breakpoints}>
      {children}
    </StyleProvider>
  );
};

const AppContainer = () => {
  const styles = useStyles()

  return <View style={styles.container} />
};

const useStyles = createStyleSheet(() => ({
  container: () => ({
    ...
  }),
}))
```

## Usage

### Basic example

```jsx
import { View, Text } from 'react-native';

import { useBreakpointStyles } from 'rn-responsive-stylesheet';

export const MyComponent = () => {
  const styles = useStyles()

  return (
    <>
      <View style={styles.container}>
        <View style={styles.box}>
          <Text>Hello</Text>
        </View>
      </View>
    </>
  );
};

const useStyles = const useStyles = createStyleSheet(() => ({
  container: () => ({
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  }),
  box: {
    alignItems: "center",
    justifyContent: "center",
    width: 200,
    height: 200,
    backgroundColor: "#F9F",
  },
}))
```

### Advanced example

```jsx
import { View, Text, useColorScheme } from 'react-native';

import { useBreakpointStyles } from 'rn-responsive-stylesheet';

export const MyComponent = () => {
  const styles = useStyles()

  const isDark = useColorScheme() === "dark"

  return (
    <>
      <View style={styles.container(isDark)}>
        <View style={styles.box}>
          <Text>Hello</Text>
        </View>
      </View>
    </>
  );
};

const useStyles = const useStyles = createStyleSheet((theme, { vw, vh }) => ({
  container: (isDark: boolean) => ({
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDark ? "#000" : "#FFF"
  }),
  box: {
    alignItems: "center",
    justifyContent: "center",
    width: vw(20),
    height: vh(20),
    backgroundColor: {
      xs: theme.colors.secondary,
      md: theme.colors.primary,
    },
  },
}))
```

## Server Side Rendering (SSR)

### Next (Next 13 and up)

```tsx
import { ReactNode, useMemo } from 'react';
import { useServerInsertedHTML } from 'next/navigation';

import { getStyleElement } from 'rn-responsive-stylesheet';

interface RootProviderProps {
  children: React.ReactNode;
}

const RootProvider = ({ children }: RootProviderProps) => {
  useServerInsertedHTML(() => {
    return getStyleElement();
  });

  return <>{children}</>;
};
```

## Details

### Server Rendering

When rendering on the server, the component's styles are replaced with CSS custom properties. Media queries are generated for the breakpoints and output the CSS for the custom properties.

### Web Rendering

#### Pre-hydration

Component styles are rendered using CSS custom properties.

#### Post-hydration

Component styles are rendered using style objects and can be dynamic.

### Native Rendering

Component styles are rendered using style objects and can be dynamic.
