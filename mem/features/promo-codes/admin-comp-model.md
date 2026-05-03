---
name: Promo codes admin comp model
description: Backend-only promo system; service-role-gated RPC creates comp subscriptions; trainers see no trace
type: feature
---
- Tables: `promo_codes` (code, discount_type, discount_value, plan_type [monthly|annual], valid_from/until, max_redemptions_total, max_redemptions_per_trainer, is_active, redemption_count) and `promo_redemptions` (audit). Both deny ALL for anon/authenticated — service-role only via SQL panel.
- RPC: `admin_redeem_promo_code(p_code, p_trainer_id, p_start_date DEFAULT CURRENT_DATE)` returns the new `trainer_platform_subscriptions` row. Hard guard rejects non-service-role callers; EXECUTE revoked from PUBLIC/anon/authenticated.
- Effect: always grants a fresh comp subscription (status='active', amount=0, payment_status='comp'). Duration = 30d (monthly) or 365d (annual); if discount_type='extension_days' adds discount_value extra days. discount_type=percent/flat is persisted for future checkout integration but currently has no pricing impact.
- Single plan per code. Per-trainer cap default 1 (configurable). Global cap NULL = unlimited.
- Admin workflow is pure SQL: INSERT into promo_codes, then SELECT admin_redeem_promo_code(...). No UI built; foundation ready for future admin panel.
- No frontend changes; works alongside has_active_platform_subscription() automatically.
