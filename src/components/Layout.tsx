import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Plus,
  Settings,
  MapPin,
  Menu,
  X,
  LogOut,
  User,
  Home,
  Crown
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import UserSettingsModal from './UserSettingsModal';
import ThemeToggle from './ThemeToggle';
import ConfirmModal from './ConfirmModal';
import InstallButton from './InstallButton';
import PlanModal from './PlanModal';
import { PlanType } from '../types';
import PlanService from '../services/planService';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [confirmLogout, setConfirmLogout] = React.useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = React.useState(false);
  const { userProfile, logout, updateUserSubscription } = useAuth();

  const navigation = [
    { name: 'Tableau de bord', href: '/', icon: Home },
    { name: 'Mes déplacements', href: '/trips', icon: MapPin },
    { name: 'Nouveau déplacement', href: '/trips/new', icon: Plus },
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    if (href === '/trips') {
      return location.pathname === '/trips';
    }
    if (href === '/trips/new') {
      return location.pathname === '/trips/new';
    }
    return location.pathname === href;
  };

  const handleLogoutClick = () => {
    setConfirmLogout(true);
  };

  const handleLogoutConfirm = async () => {
    await logout();
    setConfirmLogout(false);
  };

  const handleLogoutCancel = () => {
    setConfirmLogout(false);
  };

  const handleSelectPlan = async (planId: PlanType) => {
    if (!userProfile) return;

    try {
      if (planId === 'free') {
        // Rétrogradation vers le plan gratuit
        const freeSubscription = PlanService.createFreeSubscription();
        await updateUserSubscription(freeSubscription);
        console.log('✅ Plan mis à jour vers gratuit');
        setIsPlanModalOpen(false);
      } else {
        // Pour les plans premium, rediriger vers la page appropriée pour configurer le paiement
        setIsPlanModalOpen(false);
        alert('🔗 Redirection vers le paiement Mollie à configurer sur la version de production');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du plan:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 print:hidden safe-area-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 safe-area-inset">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity">
                <div className="relative">
                  {/* Logo TropFlow Pro */}
                  <img
                    src="/logo192.png"
                    alt="TropFlow Pro"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-lg"
                  />
                </div>
                <h1 className="ml-2 sm:ml-3 text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  <span className="text-orange-600 dark:text-orange-400">Trop</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400">Flow Pro</span>
                </h1>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200 ${isActiveRoute(item.href)
                      ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-b-2 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User menu and Mobile menu button */}
            <div className="flex items-center space-x-4">
              {/* User info - Desktop */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {userProfile?.displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {userProfile?.contractNumber}
                  </p>
                </div>
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </div>

              {/* Theme Toggle, Plans, Settings and Logout - Desktop */}
              <div className="hidden md:flex items-center space-x-2">
                <ThemeToggle />
                <button
                  onClick={() => setIsPlanModalOpen(true)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                  title="Gérer mon plan"
                >
                  <Crown className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                  title="Paramètres"
                >
                  <Settings className="h-5 w-5" />
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors duration-200"
                  title="Se déconnecter"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              {/* User info - Mobile */}
              <div className="px-3 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mr-3">
                    <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {userProfile?.displayName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {userProfile?.contractNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation items */}
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${isActiveRoute(item.href)
                      ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}

              {/* Theme Toggle, Settings and Logout - Mobile */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-3 space-y-1">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-base font-medium text-gray-500 dark:text-gray-400">Thème</span>
                  <ThemeToggle />
                </div>
                <button
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 w-full transition-colors duration-200"
                >
                  <Settings className="h-5 w-5 mr-3" />
                  Paramètres
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 w-full transition-colors duration-200"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 safe-area-inset">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 print:hidden safe-area-bottom">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 safe-area-inset">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} TropFlow Pro - Gestionnaire de frais de déplacement
          </div>
        </div>
      </footer>

      {/* User Settings Modal */}
      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Plan Modal */}
      {userProfile && (
        <PlanModal
          isOpen={isPlanModalOpen}
          onClose={() => setIsPlanModalOpen(false)}
          userProfile={userProfile}
          onSelectPlan={handleSelectPlan}
        />
      )}

      {/* Bouton d'installation PWA */}
      <InstallButton />

      {/* Confirmation de déconnexion */}
      <ConfirmModal
        isOpen={confirmLogout}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        title="Se déconnecter"
        message="Êtes-vous sûr de vouloir vous déconnecter de votre session TropFlow Pro ?"
        type="warning"
        confirmText="Se déconnecter"
        cancelText="Rester connecté"
      />
    </div>
  );
};

export default Layout; 