import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import {
  registerCustomer,
  loginCustomer,
  logoutCustomer,
  getCustomerProfile,
  updateCustomerProfile,
} from "../services/authService";

const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = "royal_agate_access";
const REFRESH_TOKEN_KEY = "royal_agate_refresh";
const USER_KEY = "royal_agate_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem(ACCESS_TOKEN_KEY)
  );

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
    };

    const handleTokenRefreshed = (event) => {
      const newAccessToken = event.detail.accessToken;

      setAccessToken(newAccessToken);
    };

    window.addEventListener(
      "auth:session-expired",
      handleSessionExpired
    );

    window.addEventListener(
      "auth:token-refreshed",
      handleTokenRefreshed
    );

    return () => {
      window.removeEventListener(
        "auth:session-expired",
        handleSessionExpired
      );

      window.removeEventListener(
        "auth:token-refreshed",
        handleTokenRefreshed
      );
    };
  }, []);

  const saveSession = (userData, tokens) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));

    setAccessToken(tokens.access);
    setUser(userData);
  };

  const clearSession = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setAccessToken(null);
    setUser(null);
  };

  const register = async (userData) => {
    return await registerCustomer(userData);
  };

  const login = async (credentials) => {
    setLoading(true);

    try {
      const response = await loginCustomer(credentials);

      saveSession(response.user, response.tokens);

      return response;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    try {
      if (refreshToken && accessToken) {
        await logoutCustomer(refreshToken, accessToken);
      }
    } finally {
      clearSession();
    }
  };

  const fetchProfile = async () => {
    if (!accessToken) {
      throw new Error("You are not authenticated.");
    }

    const profile = await getCustomerProfile(accessToken);

    const updatedUser = {
      ...profile,
      account_type: profile.account_type || user?.account_type,
    };

    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

    return updatedUser;
  };

  const updateProfile = async (profileData) => {
    const updatedProfile = await updateCustomerProfile(
      profileData,
      accessToken
    );

    const updatedUser = {
      ...updatedProfile,
      account_type: updatedProfile.account_type || user?.account_type,
    };

    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

    return updatedUser;
  };

  const value = {
    user,
    accessToken,
    accountType: user?.account_type || null,
    isAdmin: user?.account_type === "admin",
    isCustomer: user?.account_type === "customer",
    isAuthenticated: Boolean(accessToken && user),
    loading,
    register,
    login,
    logout,
    fetchProfile,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}