import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  apiKey: string;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, loading: true,
  isAdmin: false, isApproved: false, apiKey: "",
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (!sess?.user) {
        setIsAdmin(false);
        setIsApproved(false);
        setApiKey("");
        setLoading(false);
        return;
      }
      // Defer fetches to avoid deadlock
      setTimeout(() => fetchUserData(sess.user.id), 0);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        fetchUserData(sess.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const [rolesRes, profileRes, keysRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("is_approved").eq("user_id", userId).single(),
        supabase.from("api_keys").select("key_value").eq("is_active", true).limit(1),
      ]);

      const admin = rolesRes.data?.some(r => r.role === "admin") ?? false;
      setIsAdmin(admin);
      setIsApproved(profileRes.data?.is_approved ?? false);
      setApiKey(keysRes.data?.[0]?.key_value ?? "");
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isApproved, apiKey, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
