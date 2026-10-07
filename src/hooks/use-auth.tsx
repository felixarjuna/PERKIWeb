import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthenticationState {
  readonly authorized: boolean;
  readonly setAuthorized: (authorized: boolean) => void;
}

const useAuth = create<AuthenticationState>()(
  persist(
    (set) => ({
      authorized: false,
      setAuthorized: (authorized: boolean) => set({ authorized }),
    }),
    {
      name: "authentication-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useAuth;
