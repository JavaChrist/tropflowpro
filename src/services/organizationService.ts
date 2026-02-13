import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Organization, TeamInvite, TeamMemberInfo, UserProfile } from '../types';

const MAX_MEMBERS_PRO_ENTERPRISE = 10;

export class OrganizationService {
  private orgsCollection = 'organizations';
  private invitesCollection = 'teamInvites';
  private usersCollection = 'users';

  // Vérifier si l'utilisateur a accès Pro Entreprise
  canAccessTeamFeatures(userProfile: UserProfile): boolean {
    return userProfile.subscription.planId === 'pro_enterprise';
  }

  // Créer une organisation
  async createOrganization(name: string, ownerProfile: UserProfile): Promise<string> {
    if (!this.canAccessTeamFeatures(ownerProfile)) {
      throw new Error('Le plan Pro Entreprise est requis pour créer une équipe');
    }

    const now = new Date().toISOString();
    const orgData = {
      name,
      ownerId: ownerProfile.uid,
      memberIds: [ownerProfile.uid],
      maxMembers: MAX_MEMBERS_PRO_ENTERPRISE,
      createdAt: Timestamp.fromDate(new Date(now)),
      updatedAt: Timestamp.fromDate(new Date(now))
    };

    const docRef = await addDoc(collection(db, this.orgsCollection), orgData);

    // Mettre à jour le profil utilisateur
    await updateDoc(doc(db, this.usersCollection, ownerProfile.uid), {
      organizationId: docRef.id,
      role: 'owner',
      updatedAt: Timestamp.fromDate(new Date())
    });

    return docRef.id;
  }

  // Récupérer une organisation par ID
  async getOrganization(orgId: string): Promise<Organization | null> {
    const orgRef = doc(db, this.orgsCollection, orgId);
    const orgSnap = await getDoc(orgRef);

    if (orgSnap.exists()) {
      const data = orgSnap.data();
      return {
        id: orgSnap.id,
        name: data.name,
        ownerId: data.ownerId,
        memberIds: data.memberIds || [],
        maxMembers: data.maxMembers || MAX_MEMBERS_PRO_ENTERPRISE,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      } as Organization;
    }
    return null;
  }

  // Récupérer l'organisation de l'utilisateur
  async getUserOrganization(userId: string): Promise<Organization | null> {
    const q = query(
      collection(db, this.orgsCollection),
      where('memberIds', 'array-contains', userId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const data = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      name: data.name,
      ownerId: data.ownerId,
      memberIds: data.memberIds || [],
      maxMembers: data.maxMembers || MAX_MEMBERS_PRO_ENTERPRISE,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
    } as Organization;
  }

  // Inviter un membre par email
  async inviteMember(orgId: string, email: string, inviterId: string): Promise<string> {
    const org = await this.getOrganization(orgId);
    if (!org) throw new Error('Organisation non trouvée');

    if (org.memberIds.length >= org.maxMembers) {
      throw new Error(`Limite atteinte : maximum ${org.maxMembers} membres`);
    }

    const emailLower = email.toLowerCase().trim();

    // Vérifier si l'email est déjà membre
    const userQuery = query(
      collection(db, this.usersCollection),
      where('email', '==', emailLower)
    );
    const userSnap = await getDocs(userQuery);
    if (!userSnap.empty && org.memberIds.includes(userSnap.docs[0].id)) {
      throw new Error('Cet utilisateur fait déjà partie de l\'équipe');
    }

    // Vérifier les invitations en attente
    const pendingInvite = query(
      collection(db, this.invitesCollection),
      where('organizationId', '==', orgId),
      where('email', '==', emailLower),
      where('status', '==', 'pending')
    );
    const inviteSnap = await getDocs(pendingInvite);
    if (!inviteSnap.empty) {
      throw new Error('Une invitation est déjà en attente pour cet email');
    }

    const now = new Date().toISOString();
    const inviteData = {
      organizationId: orgId,
      organizationName: org.name,
      email: emailLower,
      invitedBy: inviterId,
      status: 'pending',
      createdAt: Timestamp.fromDate(new Date(now)),
      updatedAt: Timestamp.fromDate(new Date(now))
    };

    const docRef = await addDoc(collection(db, this.invitesCollection), inviteData);
    return docRef.id;
  }

  // Accepter une invitation
  async acceptInvite(inviteId: string, userProfile: UserProfile): Promise<void> {
    const inviteRef = doc(db, this.invitesCollection, inviteId);
    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists()) throw new Error('Invitation non trouvée');

    const inviteData = inviteSnap.data();
    if (inviteData.status !== 'pending') {
      throw new Error('Cette invitation n\'est plus valide');
    }

    if (inviteData.email.toLowerCase() !== userProfile.email?.toLowerCase()) {
      throw new Error('Cette invitation est destinée à un autre email');
    }

    const org = await this.getOrganization(inviteData.organizationId);
    if (!org) throw new Error('Organisation non trouvée');

    if (org.memberIds.length >= org.maxMembers) {
      throw new Error('L\'équipe a atteint sa limite de membres');
    }

    const newMemberIds = [...org.memberIds, userProfile.uid];
    await updateDoc(doc(db, this.orgsCollection, org.id), {
      memberIds: newMemberIds,
      updatedAt: Timestamp.fromDate(new Date())
    });

    await updateDoc(inviteRef, {
      status: 'accepted',
      updatedAt: Timestamp.fromDate(new Date())
    });

    await updateDoc(doc(db, this.usersCollection, userProfile.uid), {
      organizationId: org.id,
      role: 'member',
      updatedAt: Timestamp.fromDate(new Date())
    });
  }

