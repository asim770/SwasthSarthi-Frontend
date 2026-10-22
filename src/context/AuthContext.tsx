import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { AuthenticatedUser } from "../types/api";
import { fetchCurrentUser, logoutUser, setCsrfToken } from "../api/client";

interface AuthContextType {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginSuccess: (user: AuthenticatedUser, csrfToken: string) => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCurrentUser();
      setUser(data.user);
      setIsAuthenticated(true);
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
      }
    } catch {
      // Unauthenticated is expected on initial visit
      setUser(null);
      setIsAuthenticated(false);
      setCsrfToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const initializeAuth = async () => {
      try {
        const data = await fetchCurrentUser();
        if (mounted) {
          setUser(data.user);
          setIsAuthenticated(true);
          if (data.csrfToken) {
            setCsrfToken(data.csrfToken);
          }
        }
      } catch {
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
          setCsrfToken(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    return () => {
      mounted = false;
    };
  }, []);

  const loginSuccess = useCallback((authedUser: AuthenticatedUser, csrfToken: string) => {
    setUser(authedUser);
    setIsAuthenticated(true);
    setError(null);
    if (csrfToken) {
      setCsrfToken(csrfToken);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutUser();
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setCsrfToken(null);
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        loginSuccess,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
