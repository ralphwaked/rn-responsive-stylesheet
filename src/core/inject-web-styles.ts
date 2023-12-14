import { createElement } from 'react';

let styleSheet: CSSStyleSheet | null;

export let textContentMap: any = {};

export const insert = (rule: string) => {
  if (typeof window !== 'undefined') {
    if (!styleSheet) {
      const styleElement = document.createElement('style');

      styleElement.type = 'text/css';
      styleElement.appendChild(document.createTextNode(''));

      document.head.appendChild(styleElement);

      styleSheet = styleElement.sheet;
    }

    styleSheet?.insertRule(rule, styleSheet.cssRules.length);
  }
};

export const getStyleElement = () => {
  return createElement('style', {
    id: 'rn-responsive-stylesheet',
    key: 'rn-responsive-stylesheet',
    type: 'text/css',
    dangerouslySetInnerHTML: { __html: Object.keys(textContentMap).join('') },
  });
};
