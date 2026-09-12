import { Role, AccountStatus } from '../types';

export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString?: string | null): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
};

export const formatRole = (role?: Role): string => {
  switch (role) {
    case 'PRESIDENT':
      return 'Président';
    case 'VICE_PRESIDENT':
      return 'Vice-Président';
    case 'RH':
      return 'Ressources Humaines';
    case 'TEAM_LEADER':
      return "Responsable d'équipe";
    case 'MEMBER':
      return 'Membre';
    default:
      return role || '—';
  }
};

export const formatStatus = (status?: AccountStatus, blocked?: boolean): string => {
  if (blocked) return 'Bloqué';
  switch (status) {
    case 'PENDING_APPROVAL':
      return 'En attente';
    case 'APPROVED':
      return 'Actif';
    case 'REJECTED':
      return 'Rejeté';
    default:
      return status || '—';
  }
};
