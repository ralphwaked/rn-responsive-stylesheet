import * as React from 'react';
import { View, Text } from 'react-native';

import { StyleSheet } from 'rn-responsive-stylesheet';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Works</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
