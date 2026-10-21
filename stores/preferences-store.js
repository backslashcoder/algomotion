import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Small, durable user preferences only. Traces are never persisted.
 * Hydration is manual (`skipHydration`) so server and first client render match;
 * call `usePreferencesStore.persist.rehydrate()` from an effect.
 */
export const usePreferencesStore = create(
  persist(
    (set) => ({
      speed: 1,
      loop: false,
      setSpeedPreference: (speed) => set({ speed }),
      setLoopPreference: (loop) => set({ loop }),
    }),
    {
      name: "algomotion:preferences",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => {
        try {
          return window.localStorage;
        } catch {
          // storage blocked (private mode etc.): fall back to in-memory only
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
      }),
      partialize: ({ speed, loop }) => ({ speed, loop }),
    },
  ),
);
