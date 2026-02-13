import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Mail,
  Crown,
  Trash2,
  LogOut,
  ArrowLeft,
  UserPlus
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import organizationService from '../services/organizationService';
import { Organization, TeamMemberInfo, TeamInvite } from '../types';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';

const TeamManagement: React.FC = () => {
  const { userProfile, refreshUserProfile } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<TeamMemberInfo[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({ isOpen: false, title: '', message: '', action: () => {} });
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  const loadData = async () => {
    if (!userProfile) return;
    setIsLoading(true);
    setError(null);
    try {
      const org = await organizationService.getUserOrganization(userProfile.uid);
      setOrganization(org);
      if (org) {
        const [membersList, invitesList] = await Promise.all([
          organizationService.getTeamMembers(org.id),
          organizationService.getOrganizationInvites(org.id)
        ]);
        setMembers(membersList);
        setInvites(invitesList);
      } else {
        setMembers([]);
        setInvites([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userProfile?.uid]);

  const handleCreateOrganization = async () => {
    if (!userProfile || !orgName.trim()) return;
    setIsCreatingOrg(true);
    setError(null);
    try {
      await organizationService.createOrganization(orgName.trim(), userProfile);
      await refreshUserProfile();
      setOrgName('');
      await loadData();
      setAlertModal({
        isOpen: true,
        title: 'Équipe créée',
        message: 'Votre équipe a été créée avec succès. Vous pouvez maintenant inviter des membres.',
        type: 'success'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const handleInvite = async () => {
    if (!userProfile || !organization || !inviteEmail.trim()) return;
    setIsInviting(true);
    setError(null);
    try {
      await organizationService.inviteMember(organization.id, inviteEmail.trim(), userProfile.uid);
      setInviteEmail('');
      await loadData();
      setAlertModal({
        isOpen: true,
        title: 'Invitation envoyée',
        message: `Une invitation a été envoyée à ${inviteEmail.trim()}. L'utilisateur pourra rejoindre l'équipe depuis son tableau de bord.`,
        type: 'success'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = (member: TeamMemberInfo) => {
    if (!organization || !userProfile) return;
    setConfirmModal({
      isOpen: true,
      title: 'Retirer le membre',
      message: `Êtes-vous sûr de vouloir retirer ${member.firstName} ${member.lastName} (${member.email}) de l'équipe ?`,
      action: async () => {
        try {
          await organizationService.removeMember(organization.id, member.uid, userProfile!.uid);
          await refreshUserProfile();
          await loadData();
        } catch (err) {
          setAlertModal({
            isOpen: true,
            title: 'Erreur',
            message: err instanceof Error ? err.message : 'Erreur lors du retrait',
            type: 'error'
          });
        }
      }
    });
  };

  const handleLeaveOrganization = () => {
    if (!organization || !userProfile) return;
    setConfirmModal({
      isOpen: true,
      title: 'Quitter l\'équipe',
      message: 'Êtes-vous sûr de vouloir quitter cette équipe ? Vous ne pourrez plus accéder aux déplacements partagés.',
      action: async () => {
        try {
          await organizationService.leaveOrganization(organization.id, userProfile!.uid);
          await refreshUserProfile();
          await loadData();
        } catch (err) {
          setAlertModal({
            isOpen: true,
            title: 'Erreur',
            message: err instanceof Error ? err.message : 'Erreur',
            type: 'error'
          });
        }
      }
    });
  };

  const handleCancelInvite = (invite: TeamInvite) => {
    if (!organization || !userProfile) return;
    setConfirmModal({
      isOpen: true,
      title: 'Annuler l\'invitation',
      message: `Annuler l'invitation envoyée à ${invite.email} ?`,
      action: async () => {
        try {
          await organizationService.cancelInvite(invite.id, organization.id, userProfile!.uid);
          await loadData();
        } catch (err) {
          setAlertModal({
            isOpen: true,
            title: 'Erreur',
            message: err instanceof Error ? err.message : 'Erreur',
            type: 'error'
          });
        }
      }
    });
  };

  if (!userProfile) return null;

  const canCreateTeam = organizationService.canAccessTeamFeatures(userProfile);
  const hasOrganization = !!userProfile.organizationId;

  if (!canCreateTeam && !hasOrganization) {
    return (
      <div className="space-y-6">
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-8 text-center">
          <Users className="mx-auto h-16 w-16 text-purple-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Gestion d'équipe - Pro Entreprise
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
            La gestion d'équipe est une fonctionnalité exclusive du plan Pro Entreprise.
            Passez à ce plan pour créer une équipe, inviter des membres et partager les déplacements.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-400 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Gestion d'équipe
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez les membres de votre équipe et les invitations
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {!organization ? (
        /* Créer une organisation */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <Users className="h-12 w-12 text-purple-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Créer votre équipe
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Donnez un nom à votre équipe pour commencer à inviter des membres et partager les déplacements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Nom de l'équipe (ex: Mon Entreprise)"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={handleCreateOrganization}
              disabled={isCreatingOrg || !orgName.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isCreatingOrg ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Création...
                </span>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Créer l'équipe
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Infos organisation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {organization.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {members.length} / {organization.maxMembers} membres
                </p>
              </div>
            </div>

            {/* Inviter un membre */}
            {userProfile.role === 'owner' && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Inviter un membre
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={handleInvite}
                    disabled={isInviting || !inviteEmail.trim() || members.length >= organization.maxMembers}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isInviting ? 'Envoi...' : (
                      <>
                        <Mail className="h-5 w-5 mr-2" />
                        Inviter
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Liste des membres */}
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Membres</h3>
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.uid}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                      {member.role === 'owner' ? (
                        <Crown className="h-5 w-5 text-purple-600" />
                      ) : (
                        <Users className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.firstName} {member.lastName}
                        {member.role === 'owner' && (
                          <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                            Propriétaire
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role === 'owner' ? (
                      member.uid === userProfile.uid && (
                        <span className="text-sm text-gray-500">Vous</span>
                      )
                    ) : userProfile.role === 'owner' ? (
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Retirer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : member.uid === userProfile.uid ? (
                      <button
                        onClick={handleLeaveOrganization}
                        className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Quitter
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Invitations en attente */}
            {userProfile.role === 'owner' && invites.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Invitations en attente
                </h3>
                <div className="space-y-2">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                    >
                      <span className="text-gray-700 dark:text-gray-300">{invite.email}</span>
                      <button
                        onClick={() => handleCancelInvite(invite)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Annuler
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={() => {
          confirmModal.action();
          setConfirmModal({ ...confirmModal, isOpen: false });
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
        confirmText="Confirmer"
        cancelText="Annuler"
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        buttonText="OK"
      />
    </div>
  );
};

export default TeamManagement;