  // Refuser une invitation
  async declineInvite(inviteId: string): Promise<void> {
    const inviteRef = doc(db, this.invitesCollection, inviteId);
    await updateDoc(inviteRef, {
      status: 'declined',
      updatedAt: Timestamp.fromDate(new Date())
    });
  }

  // Récupérer les invitations en attente pour un email
  async getPendingInvitesForEmail(email: string): Promise<TeamInvite[]> {
    const q = query(
      collection(db, this.invitesCollection),
      where('email', '==', email.toLowerCase()),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        organizationId: data.organizationId,
        organizationName: data.organizationName,
        email: data.email,
        invitedBy: data.invitedBy,
        status: data.status,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      } as TeamInvite;
    });
  }

  // Récupérer les invitations d'une organisation
  async getOrganizationInvites(orgId: string): Promise<TeamInvite[]> {
    const q = query(
      collection(db, this.invitesCollection),
      where('organizationId', '==', orgId),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        organizationId: data.organizationId,
        organizationName: data.organizationName,
        email: data.email,
        invitedBy: data.invitedBy,
        status: data.status,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      } as TeamInvite;
    });
  }

  // Récupérer les membres de l'équipe avec leurs profils
  async getTeamMembers(orgId: string): Promise<TeamMemberInfo[]> {
    const org = await this.getOrganization(orgId);
    if (!org) return [];

    const members: TeamMemberInfo[] = [];
    for (const memberId of org.memberIds) {
      const userRef = doc(db, this.usersCollection, memberId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        members.push({
          uid: memberId,
          email: data.email || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          role: memberId === org.ownerId ? 'owner' : 'member',
          joinedAt: org.createdAt
        });
      }
    }
    return members;
  }

  // Retirer un membre de l'équipe (owner uniquement)
  async removeMember(orgId: string, memberId: string, ownerId: string): Promise<void> {
    const org = await this.getOrganization(orgId);
    if (!org) throw new Error('Organisation non trouvée');
    if (org.ownerId !== ownerId) throw new Error('Seul le propriétaire peut retirer des membres');
    if (memberId === ownerId) throw new Error('Le propriétaire ne peut pas se retirer');

    const newMemberIds = org.memberIds.filter(id => id !== memberId);
    await updateDoc(doc(db, this.orgsCollection, orgId), {
      memberIds: newMemberIds,
      updatedAt: Timestamp.fromDate(new Date())
    });

    await updateDoc(doc(db, this.usersCollection, memberId), {
      organizationId: null,
      role: null,
      updatedAt: Timestamp.fromDate(new Date())
    });
  }

  // Quitter une organisation (membre uniquement)
  async leaveOrganization(orgId: string, userId: string): Promise<void> {
    const org = await this.getOrganization(orgId);
    if (!org) throw new Error('Organisation non trouvée');
    if (org.ownerId === userId) throw new Error('Le propriétaire ne peut pas quitter. Transférez la propriété ou supprimez l\'organisation.');

    const newMemberIds = org.memberIds.filter(id => id !== userId);
    await updateDoc(doc(db, this.orgsCollection, orgId), {
      memberIds: newMemberIds,
      updatedAt: Timestamp.fromDate(new Date())
    });

    await updateDoc(doc(db, this.usersCollection, userId), {
      organizationId: null,
      role: null,
      updatedAt: Timestamp.fromDate(new Date())
    });
  }

  // Annuler une invitation
  async cancelInvite(inviteId: string, orgId: string, userId: string): Promise<void> {
    const org = await this.getOrganization(orgId);
    if (!org || org.ownerId !== userId) throw new Error('Non autorisé');

    await updateDoc(doc(db, this.invitesCollection, inviteId), {
      status: 'declined',
      updatedAt: Timestamp.fromDate(new Date())
    });
  }
}

const organizationService = new OrganizationService();
export default organizationService;
