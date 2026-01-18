// 100 common gym weight training exercises organized by muscle group
export const gymExercises = [
  // Chest (12)
  "Bench Press",
  "Incline Bench Press",
  "Decline Bench Press",
  "Dumbbell Bench Press",
  "Incline Dumbbell Press",
  "Dumbbell Flyes",
  "Cable Crossover",
  "Chest Dips",
  "Push-Ups",
  "Machine Chest Press",
  "Pec Deck Fly",
  "Landmine Press",
  
  // Back (14)
  "Deadlift",
  "Barbell Row",
  "Dumbbell Row",
  "Lat Pulldown",
  "Pull-Ups",
  "Chin-Ups",
  "Seated Cable Row",
  "T-Bar Row",
  "Face Pull",
  "Straight Arm Pulldown",
  "Rack Pull",
  "Hyperextension",
  "Pendlay Row",
  "Meadows Row",
  
  // Shoulders (12)
  "Overhead Press",
  "Military Press",
  "Dumbbell Shoulder Press",
  "Arnold Press",
  "Lateral Raise",
  "Front Raise",
  "Rear Delt Fly",
  "Upright Row",
  "Shrugs",
  "Cable Lateral Raise",
  "Barbell Shrugs",
  "Seated Dumbbell Press",
  
  // Biceps (10)
  "Barbell Curl",
  "Dumbbell Curl",
  "Hammer Curl",
  "Preacher Curl",
  "Concentration Curl",
  "Cable Curl",
  "Incline Dumbbell Curl",
  "EZ Bar Curl",
  "Spider Curl",
  "Reverse Curl",
  
  // Triceps (10)
  "Tricep Pushdown",
  "Skull Crusher",
  "Close Grip Bench Press",
  "Overhead Tricep Extension",
  "Tricep Dips",
  "Diamond Push-Ups",
  "Cable Overhead Extension",
  "Tricep Kickback",
  "Rope Pushdown",
  "Bench Dips",
  
  // Legs - Quadriceps (12)
  "Squat",
  "Front Squat",
  "Leg Press",
  "Hack Squat",
  "Leg Extension",
  "Walking Lunge",
  "Bulgarian Split Squat",
  "Goblet Squat",
  "Sissy Squat",
  "Box Squat",
  "Pistol Squat",
  "Wall Sit",
  
  // Legs - Hamstrings (8)
  "Romanian Deadlift",
  "Stiff Leg Deadlift",
  "Leg Curl",
  "Seated Leg Curl",
  "Good Morning",
  "Glute Ham Raise",
  "Nordic Curl",
  "Single Leg Deadlift",
  
  // Legs - Glutes (6)
  "Hip Thrust",
  "Glute Bridge",
  "Cable Kickback",
  "Step Ups",
  "Sumo Deadlift",
  "Frog Pumps",
  
  // Calves (4)
  "Standing Calf Raise",
  "Seated Calf Raise",
  "Donkey Calf Raise",
  "Calf Press on Leg Press",
  
  // Core (10)
  "Plank",
  "Hanging Leg Raise",
  "Cable Crunch",
  "Ab Wheel Rollout",
  "Russian Twist",
  "Woodchop",
  "Dead Bug",
  "Bicycle Crunch",
  "Weighted Sit-Up",
  "Mountain Climbers",
  
  // Compound Movements (8)
  "Clean and Press",
  "Power Clean",
  "Snatch",
  "Thruster",
  "Farmer's Walk",
  "Kettlebell Swing",
  "Burpees",
  "Turkish Get-Up",
  
  // Machine Exercises (6)
  "Smith Machine Squat",
  "Smith Machine Bench Press",
  "Cable Fly",
  "Machine Shoulder Press",
  "Machine Curl",
  "Machine Tricep Extension",
];

// Muscle groups for categorization (future use)
export const muscleGroups = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quadriceps",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
] as const;

export type MuscleGroup = typeof muscleGroups[number];
