import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { MessageCircle, RefreshCcw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAuth } from '@/hooks/useAuth';
import { logError } from '@/lib/errorUtils';

type LeadStatus = 'new' | 'dm_sent' | 'call_booked' | 'activated' | 'dead';

interface Lead {
  id: string;
  full_name: string;
  whatsapp_no: string;
  instagram_handle: string | null;
  city: string | null;
  client_count_bucket: string | null;
  message: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  referrer_url: string | null;
  status: LeadStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_META: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-primary/20 text-primary' },
  dm_sent: { label: 'DM sent', className: 'bg-blue-500/20 text-blue-400' },
  call_booked: { label: 'Call booked', className: 'bg-amber-500/20 text-amber-400' },
  activated: { label: 'Activated', className: 'bg-emerald-500/20 text-emerald-400' },
  dead: { label: 'Dead', className: 'bg-muted text-muted-foreground' },
};

const STATUS_ORDER: LeadStatus[] = ['new', 'dm_sent', 'call_booked', 'activated', 'dead'];

export default function AdminLeads() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trainer_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLeads((data as Lead[]) ?? []);
    } catch (err) {
      logError('AdminLeads.fetch', err);
      toast.error('Failed to load leads.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !roleLoading && isAdmin) fetchLeads();
  }, [authLoading, roleLoading, isAdmin, fetchLeads]);

  const filtered = useMemo(
    () => (filter === 'all' ? leads : leads.filter((l) => l.status === filter)),
    [leads, filter]
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: leads.length };
    STATUS_ORDER.forEach((s) => (map[s] = 0));
    for (const l of leads) map[l.status] = (map[l.status] ?? 0) + 1;
    return map;
  }, [leads]);

  const updateLead = async (id: string, patch: Partial<Pick<Lead, 'status' | 'admin_notes'>>) => {
    try {
      const { error } = await supabase.from('trainer_leads').update(patch).eq('id', id);
      if (error) throw error;
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
      toast.success('Updated.');
    } catch (err) {
      logError('AdminLeads.update', err);
      toast.error('Failed to update.');
    }
  };

  if (authLoading || roleLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-6 text-center">
        <h1 className="text-2xl font-bold">Not authorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This area is for Vecto admins only.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur safe-top">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 p-4">
          <div>
            <h1 className="text-lg font-bold">Trainer leads</h1>
            <p className="text-xs text-muted-foreground">
              {counts.all} total · {counts.new} new
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchLeads} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="mx-auto flex max-w-4xl gap-2 overflow-x-auto px-4 pb-3">
          {(['all', ...STATUS_ORDER] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${
                filter === s
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_META[s].label} · {counts[s] ?? 0}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">No leads yet.</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Share <code className="rounded bg-muted px-1">/for-trainers?utm_source=ig&amp;utm_campaign=…</code> in your IG bio.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((lead) => {
              const meta = STATUS_META[lead.status];
              const isOpen = expanded === lead.id;
              const waHref = `https://wa.me/${lead.whatsapp_no.replace(/\D/g, '')}`;
              return (
                <li key={lead.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold">{lead.full_name}</p>
                        <Badge className={meta.className}>{meta.label}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {format(new Date(lead.created_at), 'dd MMM yyyy, HH:mm')} ·{' '}
                        {lead.city || 'City ?'} · {lead.client_count_bucket || '—'}
                      </p>
                      <p className="mt-1 text-sm">
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          {lead.whatsapp_no}
                        </a>
                        {lead.instagram_handle && (
                          <span className="ml-3 text-muted-foreground">
                            IG: {lead.instagram_handle}
                          </span>
                        )}
                      </p>
                      {(lead.utm_source || lead.utm_campaign) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          src: {lead.utm_source || '—'} · camp: {lead.utm_campaign || '—'}
                          {lead.utm_content ? ` · ${lead.utm_content}` : ''}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setExpanded(isOpen ? null : lead.id)}
                      className="rounded-md border border-border p-1 text-muted-foreground"
                      aria-label={isOpen ? 'Collapse' : 'Expand'}
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {isOpen && (
                    <div className="mt-4 space-y-4 border-t border-border pt-4">
                      {lead.message && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Their message
                          </p>
                          <p className="mt-1 text-sm">{lead.message}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Status
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {STATUS_ORDER.map((s) => (
                            <button
                              key={s}
                              onClick={() => updateLead(lead.id, { status: s })}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                lead.status === s
                                  ? 'border-primary bg-primary/15 text-primary'
                                  : 'border-border text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {STATUS_META[s].label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <NotesEditor
                        initial={lead.admin_notes || ''}
                        onSave={(notes) => updateLead(lead.id, { admin_notes: notes })}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

function NotesEditor({ initial, onSave }: { initial: string; onSave: (v: string) => Promise<void> | void }) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => setValue(initial), [initial]);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Notes (admin only)
      </p>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        maxLength={2000}
        className="mt-1"
      />
      <div className="mt-2 flex justify-end">
        <Button
          size="sm"
          disabled={saving || value === initial}
          onClick={async () => {
            setSaving(true);
            await onSave(value);
            setSaving(false);
          }}
        >
          {saving ? 'Saving…' : 'Save notes'}
        </Button>
      </div>
    </div>
  );
}
