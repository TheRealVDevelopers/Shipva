import type { ReactElement } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@shipva/ui';

export default function App(): ReactElement {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>ShipVa · Driver</Text>
      <Text style={styles.body}>
        Phase 1 scaffold. Implement: phone-OTP login, online/offline toggle, nearby
        jobs (FCM by zone+vehicle), atomic accept, navigate, status updates, place
        bids on auctions, backhaul return legs, POD capture, earnings & history.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { color: colors.neutral[0], fontSize: 26, fontWeight: '600', marginBottom: 12 },
  body: { color: colors.neutral[100], fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
