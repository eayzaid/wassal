import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { profileApi } from '../../api/profileApi';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/common/Input';
import { RoleBadge } from '../../components/common/RoleBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { formatDate } from '../../utils/formatters';
import { isValidPassword, isValidPhoneNumber } from '../../utils/validation';
import { AxiosError } from 'axios';
import { ErrorResponse } from '../../types';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Shield,
  Save,
  KeyRound,
  AlertCircle,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  // Profile Edit State
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setProfileError('Le nom et le prénom ne peuvent pas être vides.');
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      setProfileError('Numéro de téléphone marocain invalide (+212... ou 06...).');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await profileApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      await refreshUser();
      toast.success('Profil mis à jour avec succès.');
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      setProfileError(error.response?.data?.message || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Veuillez saisir votre mot de passe actuel.');
      return;
    }

    const val = isValidPassword(newPassword);
    if (!val.valid) {
      setPasswordError(val.errors[0]);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await profileApi.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success('Votre mot de passe a été modifié avec succès.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      setPasswordError(error.response?.data?.message || 'Mot de passe actuel incorrect.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Mon Profil & Sécurité"
        subtitle="Gérez vos informations personnelles et sécurisez votre accès"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Overview Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-xs border-wassal-border text-center">
            <CardContent className="p-6">
              <Avatar className="w-20 h-20 mx-auto mb-4 border-2 border-wassal-plum/20 shadow-xs">
                <AvatarFallback className="text-xl bg-wassal-plum text-white font-bold">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>

              <h3 className="text-xl font-bold text-wassal-plum">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-xs text-wassal-slate mt-0.5">{user?.email}</p>

              <div className="flex items-center justify-center gap-2 mt-4">
                <RoleBadge role={user?.role} />
                <StatusBadge status={user?.accountStatus} blocked={user?.blocked} />
              </div>

              <div className="mt-6 pt-6 border-t border-wassal-border space-y-3 text-left text-xs">
                <div className="flex items-center justify-between text-wassal-slate">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Membre depuis</span>
                  </span>
                  <span className="font-semibold text-wassal-plum">
                    {formatDate(user?.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-wassal-slate">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Téléphone</span>
                  </span>
                  <span className="font-semibold font-mono text-wassal-plum">
                    {user?.phoneNumber}
                  </span>
                </div>

                <div className="flex items-center justify-between text-wassal-slate">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Organisation</span>
                  </span>
                  <span className="font-semibold text-wassal-sage-deep">
                    Caravane El Hayat
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tabs for Personal Info & Security */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 h-12 sm:h-10">
              <TabsTrigger value="info" className="gap-1.5 text-xs sm:text-sm py-2 px-1">
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Infos Personnelles</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-1.5 text-xs sm:text-sm py-2 px-1">
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Sécurité & Accès</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <Card className="shadow-xs border-wassal-border">
                <CardHeader>
                  <CardTitle className="text-base">Modifier vos coordonnées</CardTitle>
                  <CardDescription>
                    Mettez à jour votre nom et numéro de contact bénévole
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profileError && (
                    <Alert variant="destructive" className="mb-4 py-2.5">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{profileError}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Prénom"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        leftIcon={<User className="w-4 h-4" />}
                      />
                      <Input
                        label="Nom"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        leftIcon={<User className="w-4 h-4" />}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Adresse email (non modifiable)"
                        disabled
                        value={user?.email || ''}
                        helperText="Identifiant unique d'accès"
                        leftIcon={<Mail className="w-4 h-4" />}
                      />
                      <Input
                        label="Numéro de téléphone"
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        helperText="Format marocain: +212... ou 06..."
                        leftIcon={<Phone className="w-4 h-4" />}
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        size="default"
                        isLoading={isUpdatingProfile}
                        className="w-full sm:w-auto h-11 sm:h-9 gap-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Enregistrer les modifications</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="shadow-xs border-wassal-border">
                <CardHeader>
                  <CardTitle className="text-base">Mettre à jour le mot de passe</CardTitle>
                  <CardDescription>
                    Assurez la sécurité de votre compte avec un mot de passe fort
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {passwordError && (
                    <Alert variant="destructive" className="mb-4 py-2.5">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <Input
                      label="Mot de passe actuel"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      leftIcon={<Lock className="w-4 h-4" />}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Nouveau mot de passe"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        helperText="Min. 8 car., majuscule, chiffre, symbole"
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
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        variant="secondary"
                        size="default"
                        isLoading={isChangingPassword}
                        className="w-full sm:w-auto h-11 sm:h-9 gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Mettre à jour le mot de passe</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
