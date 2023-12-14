import { useEffect, useState } from 'react';
import { Dimensions, type ScaledSize } from 'react-native';

export function useDimensionsWithEnable({ enable }: { enable?: boolean }) {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    if (enable) {
      function handleChange({ window }: { window: ScaledSize }) {
        if (
          dimensions.width !== window.width ||
          dimensions.height !== window.height ||
          dimensions.scale !== window.scale ||
          dimensions.fontScale !== window.fontScale
        ) {
          setDimensions(window);
        }
      }

      const listener = Dimensions.addEventListener('change', handleChange);

      handleChange({ window: Dimensions.get('window') });

      return () => {
        listener.remove();
      };
    }
    return () => {};
  }, [dimensions, enable]);

  return dimensions;
}
