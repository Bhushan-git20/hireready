import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { AppLayout } from "./components/layout/AppLayout";
import { Auth } from "./pages/Auth";
import { Profile } from "./pages/Profile";
import { Analyse } from "./pages/Analyse";
import { Interview } from "./pages/Interview";
import { Tracker } from "./pages/Tracker";
import { Rejections } from "./pages/Rejections";
import { Loader2 } from "lucide-react";
import { Session } from "@supabase/supabase-js";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profilePercentage, setProfilePercentage] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkProfileStatus(session.user.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkProfileStatus(session.user.id);
      } else {
        setProfileComplete(false);
        setProfilePercentage(0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkProfileStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile status:", error);
        return;
      }

      if (data) {
        let filledFields = 0;
        const totalFields = 9; // full_name, skills, experience_text, projects_text, resume_text, target_roles, cgpa, college, graduation_year

        if (data.full_name) filledFields++;
        if (data.skills && data.skills.length > 0) filledFields++;
        if (data.experience_text) filledFields++;
        if (data.projects_text) filledFields++;
        if (data.resume_text) filledFields++;
        if (data.target_roles && data.target_roles.length > 0) filledFields++;
        if (data.cgpa) filledFields++;
        if (data.college) filledFields++;
        if (data.graduation_year) filledFields++;

        const percentage = Math.round((filledFields / totalFields) * 100);
        setProfilePercentage(percentage);
        setProfileComplete(percentage === 100);
      } else {
        setProfilePercentage(0);
        setProfileComplete(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0A0A0F] text-[#00FF88]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Protected Route Wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!session) {
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }
    return (
      <AppLayout profilePercentage={profilePercentage} profileComplete={profileComplete}>
        {children}
      </AppLayout>
    );
  };

  return (
    <Routes>
      <Route
        path="/auth"
        element={session ? <Navigate to="/analyse" replace /> : <Auth />}
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile onProfileUpdate={() => checkProfileStatus(session.user.id)} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/analyse"
        element={
          <ProtectedRoute>
            <Analyse />
          </ProtectedRoute>
        }
      />

      <Route
        path="/interview"
        element={
          <ProtectedRoute>
            <Interview />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tracker"
        element={
          <ProtectedRoute>
            <Tracker />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rejections"
        element={
          <ProtectedRoute>
            <Rejections />
          </ProtectedRoute>
        }
      />

      {/* Default Routes */}
      <Route path="/" element={<Navigate to={session ? "/analyse" : "/auth"} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
