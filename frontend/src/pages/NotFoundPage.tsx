import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-wassal-bg flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-wassal-plum/10 text-wassal-plum flex items-center justify-center mb-4">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-wassal-plum tracking-tight">404</h1>
      <h2 className="mt-2 text-lg font-bold text-wassal-plum">Page non trouvée</h2>
      <p className="mt-1 text-sm text-wassal-slate max-w-sm">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <div className="mt-6">
        <Button asChild size="default">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Link>
        </Button>
      </div>
    </div>
  );
};
