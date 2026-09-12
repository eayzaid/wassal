import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/common/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { isValidEmail } from '../../utils/validation';
import { AxiosError } from 'axios';
import { ErrorResponse } from '../../types';
import { Mail, KeyRound, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<'REQUEST_CODE' | 'VERIFY_CODE'>('REQUEST_CODE');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isValidEmail(email)) {
      setErrorMsg("Veuillez saisir une adresse email valide.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword({ email: email.trim() });
      setInfoMsg(res.message);
      setStep('VERIFY_CODE');
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      setErrorMsg(error.response?.data?.message || "Impossible d'envoyer le code de réinitialisation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (code.trim().length !== 6) {
      setErrorMsg('Le code de vérification doit comporter 6 chiffres.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.verifyResetCode({
        email: email.trim(),
        code: code.trim(),
      });
      navigate('/reset-password', {
        state: { resetToken: res.resetToken, email: email.trim() },
      });
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      setErrorMsg(error.response?.data?.message || 'Code de réinitialisation invalide ou expiré.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-wassal-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-wassal-plum text-wassal-green font-bold text-2xl shadow-sm mb-3">
            W
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-wassal-plum tracking-tight">
            Récupération de mot de passe
          </h2>
          <p className="mt-1 text-xs font-semibold text-wassal-sage uppercase tracking-wider">
            Association Caravane El Hayat
          </p>
        </div>

        <Card className="mt-8 shadow-xs border-wassal-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              {step === 'REQUEST_CODE' ? 'Réinitialiser votre accès' : 'Vérification du code'}
            </CardTitle>
            <CardDescription>
              {step === 'REQUEST_CODE'
                ? 'Saisissez votre email pour recevoir un code à 6 chiffres'
                : `Code envoyé à ${email}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            {infoMsg && (
              <Alert variant="success" className="py-2.5">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{infoMsg}</AlertDescription>
              </Alert>
            )}

            {step === 'REQUEST_CODE' ? (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <Input
                  label="Adresse email"
                  type="email"
                  required
                  placeholder="ex. amine@wassal.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                />
                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-2"
                  isLoading={isLoading}
                >
                  Envoyer le code de vérification
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <Input
                  label="Code à 6 chiffres"
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  leftIcon={<KeyRound className="w-4 h-4" />}
                  className="text-center tracking-widest text-lg font-mono font-bold"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-2"
                  isLoading={isLoading}
                >
                  Vérifier le code
                </Button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <Button
                    variant="ghost"
                    type="button"
                    size="sm"
                    onClick={() => setStep('REQUEST_CODE')}
                    className="h-auto p-0 text-wassal-slate hover:text-wassal-plum font-medium hover:bg-transparent"
                  >
                    Changer d'adresse email
                  </Button>
                  <Button
                    variant="link"
                    type="button"
                    size="sm"
                    onClick={handleRequestCode}
                    className="h-auto p-0 text-wassal-green-ink font-semibold"
                  >
                    Renvoyer le code
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-wassal-border text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-wassal-slate hover:text-wassal-plum transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour à la connexion</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
