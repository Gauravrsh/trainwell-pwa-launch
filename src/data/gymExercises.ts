// Master Exercise Vault for Vecto
// Organized by Category > Sub-Category > Exercises

import type { MetricType } from "@/types/exerciseMetrics";

export interface ExerciseCategory {
  category: string;
  subcategories: {
    name: string;
    exercises: string[];
  }[];
}

export const exerciseDatabase: ExerciseCategory[] = [
  {
    category: "Strength & Weight Training (Free Weights)",
    subcategories: [
      {
        name: "Chest",
        exercises: [
          "Barbell Flat Bench Press",
          "Barbell Incline Bench Press",
          "Barbell Decline Bench Press",
          "Dumbbell Flat Bench Press",
          "Dumbbell Incline Bench Press",
          "Dumbbell Decline Bench Press",
          "Dumbbell Flat Flyes",
          "Dumbbell Incline Flyes",
          "Dumbbell Decline Flyes",
          "Weighted Chest Dips",
          "Dumbbell Pullovers",
          "Barbell Pullovers",
          "Dumbbell Floor Press",
          "Barbell Floor Press",
          "Svend Press (Plate Squeeze)",
          "Landmine Chest Press",
          "Close-Grip Dumbbell Press (Hex Press)",
          "Around the Worlds (Dumbbell)",
          "Weighted Archer Push-ups",
          "Incline Dumbbell Squeeze Press",
        ],
      },
      {
        name: "Back",
        exercises: [
          "Conventional Barbell Deadlift",
          "Sumo Barbell Deadlift",
          "Barbell Bent-Over Rows (Overhand)",
          "Barbell Bent-Over Rows (Underhand/Yates)",
          "One-Arm Dumbbell Rows (Sawyer Rows)",
          "Weighted Pull-ups (Wide Grip)",
          "Weighted Chin-ups (Neutral/Underhand)",
          "T-Bar Rows (Barbell Corner)",
          "Pendlay Rows",
          "Barbell Shrugs",
          "Dumbbell Shrugs",
          "Meadows Rows (Landmine)",
          "Seal Rows (Dumbbell/Barbell)",
          "Kroc Rows (High Rep Dumbbell)",
          "Barbell Good Mornings",
          "Dumbbell Renegade Rows",
          "Gorilla Rows (Dumbbell/Kettlebell)",
          "Rack Pulls (Above Knee)",
          "Weighted Inverted Rows",
          "Reverse Dumbbell Flyes",
          "Prone Hyperextension (Bodyweight)",
          "Weighted Prone Hyperextension",
        ],
      },
      {
        name: "Shoulders",
        exercises: [
          "Standing Barbell Overhead Press (OHP)",
          "Seated Barbell Overhead Press",
          "Seated Dumbbell Overhead Press",
          "Arnold Press (Dumbbell)",
          "Dumbbell Lateral Raises",
          "Dumbbell Front Raises (Hammer/Pronated)",
          "Seated Dumbbell Rear Delt Flyes",
          "Barbell Upright Rows",
          "Dumbbell Upright Rows",
          "Barbell Push Press",
          "Landmine Viking Press",
          "Dumbbell Lu Raises",
          "Barbell Z-Press (Seated on Floor)",
          "Face Pulls (Dumbbell/Plate)",
          "Weighted Handstand Push-ups",
          "Dumbbell Scaption",
          "Plate Bus Drivers",
          "Cuban Press (Dumbbell)",
          "Bradford Press (Barbell)",
          "Snatch Grip High Pull",
          "Prone IYTW (Weighted)",
        ],
      },
      {
        name: "Biceps",
        exercises: [
          "Barbell Curls (Straight Bar)",
          "EZ Bar Curls",
          "Dumbbell Alternate Bicep Curls",
          "Dumbbell Hammer Curls",
          "Dumbbell Concentration Curls",
          "Preacher Curls (EZ Bar)",
          "Preacher Curls (Dumbbell)",
          "Spider Curls (Incline Bench)",
          "Incline Dumbbell Curls",
          "Zottman Curls",
          "Reverse Barbell Curls",
          "21s (Barbell Curl Method)",
          "Drag Curls (Barbell)",
          "Cross-Body Hammer Curls",
          "Waiter Curls (Dumbbell)",
          "Plate Curls",
          "Bayesian Curls (Dumbbell variation)",
          "Cheat Curls (Heavy Barbell)",
          "Close Grip Barbell Curls",
          "Wide Grip Barbell Curls",
        ],
      },
      {
        name: "Triceps",
        exercises: [
          "Close-Grip Barbell Bench Press",
          "Skull Crushers (EZ Bar)",
          "Dumbbell Overhead Extensions (Two-Hand)",
          "Dumbbell Overhead Extensions (Single-Arm)",
          "Dumbbell Kickbacks",
          "Weighted Bench Dips",
          "Weighted Parallel Bar Dips (Tricep Focus)",
          "Tate Press (Dumbbell)",
          "JM Press (Barbell)",
          "California Press",
          "French Press (EZ Bar)",
          "Dumbbell Power Extensions",
          "Close-Grip Dumbbell Floor Press",
          "Weighted Diamond Push-ups",
          "Barbell Overhead Tricep Extension (Standing)",
          "Single-Arm Dumbbell Floor Press",
          "Neutral Grip Dumbbell Press",
          "Katana Extensions (Dumbbell)",
          "Decline EZ Bar Tricep Extensions",
          "Barbell Tricep Press to Chin",
        ],
      },
      {
        name: "Legs (Lower Body)",
        exercises: [
          "Barbell Back Squats (High Bar)",
          "Barbell Back Squats (Low Bar)",
          "Barbell Front Squats",
          "Barbell Romanian Deadlifts (RDL)",
          "Dumbbell Walking Lunges",
          "Barbell Bulgarian Split Squats",
          "Dumbbell Bulgarian Split Squats",
          "Dumbbell Goblet Squats",
          "Zercher Squats (Barbell)",
          "Barbell Box Squats",
          "Dumbbell Step-Ups",
          "Stiff-Legged Deadlift (Barbell)",
          "Dumbbell Sumo Squats",
          "Barbell Hack Squats (Behind the back)",
          "Weighted Cossack Squats",
          "Curtsy Lunges (Dumbbell)",
          "Barbell Kang Squats",
          "Dumbbell Romanian Deadlifts",
          "Weighted Sissy Squats (Bodyweight/Plate)",
          "Barbell Overhead Squats",
        ],
      },
    ],
  },
  {
    category: "Machine-Based Training",
    subcategories: [
      {
        name: "Upper Body (Push/Pull/Shoulder)",
        exercises: [
          "Machine Chest Press (Vertical)",
          "Machine Incline Chest Press",
          "Pec Deck Flyes (Butterfly)",
          "Cable Crossover (High to Low)",
          "Cable Crossover (Low to High)",
          "Lat Pulldowns (Wide Grip)",
          "Lat Pulldowns (Close Grip V-Bar)",
          "Seated Cable Rows (Neutral Grip)",
          "Cable Tricep Pushdowns (Straight Bar)",
          "Cable Tricep Pushdowns (Rope)",
          "Cable Bicep Curls (Straight Bar)",
          "Cable Hammer Curls (Rope)",
          "Cable Lateral Raises (Single Arm)",
          "Machine Shoulder Press",
          "Assisted Pull-up Machine",
          "Assisted Dip Machine",
          "Cable Face Pulls (Rope)",
          "Hammer Strength Iso-Lateral Row",
          "Hammer Strength Iso-Lateral Chest Press",
          "Cable Woodchoppers",
          "Banded IYTW (Standing, Cable/Band)",
        ],
      },
      {
        name: "Lower Body",
        exercises: [
          "Leg Press (45-Degree)",
          "Horizontal Leg Press Machine",
          "Leg Extensions",
          "Lying Leg Curls",
          "Seated Leg Curls",
          "Standing Single-Leg Curls",
          "Smith Machine Squats",
          "Smith Machine Romanian Deadlifts",
          "Smith Machine Lunges",
          "Hack Squat Machine",
          "V-Squat Machine",
          "Pendulum Squat Machine",
          "Standing Machine Calf Raises",
          "Seated Machine Calf Raises",
          "Hip Abductor Machine (Outer Thigh)",
          "Hip Adductor Machine (Inner Thigh)",
          "Machine Glute Drive (Hip Thrust Machine)",
          "Donkey Calf Raise Machine",
          "Sissy Squat Machine (Bench)",
          "Belt Squat Machine",
        ],
      },
    ],
  },
  {
    category: "Functional & Dynamics",
    subcategories: [
      {
        name: "Power, Explosion & Dynamics",
        exercises: [
          "Kettlebell Swings (Russian)",
          "Kettlebell Swings (American)",
          "Box Jumps (Static Start)",
          "Medicine Ball Slams",
          "Battle Rope (Alternating Waves)",
          "Battle Rope (Double Slams)",
          "Dumbbell Thrusters",
          "Barbell Thrusters",
          "Barbell Clean and Press",
          "Medicine Ball Wall Balls",
          "Dumbbell Snatch (Single Arm)",
          "Kettlebell Clean and Jerk",
          "Devil Press (Dumbbell)",
          "Turkish Get-Up (Dumbbell/Kettlebell)",
          "Farmers Walk (Dumbbell/Trap Bar)",
          "Sandbag Carries",
          "Tire Flips",
          "Sledgehammer Tyre Hits",
          "Explosive Box Step-Ups",
          "Broad Jumps (Distance)",
        ],
      },
      {
        name: "Bodyweight Dynamics",
        exercises: [
          "Standard Push-ups",
          "Diamond Push-ups",
          "Wide Grip Push-ups",
          "Pike Push-ups",
          "Hindu Push-ups (Dand)",
          "Standard Pull-ups",
          "Muscle-Ups (Bar/Ring)",
          "Air Squats (Bodyweight)",
          "Jump Squats",
          "Jump Lunges",
          "Standard Burpees",
          "Chest-to-Floor Burpees",
          "Bear Crawls",
          "Spiderman Crawls",
          "Mountain Climbers (Explosive)",
          "Bench Dips (Bodyweight)",
          "Inverted Rows (Bodyweight)",
          "Pistol Squats (Assisted/Unassisted)",
          "Plank-to-Pushup (Commandos)",
          "Star Jumps",
          "Prone IYTW (Bodyweight)",
          "Standing IYTW (Bodyweight)",
        ],
      },
    ],
  },
  {
    category: "HIIT (High-Intensity Interval Training)",
    subcategories: [
      {
        name: "Full Body High Intensity",
        exercises: [
          "Mountain Climbers (High Speed)",
          "High Knees (Running in place)",
          "Jumping Jacks",
          "Sprint Intervals (Treadmill)",
          "Assault Bike Sprints",
          "Rowing Machine Sprints",
          "Skater Jumps",
          "Tuck Jumps",
          "Burpee Broad Jumps",
          "Plank Jacks",
          "Bear Squats",
          "Lateral Shuffles (Fast Pace)",
          "Toe Taps (On Box/Step)",
          "Butt Kicks",
          "Speed Rope Jumping",
          "Shadow Boxing (High Intensity)",
          "Thrusters (Light/High Speed)",
          "Medicine Ball Rotational Throws",
          "Plank Shoulder Taps (Fast)",
          "Frog Jumps",
        ],
      },
    ],
  },
  {
    category: "Mobility & Flexibility",
    subcategories: [
      {
        name: "Spine, Torso & Lower Body",
        exercises: [
          "Cat-Cow Stretch",
          "Cobra Pose (Bhujangasana)",
          "Thoracic Spine Rotations (Open Book)",
          "Child's Pose (Balasana)",
          "Bird-Dog (Alternating)",
          "Scapular Shrugs (Hanging/Floor)",
          "Thread the Needle (Thoracic Mobility)",
          "World's Greatest Stretch",
          "Pigeon Pose (Hip focus)",
          "Deep Squat Hold (Malasana)",
          "90/90 Hip Switches",
          "Hamstring Wall Stretch",
          "Couch Stretch (Quad/Hip Flexor)",
          "Frog Stretch (Adductor)",
          "Ankle Wall Mobilization",
          "Wrist Circles and Stretches",
          "Shoulder Dislocates (PVC Pipe/Band)",
          "Scorpion Stretch (Lying)",
          "Iron Cross (Lying Spine Mobility)",
          "Adductor Rock-backs",
          "Mountain Pose / Tadasana Hold",
          "Adductor Stretch (Seated Butterfly)",
        ],
      },
    ],
  },
  {
    category: "Pilates & Core Stability",
    subcategories: [
      {
        name: "Core, Abs & Pilates",
        exercises: [
          "Forearm Plank (Hold)",
          "Side Plank (Left/Right)",
          "Hanging Leg Raises",
          "Hanging Knee Raises",
          "Deadbugs (Slow & Controlled)",
          "Russian Twists (Weighted/Unweighted)",
          "Bicycle Crunches",
          "Flutter Kicks",
          "The Hundred (Pilates)",
          "Pilates Scissor Kicks",
          "Glute Bridges (Double Leg)",
          "Glute Bridges (Single Leg)",
          "Supermans (Back Extension)",
          "Swimmer Extensions (Lying)",
          "Hollow Body Hold",
          "V-Sits (Jackknife)",
          "Lying Leg Raises (Lower Abs)",
          "Reverse Crunches",
          "Windshield Wipers (Lying)",
          "Heel Touches (Penguin Crunches)",
        ],
      },
    ],
  },
  {
    category: "Cardio & Endurance",
    subcategories: [
      {
        name: "Cardio Machines & Sports",
        exercises: [
          "Outdoor Running",
          "Treadmill Running",
          "Treadmill Walking",
          "Treadmill Incline Walk",
          "Outdoor Cycling",
          "Stationary Bike",
          "Spin Bike Intervals",
          "Assault Bike (Air Bike)",
          "Indoor Rowing (Erg)",
          "SkiErg",
          "Stair Climber (Stepmill)",
          "Elliptical Trainer",
          "Arc Trainer",
          "Jump Rope - Steady Pace",
          "Jump Rope - Double Unders",
          "Swimming - Freestyle",
          "Swimming - Breaststroke",
          "Swimming - Backstroke",
          "Swimming - Butterfly",
          "Open Water Swim",
          "Hill Sprints",
          "Track Sprints (100m / 200m / 400m)",
          "Stadium Stair Run",
          "Hiking / Trekking",
          "Boxing - Bag Round (3 min)",
        ],
      },
    ],
  },
];

