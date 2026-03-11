

# Dummy Data Generation Plan for Progress Module Testing

## Client Profile
| Field | Value |
|-------|-------|
| Email | gauravrsh123@gmail.com |
| Profile ID | cd088554-c0db-4d77-a698-535f4ccf151a |
| Current BMR | null (will set to 1850) |

---

## Data Generation Parameters

### Date Range
- **Period:** 30 days (2026-01-01 to 2026-01-31)
- **Missed Days:** 2-3 scattered days (no food or workout logs)

### Weight Trend
| Parameter | Value |
|-----------|-------|
| Starting Weight | 90.00 kg (Jan 1) |
| Ending Weight | 87.00 kg (Jan 31) |
| Average Daily Decline | ~0.10 kg |
| Logging Frequency | Daily (30 entries) |
| Pattern | Generally declining with minor daily fluctuations (+/- 0.2 kg) |

### Calorie Expenditure
| Component | Range |
|-----------|-------|
| BMR | 1850 cal (fixed) |
| Active Burn | 600-800 cal/day |
| **Total Expenditure** | **2450-2650 cal/day** |

### Calorie Intake (Adjusted to hit deficit target)
| Meal | Calorie Range |
|------|---------------|
| Breakfast | 500-600 cal |
| Lunch | 600-700 cal |
| Dinner | 650-750 cal |
| Snack | 200-250 cal |
| **Daily Total** | **1950-2300 cal** |

### Net Deficit Target
| Target | Range |
|--------|-------|
| Most days | 300-500 cal deficit |
| Some days | 500-800 cal deficit (occasional) |

---

## Data Cleanup (Before Insert)

1. Delete existing food_logs for this client
2. Delete existing workouts for this client  
3. Delete existing weight_logs for this client
4. Update profile BMR to 1850

---

## Sample Data Distribution

### 30-Day Pattern Overview

```text
Day 01-05:  Weight 90.0 → 89.5 kg | Normal logging
Day 06:     MISSED (no food/workout logs) | Weight still logged
Day 07-14:  Weight 89.4 → 88.8 kg | Normal logging
Day 15:     MISSED (no food/workout logs) | Weight still logged  
Day 16-23:  Weight 88.7 → 87.9 kg | Normal logging
Day 24:     MISSED (no food/workout logs) | Weight still logged
Day 25-31:  Weight 87.8 → 87.0 kg | Normal logging
```

### Weight Progression (with realistic variation)

| Day | Target Weight | Notes |
|-----|--------------|-------|
| 1 | 90.00 kg | Starting weight |
| 5 | 89.50 kg | |
| 10 | 89.00 kg | |
| 15 | 88.50 kg | |
| 20 | 88.00 kg | |
| 25 | 87.50 kg | |
| 31 | 87.00 kg | Ending weight |

---

## Technical Implementation

### 1. Update Profile BMR
```sql
UPDATE profiles 
SET bmr = 1850, bmr_updated_at = NOW() 
WHERE id = 'cd088554-c0db-4d77-a698-535f4ccf151a';
```

### 2. Clear Existing Data
```sql
DELETE FROM food_logs WHERE client_id = 'cd088554-c0db-4d77-a698-535f4ccf151a';
DELETE FROM workouts WHERE client_id = 'cd088554-c0db-4d77-a698-535f4ccf151a';
DELETE FROM weight_logs WHERE client_id = 'cd088554-c0db-4d77-a698-535f4ccf151a';
```

### 3. Insert Weight Logs (30 entries)
Daily weight entries with ~0.10 kg decline per day + minor fluctuations

### 4. Insert Food Logs (27 days x 4 meals = 108 entries)
Skip 3 missed days (days 6, 15, 24)

### 5. Insert Workouts (27 entries)
Skip 3 missed days, with calories_burnt 600-800

---

## Weight Decimal Fix (Side Remark)

The `weight_logs.weight_kg` column is already `numeric` type which supports decimals. The `profiles.weight_kg` is also `numeric`. No database changes needed.

However, I'll verify the frontend inputs allow decimal values (2 decimal places) for weight entry.

---

## Expected Results After Data Generation

### Action Chart (Intake vs Expenditure)
- 27 days of stacked bars (intake + expenditure)
- 3 red "Missed" bars on days 6, 15, 24
- Net deficit line hovering in 300-800 range
- Most deficit points clustered around 300-500

### Outcome Chart (Weight Trend)
- Continuous declining line from 90 → 87 kg
- Minor daily fluctuations for realism
- Net deficit area shaded below the weight line

### Quick Stats
- Avg Deficit: ~400-500 cal
- Days Logged: 27
- Days Missed: 3
- Weight Change: -3.0 kg

