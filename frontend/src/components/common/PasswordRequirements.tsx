import React from 'react';
import { checkPasswordConstraints } from '../../utils/validation';
import { Check, Circle } from 'lucide-react';

interface PasswordRequirementsProps {
  password: string;
  className?: string;
  showAlways?: boolean;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  password,
  className = '',
  showAlways = false,
}) => {
  const { rules, score } = checkPasswordConstraints(password);

  // If password is empty and showAlways is false, don't show the checklist
  if (!password && !showAlways) {
    return null;
  }

  // Determine strength label and text color
  let strengthLabel = 'Faible';
  let strengthTextColor = 'text-rose-600';

  if (score >= 5) {
    strengthLabel = 'Robuste';
    strengthTextColor = 'text-wassal-green-ink';
  } else if (score >= 3) {
    strengthLabel = 'Moyen';
    strengthTextColor = 'text-amber-600';
  }

  return (
    <div className={`p-3 rounded-xl bg-wassal-bg/80 border border-wassal-border/80 space-y-2.5 ${className}`}>
      {/* Strength Bar & Label */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-wassal-plum">Sécurité du mot de passe :</span>
        <span className={`font-bold font-heading text-xs ${password ? strengthTextColor : 'text-wassal-slate'}`}>
          {password ? strengthLabel : 'À compléter'}
        </span>
      </div>

      <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden flex gap-1 p-0.5">
        {[1, 2, 3, 4, 5].map((step) => {
          const isFilled = score >= step;
          let segmentBg = 'bg-gray-200';

          if (isFilled) {
            if (score <= 2) segmentBg = 'bg-rose-500';
            else if (score <= 4) segmentBg = 'bg-amber-500';
            else segmentBg = 'bg-wassal-green';
          }

          return (
            <div
              key={step}
              className={`flex-1 h-full rounded-full transition-all duration-300 ${segmentBg}`}
            />
          );
        })}
      </div>

      {/* Constraints Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`flex items-center gap-1.5 text-[11px] transition-colors ${
              rule.met
                ? 'text-wassal-green-ink font-semibold'
                : 'text-wassal-slate/70'
            }`}
          >
            {rule.met ? (
              <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 text-wassal-green-ink stroke-[3]" />
              </span>
            ) : (
              <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Circle className="w-2.5 h-2.5 text-gray-300 stroke-[2]" />
              </span>
            )}
            <span className="truncate">{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
