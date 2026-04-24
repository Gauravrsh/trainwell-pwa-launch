import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logError, sanitizeErrorMessage } from '@/lib/errorUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, X, Loader2 } from 'lucide-react';

/**
 * Item 6 — Curated specialization chips.
 * Trainers pick from this list to keep the data clean and filterable later.
 * Each chip stays under the DB cap (50 chars) and the array stays under 10.
 */
const SPECIALIZATIONS = [
  'Strength Training',
  'Hypertrophy',
  'Fat Loss',
  'Powerlifting',
  'Functional Fitness',
  'Calisthenics',
  'Mobility',
  'Post-Rehab',
  'Pre/Post Natal',
  'Senior Fitness',
  'Sport-Specific',
  'Nutrition Coaching',
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function TrainerProfileEditModal({ open, onOpenChange, onSaved }: Props) {
  const { user } = useAuth();
  const { profile, refetchProfile } = useProfile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState('');
  const [years, setYears] = useState('');
  const [certsText, setCertsText] = useState('');
  const [specs, setSpecs] = useState<string[]>([]);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Hydrate from current profile when modal opens.
  useEffect(() => {
    if (!open || !profile) return;
    setBio(profile.bio ?? '');
    setYears(profile.years_experience != null ? String(profile.years_experience) : '');
    setCertsText((profile.certifications ?? []).join('\n'));
    setSpecs(profile.specializations ?? []);
    setAvatarPath(profile.avatar_url ?? null);
    if (profile.avatar_url) {
      // Resolve signed URL for preview (bucket is private now).
      supabase.storage
        .from('avatars')
        .createSignedUrl(profile.avatar_url, 3600)
        .then(({ data }) => setAvatarPreview(data?.signedUrl ?? null))
        .catch((err) => logError('TrainerProfileEditModal.signedPreview', err));
    } else {
      setAvatarPreview(null);
    }
  }, [open, profile]);

  const initials = (profile?.full_name || 'T')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const toggleSpec = (s: string) => {
    setSpecs((prev) => {
      if (prev.includes(s)) return prev.filter((x) => x !== s);
      if (prev.length >= 10) {
        toast({ title: 'Limit reached', description: 'Maximum 10 specializations.' });
        return prev;
      }
      return [...prev, s];
    });
  };

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please pick an image.', variant: 'destructive' });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast({ title: 'Too large', description: 'Avatar must be under 3 MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      // Storage RLS expects the first folder = auth.uid()
      const path = `${user.id}/avatar.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      // Resolve signed preview
      const { data: signed } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, 3600);

      setAvatarPath(path);
      setAvatarPreview(signed?.signedUrl ?? null);
      toast({ title: 'Photo uploaded', description: 'Hit Save to apply.' });
    } catch (err) {
      logError('TrainerProfileEditModal.avatarUpload', err);
      toast({ title: 'Upload failed', description: sanitizeErrorMessage(err), variant: 'destructive' });
    } finally {
      setUploading(false);
      // reset input so re-picking the same file fires onChange
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAvatar = async () => {
    if (!avatarPath) {
      setAvatarPath(null);
      setAvatarPreview(null);
      return;
    }
    try {
      await supabase.storage.from('avatars').remove([avatarPath]);
    } catch (err) {
      logError('TrainerProfileEditModal.removeAvatar', err);
    }
    setAvatarPath(null);
    setAvatarPreview(null);
  };

  const handleSave = async () => {
    if (!profile || !user) return;

    // Local validation mirrors DB caps.
    if (bio.length > 500) {
      toast({ title: 'Bio too long', description: 'Max 500 characters.', variant: 'destructive' });
      return;
    }
    const yrsNum = years === '' ? null : parseInt(years, 10);
    if (yrsNum !== null && (Number.isNaN(yrsNum) || yrsNum < 0 || yrsNum > 60)) {
      toast({ title: 'Invalid experience', description: '0 to 60 years.', variant: 'destructive' });
      return;
    }
    const certs = certsText
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean);
    if (certs.length > 10) {
      toast({ title: 'Too many certifications', description: 'Max 10.', variant: 'destructive' });
      return;
    }
    if (certs.some((c) => c.length > 100)) {
      toast({ title: 'Certification too long', description: 'Each entry max 100 chars.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarPath,
          years_experience: yrsNum,
          bio: bio.trim() || null,
          certifications: certs,
          specializations: specs,
        })
        .eq('user_id', user.id);
      if (error) throw error;

      await refetchProfile();
      toast({ title: 'Saved', description: 'Your trainer profile is updated.' });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      logError('TrainerProfileEditModal.save', err);
      toast({ title: 'Save failed', description: sanitizeErrorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trainer Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20 border-2 border-primary/20">
                {avatarPreview && <AvatarImage src={avatarPreview} alt="Avatar" />}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-background/70 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAvatarPick}
                disabled={uploading}
                className="w-full gap-2"
              >
                <Camera className="w-4 h-4" />
                {avatarPreview ? 'Change Photo' : 'Upload Photo'}
              </Button>
              {avatarPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeAvatar}
                  className="w-full gap-2 text-destructive"
                >
                  <X className="w-4 h-4" /> Remove
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Years */}
          <div className="space-y-1.5">
            <Label htmlFor="years">Years of experience</Label>
            <Input
              id="years"
              type="number"
              inputMode="numeric"
              min={0}
              max={60}
              value={years}
              onChange={(e) => setYears(e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="e.g. 5"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="One or two lines on how you coach. Your clients will see this."
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground text-right">{bio.length}/500</p>
          </div>

          {/* Specializations */}
          <div className="space-y-1.5">
            <Label>Specializations</Label>
            <div className="flex flex-wrap gap-1.5">
              {SPECIALIZATIONS.map((s) => {
                const active = specs.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpec(s)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground">{specs.length}/10 selected</p>
          </div>

          {/* Certifications */}
          <div className="space-y-1.5">
            <Label htmlFor="certs">Certifications</Label>
            <Textarea
              id="certs"
              rows={3}
              value={certsText}
              onChange={(e) => setCertsText(e.target.value)}
              placeholder={'One per line\nACSM Certified Personal Trainer\nNSCA-CSCS'}
            />
            <p className="text-[10px] text-muted-foreground">One per line. Max 10. Each ≤ 100 chars.</p>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || uploading}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// re-export for callers needing the chip vocabulary later (e.g. filters)
export { SPECIALIZATIONS };