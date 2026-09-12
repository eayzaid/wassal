import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/common/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { isValidEmail, isValidPhoneNumber, isValidPassword } from '../../utils/validation';
import { AxiosError } from 'axios';
import { ErrorResponse } from '../../types';
import {
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Clock,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = 'Le prénom est requis';
    if (!lastName.trim()) errors.lastName = 'Le nom est requis';

    if (!email.trim()) {
      errors.email = "L'adresse email est requise";
    } else if (!isValidEmail(email)) {
      errors.email = 'Format d’email invalide';
    }

    if (!phoneNumber.trim()) {
      errors.phoneNumber = 'Le numéro de téléphone est requis';
    } else if (!isValidPhoneNumber(phoneNumber)) {
      errors.phoneNumber = 'Format de téléphone invalide (+212... ou 06...)';
    }

    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.errors[0];
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      await authApi.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        password,
      });
      setIsSuccess(true);
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      setApiError(
        error.response?.data?.message ||
          "Une erreur est survenue lors de l'inscription. Veuillez vérifier vos données."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-wassal-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="text-center shadow-xs border-wassal-border">
            <CardContent className="pt-8 pb-6 px-6 sm:px-10">
              <div className="w-14 h-14 rounded-2xl bg-wassal-green/20 text-wassal-green-ink flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-wassal-plum">
                Inscription enregistrée !
              </h3>
              <div className="mt-3 flex items-center justify-center">
                <Badge variant="pending" className="px-3 py-1 gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Statut : En attente de validation</span>
                </Badge>
              </div>
              <p className="mt-4 text-sm text-wassal-slate leading-relaxed">
                Bienvenue chez <strong>Caravane El Hayat</strong>. Votre dossier a été créé avec succès. Un administrateur va examiner votre demande d'adhésion sous peu.
              </p>
              <div className="mt-6 pt-6 border-t border-wassal-border">
                <Link to="/login">
                  <Button size="lg" className="w-full">
                    Retour à la page de connexion
                  </Button>
                </Link>
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
            Rejoindre Caravane El Hayat
          </h2>
          <p className="mt-1 text-xs font-semibold text-wassal-sage uppercase tracking-wider">
            Formulaire d'adhésion bénévole
          </p>
        </div>

        <Card className="mt-8 shadow-xs border-wassal-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Création de compte membre</CardTitle>
            <CardDescription>
              Remplissez les informations ci-dessous pour soumettre votre candidature
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {apiError && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Prénom"
                  required
                  placeholder="ex. Amine"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  error={fieldErrors.firstName}
                  leftIcon={<User className="w-4 h-4" />}
                />
                <Input
                  label="Nom"
                  required
                  placeholder="ex. Bennani"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  error={fieldErrors.lastName}
                  leftIcon={<User className="w-4 h-4" />}
                />
              </div>

              <Input
                label="Adresse email"
                type="email"
                required
                placeholder="ex. amine@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={fieldErrors.email}
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Numéro de téléphone"
                type="tel"
                required
                placeholder="+212 600 000 000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                error={fieldErrors.phoneNumber}
                helperText="Format marocain: +2126... ou 06..."
                leftIcon={<Phone className="w-4 h-4" />}
              />

              <Input
                label="Mot de passe"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={fieldErrors.password}
                helperText="Min. 8 car., 1 majuscule, 1 chiffre, 1 symbole"
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Input
                label="Confirmer le mot de passe"
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={fieldErrors.confirmPassword}
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full mt-4"
                isLoading={isLoading}
              >
                Créer mon compte bénévole
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-wassal-border text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-wassal-slate hover:text-wassal-plum transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Déjà inscrit ? Se connecter</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
