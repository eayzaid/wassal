import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { ErrorResponse, ContactDto } from '../../types';
import { AxiosError } from 'axios';
import {
  Lock,
  Mail,
  AlertCircle,
  Clock,
  Ban,
  Phone,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dedicated error state modals
  const [pendingApprovalModal, setPendingApprovalModal] = useState<boolean>(false);
  const [blockedOrRejectedModal, setBlockedOrRejectedModal] = useState<{
    isOpen: boolean;
    title: string;
    type: 'BLOCKED' | 'REJECTED';
    message: string;
    contact?: ContactDto | null;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await login({ email: email.trim(), password });
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

      if (from && from !== '/' && from !== '/login') {
        navigate(from, { replace: true });
      } else if (user?.role === 'PRESIDENT' || user?.role === 'VICE_PRESIDENT' || user?.role === 'RH') {
        navigate('/admin/members', { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      const errorData = error.response?.data;
      const errorCode = errorData?.error;

      if (errorCode === 'ACCOUNT_PENDING_APPROVAL') {
        setPendingApprovalModal(true);
      } else if (errorCode === 'ACCOUNT_REJECTED') {
        setBlockedOrRejectedModal({
          isOpen: true,
          title: "Demande d'inscription refusée",
          type: 'REJECTED',
          message: errorData?.message || "Votre demande d'adhésion a été examinée et refusée par le bureau exécutif.",
          contact: errorData?.contact,
        });
      } else if (errorCode === 'ACCOUNT_BLOCKED') {
        setBlockedOrRejectedModal({
          isOpen: true,
          title: 'Compte suspendu',
          type: 'BLOCKED',
          message: errorData?.message || "L'accès à ce compte a été temporairement suspendu par l'administration.",
          contact: errorData?.contact,
        });
      } else if (error.response?.status === 429 || errorCode === 'TOO_MANY_REQUESTS') {
        setErrorMessage('Trop de tentatives consécutives. Veuillez patienter une minute avant de réessayer.');
      } else {
        setErrorMessage(
          errorData?.message ||
            (err instanceof Error ? err.message : 'Identifiants invalides. Vérifiez votre adresse email et mot de passe.')
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillMockAccount = (mockEmail: string) => {
    setEmail(mockEmail);
    setPassword('Password123!');
    setErrorMessage(null);
  };

  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  return (
    <div className="min-h-screen bg-wassal-bg flex flex-col justify-center py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-wassal-plum text-wassal-green font-bold text-xl sm:text-2xl shadow-sm mb-2 sm:mb-3">
            W
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-wassal-plum tracking-tight">
            WASSAL
          </h2>
          <p className="mt-1 text-[11px] sm:text-xs font-semibold text-wassal-sage uppercase tracking-wider">
            Caravane El Hayat • Espace de gestion
          </p>
        </div>

        {/* Shadcn Card */}
        <Card className="mt-6 sm:mt-8 shadow-xs border-wassal-border rounded-2xl sm:rounded-xl">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base">Connexion à votre espace</CardTitle>
            <CardDescription>
              Accédez à la plateforme associative de Caravane El Hayat
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Adresse email"
                type="email"
                required
                autoComplete="email"
                placeholder="ex. president@wassal.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                className="h-11 sm:h-10 text-base sm:text-sm"
              />

              <div>
                <Input
                  label="Mot de passe"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  className="h-11 sm:h-10 text-base sm:text-sm"
                />
                <div className="flex justify-end mt-1.5">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-wassal-slate hover:text-wassal-plum transition-colors py-1"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full mt-2 h-11 sm:h-10 text-base sm:text-sm"
                isLoading={isLoading}
              >
                Se connecter
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-wassal-border text-center">
              <p className="text-xs text-wassal-slate">
                Vous êtes nouveau bénévole ?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-wassal-green-ink hover:underline py-1"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Demo Switcher (Collapsible on mobile) */}
        <Card className="mt-4 sm:mt-6 shadow-xs border-wassal-border bg-wassal-surface/80 rounded-xl">
          <CardContent className="p-3 sm:p-4">
            <button
              type="button"
              onClick={() => setShowDemoAccounts((prev) => !prev)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-wassal-sage-deep" />
                <span className="text-xs font-bold text-wassal-plum uppercase tracking-wider">
                  Comptes de test (Données initiales)
                </span>
              </div>
              <span className="text-xs font-medium text-wassal-slate">
                {showDemoAccounts ? 'Masquer' : 'Afficher'}
              </span>
            </button>

            {showDemoAccounts && (
              <div className="mt-3 pt-3 border-t border-wassal-border/60">
                <p className="text-[11px] text-wassal-slate mb-3">
                  Cliquez pour pré-remplir instantanément les identifiants (mot de passe: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">Password123!</code>) :
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    onClick={() => handleFillMockAccount('president@wassal.org')}
                    className="h-auto py-1.5 px-2 flex flex-col items-start text-left bg-white hover:bg-gray-50 border-gray-200 justify-start"
                  >
                    <span className="font-semibold text-wassal-plum text-xs">Président</span>
                    <span className="text-[10px] text-gray-500 truncate font-normal">president@...</span>
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    onClick={() => handleFillMockAccount('vp@wassal.org')}
                    className="h-auto py-1.5 px-2 flex flex-col items-start text-left bg-white hover:bg-gray-50 border-gray-200 justify-start"
                  >
                    <span className="font-semibold text-wassal-plum text-xs">Vice-Président</span>
                    <span className="text-[10px] text-gray-500 truncate font-normal">vp@...</span>
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    onClick={() => handleFillMockAccount('rh@wassal.org')}
                    className="h-auto py-1.5 px-2 flex flex-col items-start text-left bg-white hover:bg-gray-50 border-gray-200 justify-start"
                  >
                    <span className="font-semibold text-wassal-plum text-xs">Resp. RH</span>
                    <span className="text-[10px] text-gray-500 truncate font-normal">rh@...</span>
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    onClick={() => handleFillMockAccount('teamleader@wassal.org')}
                    className="h-auto py-1.5 px-2 flex flex-col items-start text-left bg-white hover:bg-gray-50 border-gray-200 justify-start"
                  >
                    <span className="font-semibold text-wassal-plum text-xs">Chef d'équipe</span>
                    <span className="text-[10px] text-gray-500 truncate font-normal">teamleader@...</span>
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    onClick={() => handleFillMockAccount('member@wassal.org')}
                    className="h-auto py-1.5 px-2 flex flex-col items-start text-left bg-white hover:bg-gray-50 border-gray-200 justify-start"
                  >
                    <span className="font-semibold text-wassal-plum text-xs">Membre actif</span>
                    <span className="text-[10px] text-gray-500 truncate font-normal">member@...</span>
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    onClick={() => handleFillMockAccount('pending@wassal.org')}
                    className="h-auto py-1.5 px-2 flex flex-col items-start text-left bg-amber-50/50 hover:bg-amber-50 border-amber-200 justify-start"
                  >
                    <span className="font-semibold text-amber-900 text-xs">En attente</span>
                    <span className="text-[10px] text-amber-700 truncate font-normal">pending@...</span>
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    onClick={() => handleFillMockAccount('blocked@wassal.org')}
                    className="h-auto py-1.5 px-2 flex flex-col items-start text-left bg-rose-50/50 hover:bg-rose-50 border-rose-200 justify-start"
                  >
                    <span className="font-semibold text-wassal-wine text-xs">Bloqué</span>
                    <span className="text-[10px] text-wassal-wine truncate font-normal">blocked@...</span>
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    onClick={() => handleFillMockAccount('rejected@wassal.org')}
                    className="h-auto py-1.5 px-2 flex flex-col items-start text-left bg-gray-50 hover:bg-gray-100 border-gray-300 justify-start"
                  >
                    <span className="font-semibold text-gray-700 text-xs">Rejeté</span>
                    <span className="text-[10px] text-gray-500 truncate font-normal">rejected@...</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Pending Approval Modal */}
      <Modal
        isOpen={pendingApprovalModal}
        onClose={() => setPendingApprovalModal(false)}
        maxWidth="sm"
      >
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-full bg-wassal-slate/15 text-wassal-slate flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-wassal-plum">
            Adhésion en attente de validation
          </h3>
          <p className="mt-2 text-sm text-wassal-slate leading-relaxed">
            Votre inscription a bien été enregistrée par l'association Caravane El Hayat. Elle est actuellement examinée par un responsable ou membre du bureau avant activation.
          </p>
          <div className="mt-4 p-3 bg-wassal-bg rounded-lg border border-wassal-border text-xs text-wassal-slate">
            Un email de confirmation vous sera transmis dès l'approbation de votre compte.
          </div>
          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setPendingApprovalModal(false)}
            >
              J'ai compris
            </Button>
          </div>
        </div>
      </Modal>

      {/* Blocked or Rejected Modal */}
      {blockedOrRejectedModal && (
        <Modal
          isOpen={blockedOrRejectedModal.isOpen}
          onClose={() => setBlockedOrRejectedModal(null)}
          maxWidth="sm"
        >
          <div className="text-center py-2">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                blockedOrRejectedModal.type === 'BLOCKED'
                  ? 'bg-wassal-wine/15 text-wassal-wine'
                  : 'bg-wassal-plum/15 text-wassal-plum'
              }`}
            >
              <Ban className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-wassal-plum">
              {blockedOrRejectedModal.title}
            </h3>
            <p className="mt-2 text-sm text-wassal-slate leading-relaxed">
              {blockedOrRejectedModal.message}
            </p>

            {/* Contact box */}
            {blockedOrRejectedModal.contact && (
              <div className="mt-5 p-3.5 rounded-lg bg-wassal-bg border border-wassal-border text-left">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-wassal-plum mb-2">
                  <HelpCircle className="w-3.5 h-3.5 text-wassal-slate" />
                  <span>Contact Caravane El Hayat</span>
                </div>
                <div className="space-y-1 text-xs text-wassal-slate">
                  {blockedOrRejectedModal.contact.name && (
                    <p className="font-medium text-wassal-ink">
                      {blockedOrRejectedModal.contact.name}
                    </p>
                  )}
                  {blockedOrRejectedModal.contact.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-wassal-slate" />
                      <a
                        href={`mailto:${blockedOrRejectedModal.contact.email}`}
                        className="text-wassal-green-ink hover:underline"
                      >
                        {blockedOrRejectedModal.contact.email}
                      </a>
                    </div>
                  )}
                  {blockedOrRejectedModal.contact.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-wassal-slate" />
                      <a
                        href={`tel:${blockedOrRejectedModal.contact.phone}`}
                        className="font-mono text-wassal-ink"
                      >
                        {blockedOrRejectedModal.contact.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setBlockedOrRejectedModal(null)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
