import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { initializeAuth } from '../store/slices/authSlice';
import { onAuthStateChange } from '../services/supabaseAuthService';

export const useAuthInitialization = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Initialize auth state on app startup
    dispatch(initializeAuth());

    // Set up Supabase auth state listener
    const { data: { subscription } } = onAuthStateChange((user) => {
      // This will be handled by the auth state listener in the service
      // We don't need to dispatch here as it's already handled in the service
    });

    // Cleanup function
    return () => {
      subscription?.unsubscribe();
    };
  }, [dispatch]);

  return {
    isAuthenticated,
    user,
    isLoading,
    isInitialized: !isLoading, // Auth is initialized when not loading
  };
};

export default useAuthInitialization;