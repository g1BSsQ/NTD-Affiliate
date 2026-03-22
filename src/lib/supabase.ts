import 'react-native-url-polyfill/auto';
import * as Keychain from 'react-native-keychain';
import { createClient } from '@supabase/supabase-js';
import { Config } from './config';

const SecureStorageAdapter = {
  getItem: async (key: string) => {
    try {
      const credentials = await Keychain.getGenericPassword({ service: key });
      if (credentials) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error('Keychain get error', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await Keychain.setGenericPassword(key, value, { service: key });
    } catch (error) {
      console.error('Keychain set error', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await Keychain.resetGenericPassword({ service: key });
    } catch (error) {
      console.error('Keychain remove error', error);
    }
  },
};

export const supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
