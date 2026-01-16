-- DELETE policies for data integrity

-- Subscription cycles: No deletion (financial/billing records)
CREATE POLICY "Subscription records cannot be deleted" ON subscription_cycles
FOR DELETE USING (false);

-- Profiles: No direct deletion (managed by auth.users cascade)
CREATE POLICY "Profiles cannot be directly deleted" ON profiles
FOR DELETE USING (false);

-- Food logs: Allow clients to delete their own, trainers to delete client's
CREATE POLICY "Clients can delete own food logs" ON food_logs
FOR DELETE USING (
  client_id = public.get_user_profile_id(auth.uid())
);

CREATE POLICY "Trainers can delete client food logs" ON food_logs
FOR DELETE USING (
  public.is_trainer_of_client(auth.uid(), client_id)
);

-- Workouts: Allow clients to delete their own, trainers to delete client's
CREATE POLICY "Clients can delete own workouts" ON workouts
FOR DELETE USING (
  client_id = public.get_user_profile_id(auth.uid())
);

CREATE POLICY "Trainers can delete client workouts" ON workouts
FOR DELETE USING (
  public.is_trainer_of_client(auth.uid(), client_id)
);

-- Exercises: Allow deletion if user can access the workout
CREATE POLICY "Users can delete exercises for accessible workouts" ON exercises
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = exercises.workout_id
    AND (w.client_id = public.get_user_profile_id(auth.uid()) 
         OR public.is_trainer_of_client(auth.uid(), w.client_id))
  )
);