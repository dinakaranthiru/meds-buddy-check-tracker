// src/hooks/useMedications.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { Medication, NewMedication } from "../types";
import { useAuth } from "./useAuth"; // Import useAuth to get the current user
import { v4 as uuidv4 } from "uuid"; // For generating temp IDs for optimistic updates

// Hook to fetch a user's medications
export function useGetMedications() {
  const { user, loading: authLoading } = useAuth(); // Get current user from useAuth
  const currentUserId = user?.id;

  return useQuery<Medication[], Error>({
    queryKey: ["medications", currentUserId], // Cache key includes user ID for isolation
    queryFn: async () => {
      if (!currentUserId) {
        // If no user, or still loading, don't attempt to fetch
        throw new Error("User not authenticated.");
      }
      const { data, error } = await supabase
        .from("medications")
        .select("*")
        .eq("user_id", currentUserId) // Filter by current user's ID
        .order("created_at", { ascending: true }); // Order by creation date

      if (error) {
        console.error("Error fetching medications:", error.message);
        throw error;
      }
      return data as Medication[];
    },
    enabled: !!currentUserId && !authLoading, // Only run if a user is authenticated and auth isn't loading
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
  });
}

// Hook to add a new medication (with optimistic update)
export function useAddMedication() {
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Get the current user
  const currentUserId = user?.id;

  return useMutation({
    mutationFn: async (newMed: NewMedication) => {
      if (!currentUserId) {
        throw new Error("User not authenticated.");
      }
      const { data, error } = await supabase
        .from("medications")
        .insert({ ...newMed, user_id: currentUserId }) // Ensure user_id is set
        .select() // Select the newly inserted row to get its actual ID/timestamp
        .single(); // Expect only one row back

      if (error) {
        console.error("Error inserting medication:", error.message);
        throw error;
      }
      return data;
    },
    onMutate: async (newMed: NewMedication) => {
      if (!currentUserId) return; // Cannot optimistically update without user

      // Cancel any outgoing refetches for the medications query
      await queryClient.cancelQueries({
        queryKey: ["medications", currentUserId],
      });

      // Snapshot the previous value
      const previousMedications = queryClient.getQueryData<Medication[]>([
        "medications",
        currentUserId,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData<Medication[]>(
        ["medications", currentUserId],
        (old) => {
          const tempMed: Medication = {
            ...newMed,
            id: `optimistic-${uuidv4()}`, // Temporary ID for optimistic update
            created_at: new Date().toISOString(), // Temporary timestamp
            user_id: currentUserId,
          };
          return old ? [...old, tempMed] : [tempMed];
        }
      );

      return { previousMedications }; // Return context object for onError/onSettled
    },
    onError: (err, newMed, context) => {
      console.error("Optimistic update failed, rolling back:", err);
      // Rollback to the previous data on error
      queryClient.setQueryData(
        ["medications", currentUserId],
        context?.previousMedications
      );
      // TODO: Integrate use-toast hook here to show user an error message
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data is synchronized
      queryClient.invalidateQueries({
        queryKey: ["medications", currentUserId],
      });
    },
  });
}
