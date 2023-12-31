import type {
  ImageStyle as RNImageStyle,
  TextStyle as RNTextStyle,
  ViewStyle as RNViewStyle,
} from 'react-native';
import type {
  MatrixTransform,
  PerpectiveTransform,
  RotateTransform,
  RotateXTransform,
  RotateYTransform,
  RotateZTransform,
  ScaleTransform,
  ScaleXTransform,
  ScaleYTransform,
  SkewXTransform,
  SkewYTransform,
  TranslateXTransform,
  TranslateYTransform,
} from 'react-native/Libraries/StyleSheet/StyleSheetTypes';
import type { Config } from './core/config';

export interface StyledUtils {
  em: (value: number) => number;
  rem: (value: number) => number;
  vh: (value: number) => number;
  vw: (value: number) => number;
  min: (...values: number[]) => number;
  max: (...values: number[]) => number;
  calc: (
    first: number,
    operator: '+' | '-' | '*' | '/',
    second: number
  ) => number;
}

export type ShadowOffset = {
  width: number;
  height: number;
};

export type TransformStyles = PerpectiveTransform &
  RotateTransform &
  RotateXTransform &
  RotateYTransform &
  RotateZTransform &
  ScaleTransform &
  ScaleXTransform &
  ScaleYTransform &
  TranslateXTransform &
  TranslateYTransform &
  SkewXTransform &
  SkewYTransform &
  MatrixTransform;

type NestedKeys = 'shadowOffset' | 'transform' | 'textShadowOffset';

type ViewStyle = Omit<RNViewStyle, NestedKeys>;
type TextStyle = Omit<RNTextStyle, NestedKeys>;
type ImageStyle = Omit<RNImageStyle, NestedKeys>;

export type ToResponsive<T> = {
  [K in keyof T]?:
    | T[K]
    | {
        // @ts-ignore
        [key in keyof Config['breakpoints']]?: T[K];
      };
};

type NestedStyles = {
  shadowOffset?: ToResponsive<ShadowOffset>;
  textShadowOffset?: ToResponsive<ShadowOffset>;
  transform?: Array<ToResponsive<TransformStyles>>;
};

export type NativeStyles = ViewStyle & TextStyle & ImageStyle;
export type NativeStyle = ViewStyle | TextStyle | ImageStyle;

export type AllStyles = NativeStyles & NestedStyles;
export type AllStyleKeys = keyof NativeStyles;
export type AllStyleValues = NativeStyles[AllStyleKeys];

export type StyleValues = {
  [propName in AllStyleKeys]?:
    | AllStyles[propName]
    | {
        // @ts-ignore
        [key in keyof Config['breakpoints']]?: AllStyles[propName];
      };
} & {
  [nestedPropName in NestedKeys]?: NestedStyles[nestedPropName];
};

export type StyleValuesWithQuery = {
  initial: AllStyles;
  query: {
    minWidth: number;
    style: AllStyles;
  }[];
};

export type StyleList<T> =
  | T
  | undefined
  | null
  | false
  | ReadonlyArray<StyleList<T>>;

export type StyleSheet = {
  [styleName: string]:
    | StyleList<StyleValues>
    | ((...args: any) => StyleList<StyleValues>);
};

export type ExtendedStyleSheet =
  // @ts-ignore
  ((theme: Config['theme'], utils: StyledUtils) => StyleSheet) | StyleSheet;

type ParseNestedObject<T> = T extends (...args: infer A) => any
  ? (...args: A) => NativeStyle
  : NativeStyle;

type ParseStyleKeys<T> = T extends object
  ? { [K in keyof T]: ParseNestedObject<T[K]> }
  : never;

export type ReactNativeStyleSheet<T> = T extends (
  // @ts-ignore
  theme: Config['theme'],
  utils: StyledUtils
) => infer R
  ? ParseStyleKeys<R>
  : ParseStyleKeys<T>;
