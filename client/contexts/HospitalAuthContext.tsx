import React, { createContext, useContext, useState, useEffect } from "react";

interface Hospital {
  id: number;
  hospital_id: string;
  hospital_name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  email: string;
  phone: string;
  registration_number: string;
  license_number: string;
  contact_person: string;
  wallet_address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface HospitalAuthContextType {
  hospital: Hospital | null;
  login: (
    hospital_id: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
  requestPasswordReset: (
    hospital_id: string,
    email: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

const HospitalAuthContext = createContext<HospitalAuthContextType | undefined>(
  undefined,
);

export const useHospitalAuth = () => {
  const context = useContext(HospitalAuthContext);
  if (!context) {
    throw new Error(
      "useHospitalAuth must be used within a HospitalAuthProvider",
    );
  }
  return context;
};

export const HospitalAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("hospital_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/hospital/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHospital(data.hospital);
      } else {
        localStorage.removeItem("hospital_token");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("hospital_token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (hospital_id: string, password: string) => {
    try {
      const response = await fetch("/api/hospital/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hospital_id, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          localStorage.setItem("hospital_token", data.token);
          setHospital(data.hospital);
          return { success: true };
        } else {
          return { success: false, error: data.error };
        }
      } else {
        // Handle non-ok responses
        try {
          const errorData = await response.json();
          return { success: false, error: errorData.error || "Login failed" };
        } catch {
          return { success: false, error: `Login failed with status ${response.status}` };
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error: "Network error occurred" };
    }
  };

  const logout = () => {
    localStorage.removeItem("hospital_token");
    setHospital(null);
  };

  const requestPasswordReset = async (hospital_id: string, email: string) => {
    try {
      const response = await fetch("/api/hospital/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hospital_id, email }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: data.success, error: data.error };
      } else {
        try {
          const errorData = await response.json();
          return { success: false, error: errorData.error || "Password reset request failed" };
        } catch {
          return { success: false, error: `Request failed with status ${response.status}` };
        }
      }
    } catch (error) {
      console.error("Password reset request failed:", error);
      return { success: false, error: "Network error occurred" };
    }
  };

  const value = {
    hospital,
    login,
    logout,
    loading,
    requestPasswordReset,
  };

  return (
    <HospitalAuthContext.Provider value={value}>
      {children}
    </HospitalAuthContext.Provider>
  );
};
