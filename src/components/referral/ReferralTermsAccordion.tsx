import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function ReferralTermsAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="referral-tnc" className="border border-border rounded-2xl px-4 bg-card">
        <AccordionTrigger className="text-left py-4">
          <span className="text-sm font-semibold text-foreground">
            Referral Program Terms & Conditions
          </span>
        </AccordionTrigger>
        <AccordionContent className="text-sm text-muted-foreground space-y-6 pb-6">
          {/* The Core Offer */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">1. The Core Offer</h4>
            <p>
              The Program allows existing TrainWell Trainers ("Referrers") to earn subscription 
              validity extensions by referring new Trainers ("Referees") who successfully 
              subscribe to a paid plan.
            </p>
          </div>

          {/* Referral Benefit Matrix */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">2. Referral Benefit Matrix</h4>
            <p className="mb-3">
              Benefits are determined by the Referrer's current plan status and the Referee's 
              chosen plan at the time of successful payment.
            </p>
            {/* Elite Trainer Reward - Featured */}
            <div className="relative mb-3 p-3 rounded-xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border border-primary/30 overflow-hidden">
              <div className="absolute -top-px -right-px">
                <div className="bg-primary text-primary-foreground text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl-lg rounded-tr-lg">
                  Best Value
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <span className="text-lg">⭐</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">Elite Trainer Reward</p>
                  <p className="text-[10px] text-muted-foreground">Annual → Annual</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">+90</span>
                  <span className="text-xs font-semibold text-primary ml-0.5">Days</span>
                </div>
              </div>
            </div>

            {/* Standard Rewards Table */}
            <div className="rounded-xl overflow-hidden border border-border">
              {/* Table Header */}
              <div className="grid grid-cols-3 bg-secondary/80 text-xs font-semibold text-muted-foreground text-center">
                <div className="px-3 py-2.5 border-r border-border">Your Plan</div>
                <div className="px-3 py-2.5 border-r border-border">Referee's Plan</div>
                <div className="px-3 py-2.5">Your Reward</div>
              </div>
              {/* Table Body */}
              <div className="divide-y divide-border bg-card">
                <div className="grid grid-cols-3 text-xs text-center">
                  <div className="px-3 py-2.5 border-r border-border text-foreground">Monthly</div>
                  <div className="px-3 py-2.5 border-r border-border text-foreground">Monthly</div>
                  <div className="px-3 py-2.5 text-primary font-semibold">+15 Days</div>
                </div>
                <div className="grid grid-cols-3 text-xs text-center">
                  <div className="px-3 py-2.5 border-r border-border text-foreground">Monthly</div>
                  <div className="px-3 py-2.5 border-r border-border text-foreground">Annual</div>
                  <div className="px-3 py-2.5 text-primary font-semibold">+30 Days</div>
                </div>
                <div className="grid grid-cols-3 text-xs text-center">
                  <div className="px-3 py-2.5 border-r border-border text-foreground">Annual</div>
                  <div className="px-3 py-2.5 border-r border-border text-foreground">Monthly</div>
                  <div className="px-3 py-2.5 text-primary font-semibold">+30 Days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Eligibility */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">3. Eligibility & Trigger Points</h4>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>Active Status:</strong> Referrers must have an active paid subscription to earn rewards.</li>
              <li><strong>Payment Requirement:</strong> Rewards are only triggered upon the successful completion of the Referee's first payment.</li>
              <li><strong>Elite Tier Access:</strong> The 90-Day Extension is reserved for Referrers on an Annual Plan.</li>
              <li><strong>No Retroactive Credit:</strong> If you upgrade to Annual, previous referrals won't be adjusted to Elite rates.</li>
              <li><strong>Referee Bonus:</strong> Referees get 14 extra days added to their first subscription period.</li>
            </ul>
          </div>

          {/* Activity Guardrail */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">4. The Activity Guardrail</h4>
            <p className="mb-2">
              To ensure the platform remains a community of active professionals:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>Activity Definition:</strong> Any verified interaction with a mapped Client (workout logs, food reviews, payments).</li>
              <li><strong>90-Day Grace Period:</strong> You may remain inactive for up to 90 days without impact.</li>
              <li><strong>Inactivity Penalty:</strong> On the 91st day of inactivity, 90 days will be deducted from referral-credited validity only.</li>
              <li><strong>Daily Erosion:</strong> After 91 days, each subsequent inactive day reduces validity by 1 day.</li>
              <li><strong>Reset:</strong> Any verified activity resets the inactivity clock to zero.</li>
            </ul>
          </div>

          {/* Limitations */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">5. Limitations & Legalities</h4>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>Non-Transferable:</strong> Extensions have no cash value and cannot be transferred or sold.</li>
              <li><strong>Uncapped:</strong> No limit on total validity you can accrue through referrals.</li>
              <li><strong>Fair Usage:</strong> TrainWell may limit AI features if usage exceeds reasonable benchmarks.</li>
              <li><strong>Program Modification:</strong> TrainWell reserves the right to modify this program with 30 days' notice.</li>
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
