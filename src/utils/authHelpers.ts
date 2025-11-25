// src/utils/authHelpers.ts
import supabase from './supabase';

export const checkAuthStatus = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error checking auth status:', error);
    return null;
  }
  return user;
};

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
  }
};
