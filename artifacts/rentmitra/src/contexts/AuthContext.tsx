import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("rentnearn_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("rentnearn_token") || null;
  });

  // Wire the JWT token into every customFetch call (used by the generated API client)
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("rentnearn_token"));
    return () => setAuthTokenGetter(null);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("rentnearn_token", newToken);
    localStorage.setItem("rentnearn_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("rentnearn_token");
    localStorage.removeItem("rentnearn_user");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem("rentnearn_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateUser,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
