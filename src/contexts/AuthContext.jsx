import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      // Obtain a short-lived access token using the refresh cookie (if present).
      await User.refresh();
      const currentUser = await User.me();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await User.login(email, password);

      // Handle both response formats: { user, token } or { data: { user, token } }
      const userData = response.data?.user || response.user;

      if (userData) {
        setUser(userData);
        toast({
          title: "התחברות הצליחה",
          description: `ברוך הבא, ${userData.name || userData.email}!`,
        });
        navigate("/Dashboard");
        return { success: true };
      }
    } catch (error) {
      const errorMessage =
        error.data?.error || error.data?.message || error.message || "התחברות נכשלה";
      toast({
        title: "שגיאת התחברות",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (data) => {
    try {
      const response = await User.register(data);

      const message = response.data?.message || response.message;

      toast({
        title: "בקשת ההרשמה נשלחה",
        description: message || "חשבונך ממתין לאישור מנהל המערכת.",
      });
      return { success: true, pendingApproval: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "הרשמה נכשלה";
      toast({
        title: "שגיאת הרשמה",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await User.logout();
    } catch (error) {
      // Ignore logout errors, we'll clear state anyway
    } finally {
      setUser(null);
      toast({
        title: "התנתקת בהצלחה",
        description: "להתראות!",
      });
      navigate("/login");
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
