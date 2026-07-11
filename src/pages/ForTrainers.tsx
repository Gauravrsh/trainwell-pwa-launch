import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  MessageCircle,
  CalendarCheck,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorUtils';

// TODO(founder): replace with your actual WhatsApp number (with country code, no +).
const FOUNDER_WHATSAPP = '919999999999';
// TODO(founder): replace with your Calendly link when the 15-min "Vecto intro" event is live.
const CALENDLY_URL = 'https://calendly.com/vecto-fit/15min';

const WHATSAPP_PREFILL = encodeURIComponent(
  "Hi, I'm a trainer and saw Vecto. I'd like to know how it can help me retain clients."
);

export default function ForTrainers() {
  const [searchParams] = useSearchParams();

  // UTM capture — persisted in state, submitted with the form.
  const utm = useMemo(
    () => ({
      utm_source: searchParams.get('utm_source') || null,
      utm_medium: searchParams.get('utm_medium') || null,
      utm_campaign: searchParams.get('utm_campaign') || null,
      utm_content: searchParams.get('utm_content') || null,
    }),
    [searchParams]
  );

  const [form, setForm] = useState({
    full_name: '',
    whatsapp_no: '',
    instagram_handle: '',
    city: '',
    client_count_bucket: '2-5',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = 'Vecto for Trainers — Retention OS for Indian PTs';
  }, []);

  const whatsappHref = `https://wa.me/${FOUNDER_WHATSAPP}?text=${WHATSAPP_PREFILL}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.whatsapp_no.trim()) {
      toast.error('Name and WhatsApp number are required.');
      return;
    }
    try {
      setSubmitting(true);
      const { error } = await supabase.from('trainer_leads').insert({
        full_name: form.full_name.trim().slice(0, 120),
        whatsapp_no: form.whatsapp_no.trim().slice(0, 20),
        instagram_handle: form.instagram_handle.trim().slice(0, 60) || null,
        city: form.city.trim().slice(0, 80) || null,
        client_count_bucket: form.client_count_bucket || null,
        message: form.message.trim().slice(0, 1000) || null,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        utm_content: utm.utm_content,
        referrer_url: typeof document !== 'undefined' ? document.referrer.slice(0, 500) || null : null,
        status: 'new',
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Got it. We'll WhatsApp you within 24 hours.");
    } catch (err) {
      logError('ForTrainers.submit', err);
      toast.error("Couldn't submit right now. Try WhatsApp us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur safe-top">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="text-xl font-bold tracking-tight">
            <span className="text-primary">V</span>ECTO
          </Link>
          <Button asChild size="sm" className="font-bold">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
            </a>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="px-4 pb-10 sm:pb-16"
        style={{ paddingTop: 'calc(5rem + env(safe-area-inset-top, 0px))' }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold uppercase tracking-widest text-primary"
          >
            FOR INDEPENDENT PERSONAL TRAINERS · INDIA
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-3xl font-extrabold leading-[1.1] sm:text-4xl lg:text-5xl"
          >
            Your clients pay for results.{' '}
            <span className="text-primary">Vecto forces the reps.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg"
          >
            The daily accountability OS for 1:1 freelance trainers. Every workout,
            every meal, every day — logged or visibly missed. No "chalta hai."
            No lost clients after 3 months.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="w-full text-base font-bold sm:w-auto">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp us
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full text-base font-bold sm:w-auto"
            >
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <CalendarCheck className="mr-2 h-5 w-5" /> Book a 15-min call
              </a>
            </Button>
          </motion.div>
          <p className="mt-4 text-xs text-muted-foreground">
            3 clients free forever · No credit card · Cancel anytime
          </p>
        </div>
      </section>

      {/* Three pillars */}
      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: 'Binary accountability',
              body:
                'Green if they logged. Red if they missed. No backdating. No arguments.',
            },
            {
              icon: Zap,
              title: '8-second logging',
              body:
                'Meal photo → AI → done. Weight, steps, workout — one tap each. Compliance beats excuses.',
            },
            {
              icon: TrendingUp,
              title: 'You stay a Commander',
              body:
                'Set the plan once. Vecto enforces daily. You run 5-min reviews with data, not chase logs on WhatsApp.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Proof / social */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Users className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-widest">
              Trusted by trainers in Pune, Mumbai, and beyond
            </span>
          </div>
          <p className="mt-3 text-lg font-medium">
            "3 months. That's your average client's shelf life. Vecto is the
            first tool that changes that number."
          </p>
        </div>
      </section>

      {/* Pricing bar */}
      <section className="px-4 py-8">
        <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Smart · Free forever
            </p>
            <p className="mt-2 text-2xl font-extrabold">₹0</p>
            <p className="mt-1 text-sm text-muted-foreground">
              3 active clients · every feature unlocked
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Pro · Monthly
            </p>
            <p className="mt-2 text-2xl font-extrabold">₹499<span className="text-sm text-muted-foreground">/mo</span></p>
            <p className="mt-1 text-sm text-muted-foreground">Unlimited clients</p>
          </div>
          <div className="rounded-2xl border-2 border-primary/50 bg-primary/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Elite · Annual
            </p>
            <p className="mt-2 text-2xl font-extrabold">₹5,988<span className="text-sm text-muted-foreground">/yr</span></p>
            <p className="mt-1 text-sm text-muted-foreground">
              Unlimited · higher referral rewards
            </p>
          </div>
        </div>
      </section>

      {/* Lead form */}
      <section id="talk" className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold">
            Prefer we reach out?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Drop your details. We'll WhatsApp within 24 hours with a link to
            get you set up.
          </p>

          {submitted ? (
            <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
              <p className="font-semibold text-primary">Got it.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We'll WhatsApp you within 24 hours.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  Or start the chat now
                </a>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <div>
                <Label htmlFor="full_name">Full name *</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  maxLength={120}
                  required
                />
              </div>
              <div>
                <Label htmlFor="whatsapp_no">WhatsApp number *</Label>
                <Input
                  id="whatsapp_no"
                  inputMode="tel"
                  placeholder="10-digit number"
                  value={form.whatsapp_no}
                  onChange={(e) => setForm((f) => ({ ...f, whatsapp_no: e.target.value }))}
                  maxLength={20}
                  required
                />
              </div>
              <div>
                <Label htmlFor="instagram_handle">Instagram handle</Label>
                <Input
                  id="instagram_handle"
                  placeholder="@yourhandle"
                  value={form.instagram_handle}
                  onChange={(e) => setForm((f) => ({ ...f, instagram_handle: e.target.value }))}
                  maxLength={60}
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  maxLength={80}
                />
              </div>
              <div>
                <Label htmlFor="client_count_bucket">Active 1:1 clients</Label>
                <select
                  id="client_count_bucket"
                  value={form.client_count_bucket}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, client_count_bucket: e.target.value }))
                  }
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="0-1">Just starting</option>
                  <option value="2-5">2–5</option>
                  <option value="6-10">6–10</option>
                  <option value="11-15">11–15</option>
                  <option value="15+">15+</option>
                </select>
              </div>
              <div>
                <Label htmlFor="message">Anything to tell us? (optional)</Label>
                <Textarea
                  id="message"
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  maxLength={1000}
                />
              </div>
              <Button type="submit" className="w-full font-bold" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send me the WhatsApp'}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                By submitting, you agree to be contacted on WhatsApp about Vecto.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Vecto · <Link to="/" className="underline">Home</Link> ·{' '}
        <Link to="/terms" className="underline">Terms</Link>
      </footer>
    </div>
  );
}
