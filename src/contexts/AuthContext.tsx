import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile, UserSubscription, PlanType } from '../types';

const createDefaultSubscription = (): UserSubscription => ({
  planId: 'free' as PlanType,
  status: 'active',
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  tripsUsed: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<User | undefined>;
  signUp: (email: string, password: string, firstName: string, lastName: string, contractNumber: string) => Promise<User | undefined>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateUserSubscription: (subscription: UserSubscription) => Promise<void>;
  incrementTripsUsed: () => Promise<void>;
  cancelSubscription: () => Promise<boolean>;
  deleteAccount: (password?: string) => Promise<boolean>;
  clearError: () => void;
  refreshUserProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserProfile = async (uid: string, firebaseUser?: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile;
        if (!profileData.subscription) {
          const updatedProfile: UserProfile = {
            ...profileData,
            subscription: createDefaultSubscription(),
            updatedAt: new Date().toISOString()
          };
          await updateDoc(doc(db, 'users', uid), updatedProfile as any);
          setUserProfile(updatedProfile);
        } else {
          setUserProfile(profileData);
        }
      } else {
        const defaultProfile: UserProfile = {
          uid,
          email: firebaseUser?.email || '',
          displayName: firebaseUser?.displayName || 'Utilisateur',
          contractNumber: 'À_RENSEIGNER',
          firstName: firebaseUser?.displayName?.split(' ')[0] || 'Prénom',
          lastName: firebaseUser?.displayName?.split(' ')[1] || 'Nom',
          subscription: createDefaultSubscription(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', uid), defaultProfile);
        setUserProfile(defaultProfile);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du profil:', err);
      setError('Erreur lors du chargement du profil utilisateur');
    }
  };

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;
      setIsLoading(true);
      setError(null);
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadUserProfile(firebaseUser.uid, firebaseUser);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      if (mounted) setIsLoading(false);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err: unknown) {
      const e = err as { code?: string };
      const messages: Record<string, string> = {
        'auth/user-not-found': 'Aucun compte trouvé',
        'auth/wrong-password': 'Mot de passe incorrect',
        'auth/invalid-credential': 'Email ou mot de passe incorrect',
        'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard'
      };
      setError(messages[e.code || ''] || 'Erreur de connexion');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    contractNumber: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = result.user;
      await updateProfile(newUser, { displayName: `${firstName} ${lastName}` });
      const profile: UserProfile = {
        uid: newUser.uid,
        email: newUser.email!,
        displayName: `${firstName} ${lastName}`,
        contractNumber,
        firstName,
        lastName,
        subscription: createDefaultSubscription(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', newUser.uid), profile);
      await loadUserProfile(newUser.uid, newUser);
      return newUser;
    } catch (err: unknown) {
      const e = err as { code?: string };
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'Cet email est déjà utilisé',
        'auth/weak-password': 'Mot de passe trop faible'
      };
      setError(messages[e.code || ''] || 'Erreur lors de la création');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err) {
      setError('Erreur lors de l\'envoi de l\'email');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) return;
    try {
      setIsLoading(true);
      setError(null);
      const updatedProfile = {
        ...userProfile,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(doc(db, 'users', user.uid), updatedProfile as any);
      if (updates.firstName || updates.lastName) {
        await updateProfile(user, {
          displayName: `${updatedProfile.firstName} ${updatedProfile.lastName}`
        });
      }
      setUserProfile(updatedProfile);
    } catch (err) {
      console.error('Erreur mise à jour profil:', err);
      setError('Erreur lors de la mise à jour du profil');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserSubscription = async (subscription: UserSubscription) => {
    if (!user || !userProfile) return;
    try {
      setIsLoading(true);
      setError(null);
      const updatedProfile = {
        ...userProfile,
        subscription,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(doc(db, 'users', user.uid), updatedProfile as any);
      setUserProfile(updatedProfile);
    } catch (err) {
      console.error('Erreur mise à jour abonnement:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const incrementTripsUsed = async () => {
    if (!user || !userProfile) return;
    await updateUserSubscription({
      ...userProfile.subscription,
      tripsUsed: userProfile.subscription.tripsUsed + 1,
      updatedAt: new Date().toISOString()
    });
  };

  const cancelSubscription = async () => {
    if (!user || !userProfile) return false;
    try {
      setIsLoading(true);
      setError(null);
      if (userProfile.subscription.mollieSubscriptionId) {
        const res = await fetch('/api/mollie-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'cancel-subscription',
            subscriptionId: userProfile.subscription.mollieSubscriptionId,
            customerId: userProfile.subscription.mollieCustomerId
          })
        });
        if (!res.ok) throw new Error('Erreur Mollie');
      }
      const freeSub: UserSubscription = {
        planId: 'free' as PlanType,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        tripsUsed: userProfile.subscription.tripsUsed,
        createdAt: userProfile.subscription.createdAt,
        updatedAt: new Date().toISOString()
      };
      await updateUserSubscription(freeSub);
      return true;
    } catch (err) {
      console.error('Erreur annulation:', err);
      setError('Erreur lors de l\'annulation');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async (password?: string) => {
    if (!user || !userProfile) return false;
    try {
      setIsLoading(true);
      setError(null);
      if (user.email && password) {
        const cred = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, cred);
      }
      if (userProfile.subscription.mollieSubscriptionId) {
        await cancelSubscription();
      }
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
      return true;
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'auth/requires-recent-login') {
        setError('Entrez votre mot de passe pour confirmer votre identité.');
      } else if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setError('Mot de passe incorrect.');
      } else {
        setError('Erreur lors de la suppression');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    isLoading,
    error,
    signIn,
    signUp,
    signOut: logout,
    resetPassword,
    updateUserProfile,
    updateUserSubscription,
    incrementTripsUsed,
    cancelSubscription,
    deleteAccount,
    clearError: () => setError(null),
    refreshUserProfile: async () => { if (user) await loadUserProfile(user.uid, user); },
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
