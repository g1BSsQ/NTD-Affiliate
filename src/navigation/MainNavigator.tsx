import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';
import HomeScreen from '../screens/home/HomeScreen';
import ShopScreen from '../screens/shop/ShopScreen';
import NetworkScreen from '../screens/network/NetworkScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { Colors } from '../constants/colors';
import { FontSize } from '../constants/typography';

export type MainTabParamList = {
  Home: undefined;
  Shop: undefined;
  Network: undefined;
  Wallet: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon = ({ label, emoji, focused }: { label: string; emoji: string; focused: boolean }) => (
  <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
);

export const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.tertiary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ focused }) => <TabIcon label="Trang chủ" emoji="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Shop"
        component={ShopScreen}
        options={{
          title: 'Mua hàng',
          tabBarIcon: ({ focused }) => <TabIcon label="Mua hàng" emoji="🛍️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Network"
        component={NetworkScreen}
        options={{
          title: 'Mạng lưới',
          tabBarIcon: ({ focused }) => <TabIcon label="Mạng lưới" emoji="🌐" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          title: 'Ví tiền',
          tabBarIcon: ({ focused }) => <TabIcon label="Ví tiền" emoji="💰" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ focused }) => <TabIcon label="Hồ sơ" emoji="💳" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 0,
    elevation: 16,
    shadowColor: '#1A3C6E',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    height: 72,
    paddingBottom: 10,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginTop: 2,
  },
});
