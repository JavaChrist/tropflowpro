import { useState, useEffect } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile, UserSubscription, PlanType } from '../types';

// Fonction pour créer un abonnement gratuit par défaut
const createDefaultSubscription = (): UserSubscription => {
  const now = new Date().toISOString();
  return {
    planId: 'free' as PlanType,
    status: 'active',
    currentPeriodStart: now,
    currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 an
    tripsUsed: 0,
    createdAt: now,
    updatedAt: now
  };
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true; // Pour éviter les fuites mémoire

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

      if (mounted) {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []); // Aucune dépendance pour éviter les boucles

  const loadUserProfile = async (uid: string, firebaseUser?: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile;

        // Migration : Si le profil n'a pas d'abonnement, l'ajouter
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
        // Créer automatiquement le profil manquant avec abonnement gratuit
        const defaultProfile: UserProfile = {
          uid: uid,
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
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      setError('Erreur lors du chargement du profil utilisateur');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: any) {
      let errorMessage = 'Erreur de connexion';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Aucun compte trouvé avec cet email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Mot de passe incorrect';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Adresse email invalide';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Email ou mot de passe incorrect';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Trop de tentatives. Réessayez plus tard';
          break;
        default:
          errorMessage = 'Erreur de connexion inattendue';
      }
      setError(errorMessage);
      throw error;
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
      const user = result.user;

      // Mettre à jour le nom d'affichage
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });

      // Créer le profil utilisateur dans Firestore avec abonnement gratuit
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: `${firstName} ${lastName}`,
        contractNumber,
        firstName,
        lastName,
        subscription: createDefaultSubscription(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      // Forcer le rechargement du profil pour s'assurer qu'il est bien sauvegardé
      await loadUserProfile(user.uid, user);

      setUserProfile(userProfile);

      return user;
    } catch (error: any) {
      let errorMessage = 'Erreur lors de la création du compte';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Un compte existe déjà avec cet email';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Adresse email invalide';
          break;
        case 'auth/weak-password':
          errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
          break;
      }
      setError(errorMessage);
      throw error;
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

      // Mettre à jour le nom d'affichage Firebase si nécessaire
      if (updates.firstName || updates.lastName) {
        await updateProfile(user, {
          displayName: `${updatedProfile.firstName} ${updatedProfile.lastName}`
        });
      }

      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      setError('Erreur lors de la mise à jour du profil');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserSubscription = async (subscription: UserSubscription) => {
    if (!user || !userProfile) return;

    try {
      setIsLoading(true);
      setError(null);

      const updatedProfile: UserProfile = {
        ...userProfile,
        subscription,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'users', user.uid), updatedProfile as any);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
      setError('Erreur lors de la mise à jour de l\'abonnement');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const incrementTripsUsed = async () => {
    if (!user || !userProfile) return;

    const updatedSubscription: UserSubscription = {
      ...userProfile.subscription,
      tripsUsed: userProfile.subscription.tripsUsed + 1,
      updatedAt: new Date().toISOString()
    };

    await updateUserSubscription(updatedSubscription);
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      setError('Erreur lors de la déconnexion');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    user,
    userProfile,
    isLoading,
    error,
    signIn,
    signUp,
    updateUserProfile,
    updateUserSubscription,
    incrementTripsUsed,
    logout,
    clearError,
    isAuthenticated: !!user // Authentifié si Firebase user existe, indépendamment du profil
  };
};

export default useAuth; 