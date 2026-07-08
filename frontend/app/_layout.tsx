import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StoreProvider } from '../src/store';
import { colors } from '../src/theme';

function TabsNav() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 64 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Özet',
          tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart" size={size} color={color} />,
          tabBarTestID: 'tab-ozet',
        }}
      />
      <Tabs.Screen
        name="cariler"
        options={{
          href: null, // Alt tab bardan gizli — üstteki hızlı erişimden ulaşılır
        }}
      />
      <Tabs.Screen
        name="kartlar"
        options={{
          title: 'Kartlar',
          tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} />,
          tabBarTestID: 'tab-kartlar',
        }}
      />
      <Tabs.Screen
        name="bankalar"
        options={{
          title: 'Bankalar',
          tabBarIcon: ({ color, size }) => <Ionicons name="business" size={size} color={color} />,
          tabBarTestID: 'tab-bankalar',
        }}
      />
      <Tabs.Screen
        name="kasa"
        options={{
          href: null, // Alt tab bardan gizli — üstteki hızlı erişimden ulaşılır
        }}
      />
      <Tabs.Screen
        name="genel-durum"
        options={{
          href: null, // Alt tab bardan gizli — üstteki hızlı erişimden ulaşılır
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });

  // Fontlar yüklenirken splash göster; hata olursa yine de uygulamayı aç (font olmadan)
  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.textPrimary} />
        <Text style={styles.splashText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <StatusBar style="dark" />
          <TabsNav />
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSecondary,
    gap: 12,
  },
  splashText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
