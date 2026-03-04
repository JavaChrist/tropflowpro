import { useAuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const ctx = useAuthContext();
  return {
    ...ctx,
    logout: ctx.signOut
  };
};

export default useAuth;
