// Common gym weight training exercises organized by muscle group
export const gymExercises = [
  // Chest
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
  
  // Back
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
  
  // Shoulders
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
  
  // Biceps
  "Barbell Curl",
  "Dumbbell Curl",
  "Hammer Curl",
  "Preacher Curl",
  "Concentration Curl",
  "Cable Curl",
  "Incline Dumbbell Curl",
  "EZ Bar Curl",
  "Spider Curl",
  
  // Triceps
  "Tricep Pushdown",
  "Skull Crusher",
  "Close Grip Bench Press",
  "Overhead Tricep Extension",
  "Tricep Dips",
  "Diamond Push-Ups",
  "Cable Overhead Extension",
  "Tricep Kickback",
  
  // Legs - Quadriceps
  "Squat",
  "Front Squat",
  "Leg Press",
  "Hack Squat",
  "Leg Extension",
  "Walking Lunge",
  "Bulgarian Split Squat",
  "Goblet Squat",
  "Sissy Squat",
  
  // Legs - Hamstrings
  "Romanian Deadlift",
  "Stiff Leg Deadlift",
  "Leg Curl",
  "Seated Leg Curl",
  "Good Morning",
  "Glute Ham Raise",
  
  // Legs - Glutes
  "Hip Thrust",
  "Glute Bridge",
  "Cable Kickback",
  "Step Ups",
  "Sumo Deadlift",
  
  // Calves
  "Standing Calf Raise",
  "Seated Calf Raise",
  "Donkey Calf Raise",
  "Calf Press on Leg Press",
  
  // Core
  "Plank",
  "Hanging Leg Raise",
  "Cable Crunch",
  "Ab Wheel Rollout",
  "Russian Twist",
  "Woodchop",
  "Dead Bug",
  "Bicycle Crunch",
  "Weighted Sit-Up",
  
  // Compound Movements
  "Clean and Press",
  "Power Clean",
  "Snatch",
  "Thruster",
  "Farmer's Walk",
  "Kettlebell Swing",
  
  // Machine Exercises
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
