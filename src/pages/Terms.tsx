import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { ReferralTermsAccordion } from '@/components/referral/ReferralTermsAccordion';
import { ClientPlanAgreement } from '@/components/terms/ClientPlanAgreement';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function Terms() {
  const navigate = useNavigate();
  const { isTrainer, isClient } = useProfile();

  return (
    <div className="min-h-screen px-4 pt-12 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Terms & Conditions
            </h1>
            <p className="text-sm text-muted-foreground">
              Platform policies and agreements
            </p>
          </div>
        </div>
      </motion.div>

      {/* Terms Sections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {/* Client Plan Agreement — clients only, surfaced first so it's the
            first thing they see when they open Terms. */}
        {isClient && <ClientPlanAgreement />}

        {/* General Terms — everyone */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="general-tnc" className="border border-border rounded-2xl px-4 bg-card">
            <AccordionTrigger className="text-left py-4">
              <span className="text-sm font-semibold text-foreground">
                General Terms of Service
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-4 pb-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2">1. Acceptance of Terms</h4>
                <p>
                  By accessing or using Vecto, you agree to be bound by these Terms of Service
                  and all applicable laws and regulations. If you do not agree with any of these
                  terms, you are prohibited from using this platform.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">2. Account Responsibility</h4>
                <p>
                  You are responsible for maintaining the confidentiality of your account credentials
                  and for all activities that occur under your account. You must notify us immediately
                  of any unauthorized use of your account.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">3. User Conduct</h4>
                <p>
                  You agree to use Vecto only for lawful purposes and in a way that does not
                  infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of
                  the platform.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">4. Content Ownership</h4>
                <p>
                  All content you create (workout plans, client data, etc.) remains your intellectual
                  property. You grant Vecto a license to store and display this content as
                  necessary to provide our services.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Privacy Policy — everyone */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="privacy" className="border border-border rounded-2xl px-4 bg-card">
            <AccordionTrigger className="text-left py-4">
              <span className="text-sm font-semibold text-foreground">
                Privacy Policy
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-4 pb-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Data Collection</h4>
                <p>
                  We collect information you provide directly (profile data, workout logs, etc.)
                  and automatically (device info, usage patterns). This data helps us improve
                  your experience and provide personalized services.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Data Security</h4>
                <p>
                  Your data is encrypted and stored securely. We implement industry-standard
                  security measures to protect against unauthorized access, alteration, or
                  destruction of your personal information.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Data Sharing</h4>
                <p>
                  We do not sell your personal data. Trainer-client relationships are private,
                  and data is only shared between mapped trainers and clients as necessary
                  to provide training services.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Subscription Terms — TRAINER ONLY (clients don't pay Vecto). */}
        {isTrainer && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="subscription" className="border border-border rounded-2xl px-4 bg-card">
            <AccordionTrigger className="text-left py-4">
              <span className="text-sm font-semibold text-foreground">
                Subscription Terms
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-5 pb-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Plans Overview</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><span className="font-medium text-foreground">Smart (Free):</span> ₹0 forever — up to 3 active clients</li>
                  <li><span className="font-medium text-foreground">Pro (Monthly):</span> ₹999/month — unlimited clients</li>
                  <li><span className="font-medium text-foreground">Elite (Annual):</span> ₹9,999/year — 14 months access, unlimited clients</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Smart Plan (Free)</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>₹0, no expiry. All features available.</li>
                  <li>Hard limit: maximum 3 concurrent <strong>active</strong> training plans across all clients.</li>
                  <li>A client occupies a slot only while at least one of their plans is in <em>active</em> status. Completing or cancelling a plan frees the slot.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Pro Plan — ₹999/month</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>30 days validity from payment date + 3 days grace period.</li>
                  <li>Unlimited active clients during the validity window.</li>
                  <li>Auto-downgrades to Smart (Free) on grace expiry — existing data is retained, but trainer will need to select 3 clients on which to continue. Rest clients will get disabled.</li>
                  <li>Disabled clients are re-enabled as soon as the trainer renews the plan.</li>
                  <li>No refunds for partial months.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Elite Plan — ₹9,999/year</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>365 days base + 60 bonus days = <strong>425 days total validity</strong>.</li>
                  <li>Unlimited active clients.</li>
                  <li>Auto-downgrades to Smart (Free) on grace expiry — existing data is retained, but trainer will need to select 3 clients on which to continue. Rest clients will get disabled.</li>
                  <li>Disabled clients are re-enabled as soon as the trainer renews the plan.</li>
                  <li>Eligible for trainer referral rewards (per Referral T&C).</li>
                  <li>No refunds.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Beta Pricing Notice</h4>
                <p>
                  Prices shown are special launch pricing for early users. Subject to revision after
                  the beta period. Existing paid subscribers will continue at their paid rate until renewal.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Billing</h4>
                <p>
                  Subscriptions are billed at the start of each billing period (monthly or annual).
                  Payments are processed securely through our payment partner.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        )}

        {/* Calendar & Day-Mark Rules — everyone */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="calendar-rules" className="border border-border rounded-2xl px-4 bg-card">
            <AccordionTrigger className="text-left py-4">
              <span className="text-sm font-semibold text-foreground">
                Calendar &amp; Leave Rules
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-4 pb-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Day Mark Types</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><span className="font-medium text-foreground">Holiday (HL):</span> Informational. No impact on billing or plan validity.</li>
                  <li><span className="font-medium text-foreground">Client Leave (CL):</span> No impact on billing or validity — the clock keeps ticking. Counts as a missed session in trainer reporting.</li>
                  <li><span className="font-medium text-foreground">Trainer Leave (TL):</span> Extends the active plan's end date by 1 day per TL marked. Reverses on un-mark.</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Logging Rules</h4>
                <p>
                  Logging is allowed for today and future dates only. Past dates are locked
                  to enforce discipline and prevent backdating.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Referral Terms - Trainers Only */}
        {isTrainer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ReferralTermsAccordion />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
