import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { 
  Terminal, 
  Search, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle, 
  Play, 
  Save, 
  Loader2, 
  Calendar,
  AlertCircle,
  HelpCircle as QuestionIcon
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";

interface MatchingSkill {
  skill: string;
  strength: "strong" | "moderate" | "weak";
}

interface SkillGap {
  skill: string;
  priority: "critical" | "important" | "nice-to-have";
  weeks_to_learn: number;
}

interface AnalysisResult {
  fit_grade: "A" | "B" | "C" | "D" | "F";
  fit_score: number;
  should_apply: boolean;
  recommendation: string;
  matching_skills: MatchingSkill[];
  skill_gaps: SkillGap[];
  role_summary?: string;
  red_flags?: string[];
}

export function Analyse() {
  const [loading, setLoading] = useState(false);
  const [jdText, setJdText] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [saveApplication, setSaveApplication] = useState(true);

  // Analysis result states
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const navigate = useNavigate();

  const handleAnalyse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) {
      toast.error("Please paste a Job Description first.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Authentication session missing. Please re-login.");
        setLoading(false);
        return;
      }

      // Call Supabase Deno Edge Function
      const { data, error } = await supabase.functions.invoke("analyse-jd", {
        body: {
          jd_text: jdText,
          save_application: saveApplication,
          company: company.trim() || "Unspecified Company",
          role: role.trim() || "Unspecified Role",
        },
      });

      if (error) throw error;

      if (data && data.success) {
        setResult(data.analysis);
        toast.success("Semantic analysis complete!");
      } else {
        throw new Error(data?.error || "Invalid response format.");
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to execute JD analysis.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "text-emerald-400 border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(52,211,153,0.15)]";
      case "B": return "text-green-400 border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(74,222,128,0.15)]";
      case "C": return "text-amber-400 border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.15)]";
      case "D": return "text-orange-400 border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(251,146,60,0.15)]";
      default: return "text-red-400 border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(248,113,113,0.15)]";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "text-red-400 bg-red-950/30 border border-red-800/30";
      case "important": return "text-amber-400 bg-amber-950/30 border border-amber-800/30";
      default: return "text-slate-400 bg-slate-900/30 border border-slate-800/30";
    }
  };

  const getApplyBadge = (shouldApply: boolean) => {
    if (shouldApply) {
      return (
        <span className="inline-flex items-center gap-1.5 bg-emerald-950/30 border border-emerald-500/40 text-emerald-400 px-3 py-1 font-semibold text-xs tracking-wider">
          <CheckCircle size={12} />
          SHOULD APPLY (YES)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 bg-amber-950/30 border border-amber-500/40 text-amber-400 px-3 py-1 font-semibold text-xs tracking-wider">
        <AlertTriangle size={12} />
        UPSKILL RECOMMENDED (NO)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-wider text-white" style={{ fontFamily: 'Clash Display' }}>
          JD <span className="text-[#00FF88] glow-text-green">ANALYSER</span>
        </h1>
        <p className="text-xs code-font text-[#8E8E9E] mt-1">
          EVALUATE TARGET ROLE DESCRIPTION AGAINST PERSONAL RESUME PARAMETERS
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Left Panel: Inputs */}
        <div className="space-y-6">
          <Card className="border border-[#1F1F2E] bg-[#0E0E16] text-white rounded-none">
            <CardHeader className="border-b border-[#1F1F2E] py-4 bg-[#0A0A0F]">
              <CardTitle className="text-sm font-semibold tracking-wider flex items-center gap-2 text-[#00FF88]" style={{ fontFamily: 'Clash Display' }}>
                <Terminal size={16} />
                INPUT JOB SPECIFICATIONS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleAnalyse} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="company" className="text-[11px] code-font text-[#8E8E9E]">COMPANY NAME</Label>
                    <Input 
                      id="company" 
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Amazon, VIIT Tech" 
                      className="bg-[#0A0A0F] border-[#1F1F2E] focus:border-[#00FF88] focus:ring-[#00FF88] rounded-none placeholder-[#4E4E5E] text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="role" className="text-[11px] code-font text-[#8E8E9E]">ROLE / POSITION</Label>
                    <Input 
                      id="role" 
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. SDE 1, Graduate Intern" 
                      className="bg-[#0A0A0F] border-[#1F1F2E] focus:border-[#00FF88] focus:ring-[#00FF88] rounded-none placeholder-[#4E4E5E] text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="jd" className="text-[11px] code-font text-[#8E8E9E]">JOB DESCRIPTION TEXT</Label>
                  <Textarea 
                    id="jd" 
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste the full job description text here (roles, qualifications, responsibilities, skills)..." 
                    className="bg-[#0A0A0F] border-[#1F1F2E] focus:border-[#00FF88] focus:ring-[#00FF88] rounded-none min-h-[350px] text-xs placeholder-[#4E4E5E] code-font"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2 py-2">
                  <Checkbox 
                    id="save_app" 
                    checked={saveApplication}
                    onCheckedChange={(checked) => setSaveApplication(checked === true)}
                    className="border-[#1F1F2E] bg-[#0A0A0F] text-[#00FF88] focus:ring-0 rounded-none data-[state=checked]:bg-[#00FF88] data-[state=checked]:text-[#0A0A0F]"
                  />
                  <Label htmlFor="save_app" className="text-xs text-[#8E8E9E] code-font select-none cursor-pointer">
                    AUTOMATICALLY STAGE APPLICATION TO TRACKER ON COMPLETE
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#00FF88] text-[#0A0A0F] hover:bg-[#00D972] rounded-none font-bold shadow-[0_0_15px_rgba(0,255,136,0.15)] flex items-center justify-center gap-2 terminal-glow-btn transition-all py-6 text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#0A0A0F]" />
                      <span className="code-font text-xs tracking-wider">RUNNING QUANT DISTANCE ALGORITHMS...</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      <span>INITIALIZE SEMANTIC REASONING</span>
                    </>
                  )}
                </Button>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Results */}
        <div className="space-y-6">
          <Card className="border border-[#1F1F2E] bg-[#0E0E16] text-white rounded-none min-h-[600px] flex flex-col">
            <CardHeader className="border-b border-[#1F1F2E] py-4 bg-[#0A0A0F]">
              <CardTitle className="text-sm font-semibold tracking-wider flex items-center gap-2 text-[#00FF88]" style={{ fontFamily: 'Clash Display' }}>
                <Search size={16} />
                MATCH INTELLIGENCE DATA
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 flex-1 flex flex-col justify-center">
              
              {/* Empty/Awaiting State */}
              {!loading && !result && (
                <div className="text-center space-y-4 py-20 max-w-sm mx-auto">
                  <div className="inline-flex h-12 w-12 items-center justify-center border border-[#1F1F2E] bg-[#0C0C14] text-[#4E4E5E] rounded-none">
                    <Terminal size={20} />
                  </div>
                  <h3 className="text-sm font-semibold tracking-wider code-font text-white">TERMINAL SLEEP MODE</h3>
                  <p className="text-xs text-[#8E8E9E] leading-relaxed">
                    Awaiting target job description text to execute semantic match, vector calculations, and keyword distance estimations.
                  </p>
                </div>
              )}

              {/* Pulsing Scanning Grid (Loading) */}
              {loading && (
                <div className="text-center space-y-6 py-20 max-w-md mx-auto">
                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center border border-[#00FF88]/40 bg-[#0C0C14] text-[#00FF88] rounded-none terminal-glow">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold tracking-widest code-font text-[#00FF88]">CALCULATING MATRIX DISTANCE...</h3>
                    <div className="text-[10px] code-font text-[#4E4E5E] space-y-1 text-left bg-[#0A0A0F] border border-[#1F1F2E] p-3 max-h-32 overflow-hidden">
                      <div className="animate-pulse">[SYS] Loading user profile... OK</div>
                      <div className="animate-pulse delay-100">[SYS] Executing embedding logic via Gemini API... OK</div>
                      <div className="animate-pulse delay-200">[SYS] Comparing skills distances with JD... ACTIVE</div>
                      <div className="animate-pulse delay-300">[SYS] Estimating STAR question frameworks... PENDING</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Result View */}
              {!loading && result && (
                <div className="space-y-6 animate-fade-in text-left">
                  
                  {/* Primary Fit Grid Row */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-[#1F1F2E] p-4 bg-[#0A0A0F]">
                    <div className="flex items-center gap-4">
                      {/* Fit Grade Badge */}
                      <div className={`flex h-16 w-16 items-center justify-center border-2 font-bold text-3xl select-none ${getGradeColor(result.fit_grade)}`}>
                        {result.fit_grade}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold code-font text-white">{result.fit_score}%</span>
                          <span className="text-[10px] code-font text-[#8E8E9E]">MATCH COEFFICIENT</span>
                        </div>
                        <div>
                          {getApplyBadge(result.should_apply)}
                        </div>
                      </div>
                    </div>

                    {/* Fit Advice Box */}
                    <div className="text-xs code-font bg-[#0C0C14] border border-[#1F1F2E] p-2 text-right">
                      <span className="text-[#8E8E9E] block mb-0.5">ROLE SUMMARY</span>
                      <span className="text-white font-medium">{result.role_summary || "General Staff Position"}</span>
                    </div>
                  </div>

                  {/* Recommendation block */}
                  <div className="space-y-1 bg-[#12121E]/30 border border-[#1F1F2E] p-4">
                    <span className="text-[10px] code-font text-[#00FF88] tracking-widest block font-semibold">HONEST ADVICE</span>
                    <p className="text-xs text-[#E1E1E6] leading-relaxed">
                      {result.recommendation}
                    </p>
                  </div>

                  {/* Skills Grid: Strengths and Gaps */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    
                    {/* Matching Skills */}
                    <div className="space-y-2 border border-[#1F1F2E] p-4 bg-[#09090E]">
                      <span className="text-[10px] code-font text-[#00FF88] tracking-widest block font-semibold">MATCHING SKILLS ({result.matching_skills?.length || 0})</span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.matching_skills?.length === 0 ? (
                          <span className="text-xs text-[#4E4E5E] italic">No matching keywords detected</span>
                        ) : (
                          result.matching_skills?.map((item: MatchingSkill) => (
                            <span key={item.skill} className="inline-flex items-center gap-1 bg-[#0A0A0F] border border-[#1F1F2E] text-xs px-2 py-0.5 text-[#E1E1E6]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#00FF88]" />
                              {item.skill}
                              <span className="text-[9px] code-font text-[#8E8E9E] uppercase">({item.strength})</span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Red Flags */}
                    <div className="space-y-2 border border-[#1F1F2E] p-4 bg-[#09090E]">
                      <span className="text-[10px] code-font text-red-400 tracking-widest block font-semibold">RED FLAGS ({result.red_flags?.length || 0})</span>
                      <ul className="space-y-1 list-none">
                        {result.red_flags?.length === 0 ? (
                          <li className="text-xs text-[#4E4E5E] italic">No immediate red flags detected</li>
                        ) : (
                          result.red_flags?.map((flag: string, idx: number) => (
                            <li key={idx} className="text-xs text-[#E1E1E6] flex items-start gap-1.5 leading-snug">
                              <span className="text-red-500 font-bold mt-0.5">&bull;</span>
                              {flag}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>

                  </div>

                  {/* Skill Gaps Table */}
                  <div className="space-y-2 border border-[#1F1F2E] p-4 bg-[#09090E]">
                    <span className="text-[10px] code-font text-amber-500 tracking-widest block font-semibold">SKILL GAP RECTIFICATION PLAN</span>
                    
                    <div className="border border-[#1F1F2E] overflow-hidden">
                      <table className="w-full text-xs text-left text-slate-300">
                        <thead className="bg-[#0A0A0F] text-[10px] code-font text-[#8E8E9E] border-b border-[#1F1F2E]">
                          <tr>
                            <th className="p-2">GAP/MISSING SKILL</th>
                            <th className="p-2 text-center">PRIORITY</th>
                            <th className="p-2 text-right">WEEKS TO LEARN</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1F1F2E]/40">
                          {result.skill_gaps?.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="p-3 text-center text-[#4E4E5E] italic">Perfect skill alignment! Zero gaps detected.</td>
                            </tr>
                          ) : (
                            result.skill_gaps?.map((gap: SkillGap) => (
                              <tr key={gap.skill} className="hover:bg-[#0E0E16]/50">
                                <td className="p-2 font-medium text-white">{gap.skill}</td>
                                <td className="p-2 text-center">
                                  <span className={`inline-block px-1.5 py-0.5 text-[9px] font-medium tracking-wide ${getPriorityColor(gap.priority)}`}>
                                    {gap.priority.toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-2 text-right code-font text-[#00FF88]">{gap.weeks_to_learn} W</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex justify-end gap-3 pt-2">
                    <Button 
                      onClick={() => navigate("/interview", { state: { jdText } })}
                      className="bg-[#0A0A0F] border border-[#00FF88]/40 hover:bg-[#00FF88] text-[#00FF88] hover:text-[#0A0A0F] font-semibold text-xs tracking-wider rounded-none px-4 py-2 transition-all flex items-center gap-1.5"
                    >
                      <QuestionIcon size={12} />
                      RUN INTERVIEW COACH PREP
                    </Button>
                  </div>

                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
