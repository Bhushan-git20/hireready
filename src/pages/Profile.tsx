import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { 
  Sparkles, 
  Terminal, 
  BookOpen, 
  Briefcase, 
  Code, 
  FileText, 
  Bookmark, 
  Save, 
  X, 
  Loader2, 
  CheckCircle2 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

interface ProfileProps {
  onProfileUpdate: () => void;
}

export function Profile({ onProfileUpdate }: ProfileProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile data states
  const [fullName, setFullName] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [college, setCollege] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [experienceText, setExperienceText] = useState("");
  const [projectsText, setProjectsText] = useState("");
  const [resumeText, setResumeText] = useState("");

  // Tag inputs
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [roleInput, setRoleInput] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile from database.");
        return;
      }

      if (data) {
        setFullName(data.full_name || "");
        setSkills(data.skills || []);
        setExperienceText(data.experience_text || "");
        setProjectsText(data.projects_text || "");
        setResumeText(data.resume_text || "");
        setTargetRoles(data.target_roles || []);
        setCgpa(data.cgpa || "");
        setCollege(data.college || "");
        setGraduationYear(data.graduation_year || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === ",") && skillInput.trim()) {
      e.preventDefault();
      const newSkill = skillInput.trim().replace(/,$/, "");
      if (newSkill && !skills.includes(newSkill)) {
        setSkills([...skills, newSkill]);
      }
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleAddRole = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === ",") && roleInput.trim()) {
      e.preventDefault();
      const newRole = roleInput.trim().replace(/,$/, "");
      if (newRole && !targetRoles.includes(newRole)) {
        setTargetRoles([...targetRoles, newRole]);
      }
      setRoleInput("");
    }
  };

  const handleRemoveRole = (roleToRemove: string) => {
    setTargetRoles(targetRoles.filter(r => r !== roleToRemove));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user session.");

      const profilePayload = {
        user_id: user.id,
        full_name: fullName,
        skills,
        experience_text: experienceText,
        projects_text: projectsText,
        resume_text: resumeText,
        target_roles: targetRoles,
        cgpa,
        college,
        graduation_year: graduationYear,
        updated_at: new Date().toISOString()
      };

      // Upsert profile
      const { error } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "user_id" });

      if (error) throw error;

      toast.success("System configurations updated successfully!");
      onProfileUpdate();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update profile configurations.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-[#00FF88]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-wider text-white" style={{ fontFamily: 'Clash Display' }}>
          DEVELOPER <span className="text-[#00FF88] glow-text-green">CONFIGURATION</span>
        </h1>
        <p className="text-xs code-font text-[#8E8E9E] mt-1">
          CONFIGURE PROFILE PARAMETERS TO DEFINE SEMANTIC ENGINE MATCH CONTEXTS
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Section 1: Academic & Target Roles */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="border border-[#1F1F2E] bg-[#0E0E16] text-white rounded-none">
              <CardHeader className="border-b border-[#1F1F2E] py-4 bg-[#0A0A0F]">
                <CardTitle className="text-sm font-semibold tracking-wider flex items-center gap-2 text-[#00FF88]" style={{ fontFamily: 'Clash Display' }}>
                  <BookOpen size={16} />
                  ACADEMICS & BASICS
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-[11px] code-font text-[#8E8E9E]">FULL NAME</Label>
                  <Input 
                    id="fullName" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name" 
                    className="bg-[#0A0A0F] border-[#1F1F2E] focus:border-[#00FF88] focus:ring-[#00FF88] rounded-none placeholder-[#4E4E5E]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="college" className="text-[11px] code-font text-[#8E8E9E]">COLLEGE / INSTITUTE</Label>
                  <Input 
                    id="college" 
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g., VIIT" 
                    className="bg-[#0A0A0F] border-[#1F1F2E] focus:border-[#00FF88] focus:ring-[#00FF88] rounded-none placeholder-[#4E4E5E]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cgpa" className="text-[11px] code-font text-[#8E8E9E]">CGPA / SCORE</Label>
                    <Input 
                      id="cgpa" 
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      placeholder="e.g. 8.4" 
                      className="bg-[#0A0A0F] border-[#1F1F2E] focus:border-[#00FF88] focus:ring-[#00FF88] rounded-none placeholder-[#4E4E5E]"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gradYear" className="text-[11px] code-font text-[#8E8E9E]">GRADUATION YEAR</Label>
                    <Input 
                      id="gradYear" 
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      placeholder="e.g. 2026" 
                      className="bg-[#0A0A0F] border-[#1F1F2E] focus:border-[#00FF88] focus:ring-[#00FF88] rounded-none placeholder-[#4E4E5E]"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#1F1F2E] bg-[#0E0E16] text-white rounded-none">
              <CardHeader className="border-b border-[#1F1F2E] py-4 bg-[#0A0A0F]">
                <CardTitle className="text-sm font-semibold tracking-wider flex items-center gap-2 text-[#00FF88]" style={{ fontFamily: 'Clash Display' }}>
                  <Bookmark size={16} />
                  TARGET ROLES
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roles" className="text-[11px] code-font text-[#8E8E9E]">DESIRED POSITIONS (Comma or Enter)</Label>
                  <Input
                    id="roles"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    onKeyDown={handleAddRole}
                    placeholder="e.g. Frontend Engineer, Associate Developer"
                    className="bg-[#0A0A0F] border-[#1F1F2E] focus:border-[#00FF88] focus:ring-[#00FF88] rounded-none placeholder-[#4E4E5E]"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {targetRoles.map(role => (
                      <span key={role} className="inline-flex items-center gap-1 bg-[#1A1A26] border border-[#2F2F45] text-white text-xs px-2 py-1 select-none">
                        {role}
                        <button type="button" onClick={() => handleRemoveRole(role)} className="hover:text-red-400">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 2: Skills & Work Data */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* Skills Card */}
            <Card className="border border-[#1F1F2E] bg-[#0E0E16] text-white rounded-none">
              <CardHeader className="border-b border-[#1F1F2E] py-4 bg-[#0A0A0F]">
                <CardTitle className="text-sm font-semibold tracking-wider flex items-center gap-2 text-[#00FF88]" style={{ fontFamily: 'Clash Display' }}>
                  <Code size={16} />
                  CORE SKILLS INVENTORY
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="skills" className="text-[11px] code-font text-[#8E8E9E]">ADD SKILLS (Press Comma or Enter to Add)</Label>
                  <Input
                    id="skills"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="e.g. React, TypeScript, Python, FastAPI"
                    className="bg-[#0A0A0F] border-[#1F1F2E] focus:border-[#00FF88] focus:ring-[#00FF88] rounded-none placeholder-[#4E4E5E]"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2 max-h-36 overflow-y-auto p-1 border border-[#1F1F2E]/30 bg-[#0A0A0F]/50">
                    {skills.length === 0 ? (
                      <span className="text-xs text-[#4E4E5E] italic py-1">No skills added yet</span>
                    ) : (
                      skills.map(skill => (
                        <span key={skill} className="inline-flex items-center gap-1 bg-[#0A0A0F] border border-[#00FF88]/40 text-[#00FF88] text-xs px-2 py-0.5 select-none font-medium">
                          {skill}
                          <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-red-400 text-[#00FF88]/60 hover:text-red-400">
                            <X size={10} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Experience, Projects & Resume */}
            <Card className="border border-[#1F1F2E] bg-[#0E0E16] text-white rounded-none">
              <CardHeader className="border-b border-[#1F1F2E] py-4 bg-[#0A0A0F]">
                <CardTitle className="text-sm font-semibold tracking-wider flex items-center gap-2 text-[#00FF88]" style={{ fontFamily: 'Clash Display' }}>
                  <Briefcase size={16} />
                  PROJECTS, INTERNSHIPS & RESUME RAW TEXT
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="experience" className="text-[11px] code-font text-[#8E8E9E]">EXPERIENCE & INTERNSHIPS</Label>
                    <Textarea 
                      id="experience" 
                      value={experienceText}
                      onChange={(e) => setExperienceText(e.target.value)}
                      placeholder="Briefly describe your internship roles or write 'Fresher' if no previous work experience" 
                      className="bg-[#0A0A0F] border-[#1F1F2E] focus:border-[#00FF88] focus:ring-[#00FF88] rounded-none min-h-[120px] text-xs placeholder-[#4E4E5E]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="projects" className="text-[11px] code-font text-[#8E8E9E]">ACADEMIC PROJECTS SUMMARY</Label>
                    <Textarea 
                      id="projects" 
                      value={projectsText}
                      onChange={(e) => setProjectsText(e.target.value)}
                      placeholder="Describe your prominent academic projects, tech stacks used, and outcomes (e.g. MindCare, PDF RAG Chatbot)" 
                      className="bg-[#0A0A0F] border-[#1F1F2E] focus:border-[#00FF88] focus:ring-[#00FF88] rounded-none min-h-[120px] text-xs placeholder-[#4E4E5E]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="resume" className="text-[11px] code-font text-[#8E8E9E]">PASTE COMPLETE RESUME TEXT</Label>
                    <span className="text-[10px] code-font text-[#00FF88]/60">CONVERTS TO TEXT MATCH INDEX</span>
                  </div>
                  <Textarea 
                    id="resume" 
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Open your resume PDF/Doc, Copy everything, and Paste the plain text here. Used to analyze fine-grained keyword gaps against Job Descriptions." 
                    className="bg-[#0A0A0F] border-[#1F1F2E] focus:border-[#00FF88] focus:ring-[#00FF88] rounded-none min-h-[180px] text-xs code-font placeholder-[#4E4E5E]"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Bar */}
            <div className="flex items-center justify-end">
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-[#00FF88] text-[#0A0A0F] hover:bg-[#00D972] rounded-none font-semibold px-6 shadow-[0_0_15px_rgba(0,255,136,0.15)] flex items-center gap-2 terminal-glow-btn transition-all"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save size={16} />
                    <span>SAVE SYSTEM VARIABLES</span>
                  </>
                )}
              </Button>
            </div>
            
          </div>
        </div>
      </form>
    </div>
  );
}
