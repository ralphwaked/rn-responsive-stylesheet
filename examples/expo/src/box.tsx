import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import type { ViewProps } from 'react-native';
import { createStyleSheet } from 'rn-responsive-stylesheet';

export interface BoxStyleProps {
  centered?: boolean;
  sideBorders?: boolean;
}

export interface BoxProps extends ViewProps, BoxStyleProps {}

export const processStyleList = (styleList: any): Partial<any> => {
  if (Array.isArray(styleList)) {
    return styleList.reduce(
      (acc, x) => ({ ...acc, ...processStyleList(x) }),
      {}
    );
  }

  return styleList ? styleList : {};
};

const Box = forwardRef(function (
  { centered, sideBorders, ...props }: BoxProps,
  ref: any
) {
  const styles = useBoxStyles().box;

  const style = useMemo(() => {
    return processStyleList([
      ...(Array.isArray(props.style)
        ? (props.style as any)
        : ([props.style] as any)),
      ...(Array.isArray(styles({ centered, sideBorders }))
        ? (styles({ centered, sideBorders }) as any)
        : ([styles({ centered, sideBorders })] as any)),
    ]);
  }, [props.style, styles, centered, sideBorders]);

  console.log({ style });

  return <View {...props} style={style} ref={ref} />;
});

Box.displayName = 'Box';

const useBoxStyles = createStyleSheet((theme) => ({
  box: ({ centered, sideBorders }: BoxStyleProps) => ({
    ...(centered
      ? {
          justifyContent: 'center',
          alignItems: 'center',
        }
      : {}),
    ...(sideBorders
      ? {
          borderLeftWidth: 10,
          borderRightWidth: 100,
          border: theme.colors.backgroundDark0,
        }
      : {}),
  }),
}));

export { Box };
