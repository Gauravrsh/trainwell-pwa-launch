import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

/**
 * Item 1 — Client-facing Plan Agreement.
 *
 * A tabular summary of the binary contract between Vecto, the client, and
 * the trainer. Designed to be skim-readable: rows = obligations, columns =
 * who owns the obligation. Sits inside the Terms page when the viewer is
 * a client.
 */
export function ClientPlanAgreement() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem
        value="client-plan-agreement"
        className="border border-border rounded-2xl px-4 bg-card"
      >
        <AccordionTrigger className="text-left py-4">
          <span className="text-sm font-semibold text-foreground">
            Plan Agreement (Client)
          </span>
        </AccordionTrigger>
        <AccordionContent className="text-sm text-muted-foreground space-y-5 pb-6">
          <p>
            Vecto is a tracking tool. Your trainer designs the plan, you do the work,
            and the app keeps both sides honest. This agreement summarises who owns
            what — there is no ambiguity by design.
          </p>

          {/* Responsibility matrix */}
          <div className="rounded-xl overflow-hidden border border-border">
            <div className="grid grid-cols-3 bg-secondary/80 text-xs font-semibold text-muted-foreground text-center">
              <div className="px-3 py-2.5 border-r border-border">Obligation</div>
              <div className="px-3 py-2.5 border-r border-border">You</div>
              <div className="px-3 py-2.5">Your Trainer</div>
            </div>
            <div className="divide-y divide-border bg-card">
              <Row obligation="Plan design (workouts, nutrition)" client="—" trainer="✓" />
              <Row obligation="Show up &amp; execute the plan" client="✓" trainer="—" />
              <Row obligation="Log workout / meals on time" client="✓" trainer="—" />
              <Row obligation="Mark sessions complete / missed" client="✓" trainer="—" />
              <Row obligation="Mark Trainer Leave (TL) / Holidays" client="—" trainer="✓" />
              <Row obligation="Mark Client Leave (CL)" client="—" trainer="✓" />
              <Row obligation="Pay the trainer (per their billing terms)" client="✓" trainer="—" />
              <Row obligation="Provide tools, data &amp; uptime" client="—" trainer="—" highlight />
            </div>
            <div className="bg-primary/10 px-3 py-2 text-xs text-primary font-medium border-t border-primary/20">
              The last row is owned by Vecto. Everything else is between you and your trainer.
            </div>
          </div>

          {/* The non-negotiables */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">House Rules</h4>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Logging is allowed for <strong>today only</strong>. Past dates are locked — no backdating.</li>
              <li>If you mark a session missed, it stays missed. The mirror doesn't lie.</li>
              <li>Holidays (HL) and Client Leave (CL) do <strong>not</strong> extend your plan validity.</li>
              <li>Trainer Leave (TL) extends your plan end date by 1 day per TL.</li>
              <li>Your trainer can see every log. That is the entire point.</li>
            </ul>
          </div>

          {/* Cost & cancellation */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">Cost &amp; Cancellation</h4>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>The Vecto app is <strong>free for clients</strong>. You pay your trainer directly for coaching — Vecto does not collect that fee.</li>
              <li>Plan duration, sessions, and price are agreed between you and your trainer. They are recorded in your plan card.</li>
              <li>If your trainer's subscription lapses, your account moves to read-only mode until they renew. Your data is preserved.</li>
              <li>You can request to be unlinked from a trainer at any time by asking them — they own the mapping.</li>
            </ul>
          </div>

          {/* Data */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">Your Data</h4>
            <p>
              Your logs, weights, and meals are visible only to you and your mapped
              trainer. Vecto does not sell client data. See the Privacy Policy section
              for full details.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function Row({
  obligation,
  client,
  trainer,
  highlight,
}: {
  obligation: string;
  client: string;
  trainer: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-3 text-xs text-center ${
        highlight ? 'bg-primary/5 border-l-2 border-l-primary' : ''
      }`}
    >
      <div className="px-3 py-2.5 border-r border-border text-foreground text-left">
        {/* dangerouslySet to allow the &amp; entity to render literally if used */}
        <span dangerouslySetInnerHTML={{ __html: obligation }} />
      </div>
      <div
        className={`px-3 py-2.5 border-r border-border ${
          client === '✓' ? 'text-primary font-semibold' : 'text-muted-foreground'
        }`}
      >
        {client}
      </div>
      <div
        className={`px-3 py-2.5 ${
          trainer === '✓' ? 'text-primary font-semibold' : 'text-muted-foreground'
        }`}
      >
        {trainer}
      </div>
    </div>
  );
}