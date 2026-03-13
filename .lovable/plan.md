

## Diagnosis

| Field | Trainer (`vishujangid121@gmail.com`) | Client (`vishal.jangid8797@gmail.com`) |
|---|---|---|
| profile_id | `d0643f1a-...` | `2bcd8627-...` |
| role | trainer | client |
| trainer_id | null (correct) | **null (WRONG)** |
| full_name | Vishal Jangid | Jangid |

The client's `trainer_id` column is `null`. The RPC `get_trainer_clients()` returns clients where `trainer_id = trainer's profile id`. Since there's no link, the client doesn't show up.

## Fix

Run a single data update to set the client's `trainer_id` to the trainer's profile ID:

```sql
UPDATE profiles 
SET trainer_id = 'd0643f1a-d910-48b5-8548-e3d19f630318' 
WHERE id = '2bcd8627-65d4-4e2c-a0ff-d9d9faaa1427';
```

This is a data fix, not a schema change. After this, the client will appear in all trainer dropdowns (Create Plan, Calendar, Progress, etc.).

## Root Cause

The client likely signed up without using the trainer's invite link (which would have auto-set `trainer_id` during onboarding in `RoleSelection.tsx`). No code change is needed — the invite flow already handles this correctly when used.

