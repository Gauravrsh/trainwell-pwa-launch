import { motion } from 'framer-motion';
import { User, MapPin, Award, Briefcase, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

/**
 * Item 6 — Public-facing trainer profile card.
 * Used in two places:
 *  - Client view: "Meet Your Coach" pulled from get_my_trainer_profile RPC
 *  - Trainer view: Live preview of what the client sees
 *
 * All fields are optional. The card degrades gracefully when fields are empty.
 */

export interface TrainerProfileSummary {
  id?: string;
  full_name: string | null;
  unique_id?: string | null;
  city: string | null;
  whatsapp_no: string | null;
  avatar_url: string | null;
  years_experience: number | null;
  bio: string | null;
  certifications: string[] | null;
  specializations: string[] | null;
}

interface Props {
  trainer: TrainerProfileSummary;
  /** When true, hide WhatsApp action (e.g. trainer's own preview). */
  hideContact?: boolean;
}

export function TrainerProfileCard({ trainer, hideContact }: Props) {
  const initials = (trainer.full_name || 'T')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5"
    >
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="w-16 h-16 border-2 border-primary/20">
          {trainer.avatar_url && <AvatarImage src={trainer.avatar_url} alt={trainer.full_name || 'Trainer'} />}
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-foreground truncate">
            {trainer.full_name || 'Your Coach'}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
            {trainer.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {trainer.city}
              </span>
            )}
            {typeof trainer.years_experience === 'number' && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {trainer.years_experience} yr exp
              </span>
            )}
          </div>
        </div>
      </div>

      {trainer.bio && (
        <p className="text-sm text-foreground/90 leading-relaxed mb-4 whitespace-pre-line">
          {trainer.bio}
        </p>
      )}

      {!!trainer.specializations?.length && (
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Specializations
          </p>
          <div className="flex flex-wrap gap-1.5">
            {trainer.specializations.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {!!trainer.certifications?.length && (
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Award className="w-3 h-3" /> Certifications
          </p>
          <ul className="text-xs text-foreground/90 space-y-0.5">
            {trainer.certifications.map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
        </div>
      )}

      {!hideContact && trainer.whatsapp_no && (
        <a
          href={`https://wa.me/91${trainer.whatsapp_no}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Message on WhatsApp
        </a>
      )}

      {/* Empty-state guidance for trainer's own preview */}
      {!trainer.bio && !trainer.specializations?.length && !trainer.certifications?.length && (
        <p className="text-xs text-muted-foreground italic text-center pt-2">
          Add a bio, specializations, and certifications so your clients know who's coaching them.
        </p>
      )}
    </motion.div>
  );
}