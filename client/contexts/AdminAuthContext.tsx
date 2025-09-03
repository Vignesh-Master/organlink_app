import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  email: string;
  type: "admin";
}

interface AdminAuthContextType {
  user: User | null;
  token: string | null;
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedToken, setHasCheckedToken] = useState(false);

  useEffect(() => {
    // Check for stored token on app load, but only once
    if (!hasCheckedToken) {
      setHasCheckedToken(true);
      const storedToken = localStorage.getItem("admin_token");
      if (storedToken) {
        setToken(storedToken);
        verifyToken(storedToken);
      } else {
        setIsLoading(false);
      }
    }
  }, [hasCheckedToken]);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch("/api/admin/auth/verify", {
        headers: {
          Authorization: `Bearer ${tokenToVerify}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token is invalid, remove it
        console.warn('Token verification failed: Invalid token');
        localStorage.removeItem("admin_token");
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      // Network error or server not available
      console.warn('Token verification failed - server may not be running:', error);
      // Don't remove token on network errors, just set loading to false
      // This allows users to still access the app if server is temporarily down
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("admin_token", data.token);
        return { success: true };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error" };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("admin_token");
  };

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
