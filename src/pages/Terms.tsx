import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { ReferralTermsAccordion } from '@/components/referral/ReferralTermsAccordion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function Terms() {
  const navigate = useNavigate();
  const { isTrainer } = useProfile();

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
        {/* General Terms */}
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
                  By accessing or using TrainWell, you agree to be bound by these Terms of Service 
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
                  You agree to use TrainWell only for lawful purposes and in a way that does not 
                  infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of 
                  the platform.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">4. Content Ownership</h4>
                <p>
                  All content you create (workout plans, client data, etc.) remains your intellectual 
                  property. You grant TrainWell a license to store and display this content as 
                  necessary to provide our services.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Privacy Policy */}
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

        {/* Subscription Terms */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="subscription" className="border border-border rounded-2xl px-4 bg-card">
            <AccordionTrigger className="text-left py-4">
              <span className="text-sm font-semibold text-foreground">
                Subscription Terms
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-4 pb-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Free Trial</h4>
                <p>
                  New trainers receive a 14-day free trial with access to manage up to 3 clients. 
                  After the trial period, a paid subscription is required to continue using 
                  trainer features.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Billing</h4>
                <p>
                  Subscriptions are billed at the start of each billing period (monthly or annual). 
                  Payments are processed securely through our payment partner.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Cancellation</h4>
                <p>
                  You may cancel your subscription at any time. Access continues until the end 
                  of your current billing period. No refunds are provided for partial periods.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Grace Period</h4>
                <p>
                  After subscription expiry, you have a 3-day grace period to renew. During this 
                  time, you can view data but cannot add new clients or create new plans.
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
