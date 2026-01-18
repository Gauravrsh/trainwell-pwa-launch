-- Definitive fix for repeated "trainers_public_no_rls" finding:
-- The object public.trainers_public is a VIEW (not a table), and RLS cannot be applied to views.
-- Since the app no longer uses this view (trainer discovery uses RPCs), we remove the view entirely.

DROP VIEW IF EXISTS public.trainers_public;