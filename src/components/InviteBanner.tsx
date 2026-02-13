import React, { useEffect, useState } from 'react';
import { Mail, Check, X } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import organizationService from '../services/organizationService';
import { TeamInvite } from '../types';

const InviteBanner: React.FC = () => {
  const { userProfile, refreshUserProfile } = useAuth();
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadInvites = async () => {
      if (!userProfile?.email) return;
      try {
        const pending = await organizationService.getPendingInvitesForEmail(userProfile.email);
        setInvites(pending);
      } catch {
        setInvites([]);
      }
    };
    loadInvites();
  }, [userProfile?.email]);

  const handleAccept = async (invite: TeamInvite) => {
    if (!userProfile) return;
    setIsLoading(true);
    try {
      await organizationService.acceptInvite(invite.id, userProfile);
      await refreshUserProfile();
      setInvites(prev => prev.filter(i => i.id !== invite.id));
    } catch (err) {
      console.error('Erreur acceptation invitation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async (invite: TeamInvite) => {
    try {
      await organizationService.declineInvite(invite.id);
      setInvites(prev => prev.filter(i => i.id !== invite.id));
    } catch (err) {
      console.error('Erreur refus invitation:', err);
    }
  };

  if (invites.length === 0) return null;

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <Mail className="h-5 w-5 text-purple-600 mr-2" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Vous avez {invites.length} invitation{invites.length > 1 ? 's' : ''} à rejoindre une équipe
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-purple-200 dark:border-purple-700"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {invite.organizationName}
                </span>
                <button
                  onClick={() => handleAccept(invite)}
                  disabled={isLoading}
                  className="p-1.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/70 transition-colors"
                  title="Accepter"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDecline(invite)}
                  disabled={isLoading}
                  className="p-1.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors"
                  title="Refuser"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteBanner;