// Flat list of all exercise names for autocomplete/search
export const gymExercises: string[] = exerciseDatabase.flatMap((cat) =>
  cat.subcategories.flatMap((sub) => sub.exercises)
);

// All category names
export const exerciseCategories = exerciseDatabase.map((c) => c.category);

// All unique subcategory names
export const exerciseSubcategories = exerciseDatabase.flatMap((c) =>
  c.subcategories.map((s) => s.name)
);

// Lookup: get exercises by category and optional subcategory
export function getExercisesByCategory(
  category: string,
  subcategory?: string
): string[] {
  const cat = exerciseDatabase.find((c) => c.category === category);
  if (!cat) return [];
  if (subcategory) {
    const sub = cat.subcategories.find((s) => s.name === subcategory);
    return sub ? sub.exercises : [];
  }
  return cat.subcategories.flatMap((s) => s.exercises);
}

// ---------------------------------------------------------------------------
// Per-exercise default metric type.
// Anything NOT listed here implicitly defaults to 'reps_weight' (legacy behavior),
// so existing 200+ entries continue to behave exactly as before.
// Keys MUST match the exercise name strings above exactly.
// ---------------------------------------------------------------------------
export const EXERCISE_DEFAULT_METRIC: Record<string, MetricType> = {
  // IYTW family — bodyweight scapular work, sets x reps, no load.
  "Prone IYTW (Bodyweight)": "reps_only",
  "Standing IYTW (Bodyweight)": "reps_only",
  "Banded IYTW (Standing, Cable/Band)": "reps_only",
  // Hyperextension
  "Prone Hyperextension (Bodyweight)": "reps_only",
  // (Weighted variants stay on reps_weight via fallback.)

  // Mobility holds — time under tension.
  "Mountain Pose / Tadasana Hold": "time",
  "Adductor Stretch (Seated Butterfly)": "time",

  // Cardio & Endurance category.
  "Outdoor Running": "distance_time",
  "Treadmill Running": "distance_time",
  "Treadmill Walking": "distance_time",
  "Treadmill Incline Walk": "distance_time",
  "Outdoor Cycling": "distance_time",
  "Stationary Bike": "distance_time",
  "Spin Bike Intervals": "time",
  "Assault Bike (Air Bike)": "distance_time",
  "Indoor Rowing (Erg)": "distance_time",
  "SkiErg": "distance_time",
  "Stair Climber (Stepmill)": "time",
  "Elliptical Trainer": "time",
  "Arc Trainer": "time",
  "Jump Rope - Steady Pace": "time",
  "Jump Rope - Double Unders": "reps_only",
  "Swimming - Freestyle": "distance_time",
  "Swimming - Breaststroke": "distance_time",
  "Swimming - Backstroke": "distance_time",
  "Swimming - Butterfly": "distance_time",
  "Open Water Swim": "distance_time",
  "Hill Sprints": "distance_time",
  "Track Sprints (100m / 200m / 400m)": "distance_time",
  "Stadium Stair Run": "time",
  "Hiking / Trekking": "distance_time",
  "Boxing - Bag Round (3 min)": "time",
};

// Returns the recommended default metric for an exercise name.
// Falls back to 'reps_weight' to preserve existing UX for unlisted entries
// (custom user-added exercises and the 200+ legacy strength entries).
export function getDefaultMetricForExercise(name: string): MetricType {
  if (!name) return "reps_weight";
  return EXERCISE_DEFAULT_METRIC[name] ?? "reps_weight";
}

// Legacy exports for backward compatibility
export const muscleGroups = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs (Lower Body)",
  "Upper Body (Push/Pull/Shoulder)",
  "Lower Body",
  "Power, Explosion & Dynamics",
  "Bodyweight Dynamics",
  "Full Body High Intensity",
  "Spine, Torso & Lower Body",
  "Core, Abs & Pilates",
  "Cardio Machines & Sports",
] as const;

export type MuscleGroup = (typeof muscleGroups)[number];
