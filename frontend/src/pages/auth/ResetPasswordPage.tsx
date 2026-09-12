import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/common/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { isValidPassword } from '../../utils/validation';
import { AxiosError } from 'axios';
import { ErrorResponse } from '../../types';
import { Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const resetTokenFromState = (location.state as { resetToken?: string })?.resetToken;
  const resetTokenFromQuery = searchParams.get('token');
  const token = resetTokenFromState || resetTokenFromQuery || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!token) {
      setErrorMsg('Jeton de réinitialisation manquant. Veuillez recommencer la procédure.');
      return;
    }

    const val = isValidPassword(newPassword);
    if (!val.valid) {
      setErrorMsg(val.errors[0]);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        resetToken: token,
        newPassword,
      });
      setIsSuccess(true);
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      setErrorMsg(error.response?.data?.message || 'Jeton de réinitialisation invalide ou expiré.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-wassal-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="shadow-xs border-wassal-border text-center">
            <CardContent className="pt-8 pb-6 px-6 sm:px-10">
              <div className="w-14 h-14 rounded-2xl bg-wassal-green/20 text-wassal-green-ink flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-wassal-plum">
                Mot de passe mis à jour !
              </h3>
              <p className="mt-2 text-sm text-wassal-slate leading-relaxed">
                Votre nouveau mot de passe a été configuré avec succès. Vous pouvez dès à présent vous reconnecter avec vos nouveaux identifiants.
              </p>
              <div className="mt-6 pt-6 border-t border-wassal-border">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/login')}
                >
                  Se connecter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wassal-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-wassal-plum text-wassal-green font-bold text-2xl shadow-sm mb-3">
            W
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-wassal-plum tracking-tight">
            Nouveau mot de passe
          </h2>
          <p className="mt-1 text-xs font-semibold text-wassal-sage uppercase tracking-wider">
            Définissez votre nouveau mot de passe
          </p>
        </div>

        <Card className="mt-8 shadow-xs border-wassal-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Sécuriser votre accès</CardTitle>
            <CardDescription>
              Choisissez un mot de passe robuste comportant au moins 8 caractères
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            {!token ? (
              <div className="text-center py-4">
                <p className="text-sm text-wassal-wine font-medium mb-4">
                  Aucun jeton de réinitialisation valide détecté.
                </p>
                <Link to="/forgot-password">
                  <Button variant="outline" size="sm">
                    Demander un nouveau code
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  helperText="Min. 8 car., 1 majuscule, 1 chiffre, 1 symbole"
                  leftIcon={<Lock className="w-4 h-4" />}
                />

                <Input
                  label="Confirmer le nouveau mot de passe"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-2"
                  isLoading={isLoading}
                >
                  Enregistrer le mot de passe
                </Button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-wassal-border text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-wassal-slate hover:text-wassal-plum transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Annuler et revenir à la connexion</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
