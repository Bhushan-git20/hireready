import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { 
  TrendingDown, 
  Terminal, 
  Loader2, 
  Play, 
  AlertCircle,
  Lightbulb, 
  CheckCircle,
  HelpCircle,
  Target,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { toast } from "sonner";

interface RejectionPattern {
  title: string;
  description: string;
}

interface SkillGapPattern {
  skill: string;
  frequency: string;
  recommendation: string;
}

interface ActionItem {
  priority: string;
  action: string;
  rationale: string;
}

interface RecommendedRole {
  role: string;
  reason: string;
}

interface RejectionAnalytics {
  confidence_score: number;
  patterns: RejectionPattern[];
  skill_gap_patterns: SkillGapPattern[];
  action_items: ActionItem[];
  recommended_roles: RecommendedRole[];
}

export function Rejections() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [appsCount, setAppsCount] = useState(0);
  const [analytics, setAnalytics] = useState<RejectionAnalytics | null>(null);

  useEffect(() => {
    checkApplicationsCount();
  }, []);

  const checkApplicationsCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("applications")
        .select("id")
        .eq("user_id", user.id);

      if (error) throw error;
      setAppsCount(data ? data.length : 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setAnalytics(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Authentication session missing. Please re-login.");
        setAnalyzing(false);
        return;
      }

      // Invoke Supabase Deno Edge Function
      const { data, error } = await supabase.functions.invoke("rejection-analyse");

      if (error) throw error;

      if (data && data.success) {
        setAnalytics(data);
        toast.success("AI Rejection Analysis Complete!");
      } else {
        throw new Error(data?.error || "Invalid response format.");
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to execute rejection analysis.";
      toast.error(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-400 border-red-900/50 bg-red-950/20";
      case "medium": return "text-amber-400 border-amber-900/50 bg-amber-950/20";
      default: return "text-slate-400 border-slate-900/50 bg-slate-950/20";
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-[#00FF88]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Under-limit Restricted State (Requires 5+ applications)
  const isRestricted = appsCount < 5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-wider text-white" style={{ fontFamily: 'Clash Display' }}>
          REJECTION <span className="text-[#00FF88] glow-text-green">ANALYSER</span>
        </h1>
        <p className="text-xs code-font text-[#8E8E9E] mt-1">
          EXECUTE SYSTEM SCANS TO CLASSIFY RECURRING PATTERNS IN APPLICATION GHOSTINGS & REJECTIONS
        </p>
      </div>

      {isRestricted ? (
        /* Restricted State View */
        <div className="max-w-2xl mx-auto py-12">
          <Card className="border border-amber-800/30 bg-[#0E0E16] text-white rounded-none relative overflow-hidden">
            {/* Warning top accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-600" />
            
            <CardHeader className="text-center pt-8 space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center bg-amber-950/40 text-amber-500 border border-amber-800/30 rounded-none">
                <AlertCircle size={22} className="animate-pulse" />
              </div>
              <CardTitle className="text-lg tracking-wider text-white" style={{ fontFamily: 'Clash Display' }}>
                LOGIC PIPELINE INTERRUPTED
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs px-6 leading-relaxed">
                System analytics require a baseline of at least **5 applications** staged in your registry to run pattern recognition models accurately. Without a reliable dataset, calculations may result in high uncertainty margins.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="space-y-2 max-w-sm mx-auto">
                <div className="flex items-center justify-between text-xs code-font text-slate-400">
                  <span>STAGED DATAPOINTS</span>
                  <span className="text-amber-500 font-bold">{appsCount} / 5</span>
                </div>
                <Progress value={(appsCount / 5) * 100} className="h-2 bg-[#1F1F2E]" indicatorClassName="bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]" />
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => navigate("/tracker")}
                  className="bg-transparent border border-amber-700/40 hover:bg-amber-950/20 text-amber-400 rounded-none font-bold text-xs tracking-wider"
                >
                  STAGE APPLICATIONS IN TRACKER
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Fully Staged Execution State */
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          
          {/* Left Column: Core Execution */}
          <div className="xl:col-span-1 space-y-6">
            <Card className="border border-[#1F1F2E] bg-[#0E0E16] text-white rounded-none">
              <CardHeader className="border-b border-[#1F1F2E] py-4 bg-[#0A0A0F]">
                <CardTitle className="text-sm font-semibold tracking-wider flex items-center gap-2 text-[#00FF88]" style={{ fontFamily: 'Clash Display' }}>
                  <Terminal size={16} />
                  ANALYTICS INITIALIZATION
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="text-xs leading-relaxed text-[#8E8E9E] space-y-2">
                  <p>Our system has retrieved **{appsCount} staged applications** from your database context registry.</p>
                  <p>Click below to parse your applications, match history, notes, and JDs against the Gemini pattern analysis engine. We will extract recurrence coefficients for missing skills, position mismatches, and flag constructive strategy changes.</p>
                </div>

                <Button 
                  onClick={handleRunAnalysis}
                  disabled={analyzing}
                  className="w-full bg-[#00FF88] text-[#0A0A0F] hover:bg-[#00D972] rounded-none font-bold shadow-[0_0_15px_rgba(0,255,136,0.15)] flex items-center justify-center gap-2 terminal-glow-btn transition-all py-5 text-xs tracking-wider"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#0A0A0F]" />
                      <span className="code-font text-[10px]">SCANNED DATAPOINTS...</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span>RUN PATTERN ANALYSIS</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Analytics Results */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="border border-[#1F1F2E] bg-[#0E0E16] text-white rounded-none min-h-[500px] flex flex-col">
              <CardHeader className="border-b border-[#1F1F2E] py-4 bg-[#0A0A0F]">
                <CardTitle className="text-sm font-semibold tracking-wider flex items-center gap-2 text-[#00FF88]" style={{ fontFamily: 'Clash Display' }}>
                  <TrendingDown size={16} />
                  AI REJECTION INTEL REPORTS
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col justify-center">
                
                {/* Empty/Awaiting State */}
                {!analyzing && !analytics && (
                  <div className="text-center space-y-4 py-16 max-w-sm mx-auto">
                    <div className="inline-flex h-12 w-12 items-center justify-center border border-[#1F1F2E] bg-[#0C0C14] text-[#4E4E5E] rounded-none">
                      <TrendingUp size={20} />
                    </div>
                    <h3 className="text-sm font-semibold tracking-wider code-font text-white">REJECTION LOGS STANDBY</h3>
                    <p className="text-xs text-[#8E8E9E] leading-relaxed">
                      Staged data baseline met. Click Run Pattern Analysis to compile time-series analysis over application logs.
                    </p>
                  </div>
                )}

                {/* Loading prompt */}
                {analyzing && (
                  <div className="text-center space-y-6 py-16 max-w-md mx-auto">
                    <div className="relative mx-auto flex h-16 w-16 items-center justify-center border border-[#00FF88]/40 bg-[#0C0C14] text-[#00FF88] rounded-none terminal-glow">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold tracking-widest code-font text-[#00FF88]">PROCESSING CONVERGENCE MODELS...</h3>
                      <div className="text-[10px] code-font text-[#4E4E5E] space-y-1 text-left bg-[#0A0A0F] border border-[#1F1F2E] p-3 max-h-32 overflow-hidden">
                        <div>[AI] Indexing application feedback parameters... OK</div>
                        <div>[AI] Aggregating skill deficit ratios... OK</div>
                        <div>[AI] Running regression over rejection triggers... ACTIVE</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Result view */}
                {!analyzing && analytics && (
                  <div className="space-y-6 animate-fade-in text-left">
                    
                    {/* Confidence Score Bar */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-[#1F1F2E] p-4 bg-[#0A0A0F]">
                      <div className="space-y-1">
                        <span className="text-[10px] code-font text-[#8E8E9E]">ANALYSIS CONFIDENCE RATING</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold code-font text-white">{analytics.confidence_score}%</span>
                          <span className="text-[9px] code-font text-[#00FF88]">HIGH QUALITY DATAPOOL</span>
                        </div>
                      </div>
                      
                      <div className="text-xs code-font bg-[#0C0C14] border border-[#1F1F2E] p-2 text-right">
                        <span className="text-[#8E8E9E] block mb-0.5">DATAPOINTS USED</span>
                        <span className="text-white font-bold">{appsCount} Applications</span>
                      </div>
                    </div>

                    {/* Detected Patterns */}
                    <div className="space-y-3">
                      <span className="text-[10px] code-font text-[#00FF88] tracking-widest block font-semibold">DETECTED REJECTION PATTERNS</span>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {analytics.patterns?.map((pat: RejectionPattern, idx: number) => (
                          <div key={idx} className="border border-[#1F1F2E] p-4 bg-[#09090E] space-y-2">
                            <span className="text-xs font-bold text-white block tracking-wider" style={{ fontFamily: 'Clash Display' }}>
                              {pat.title}
                            </span>
                            <p className="text-xs text-[#8E8E9E] leading-relaxed">
                              {pat.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recurrent Skill Gaps */}
                    <div className="space-y-3">
                      <span className="text-[10px] code-font text-amber-500 tracking-widest block font-semibold">RECURRENT SKILL DEFICIT CLUSTERS</span>
                      <div className="border border-[#1F1F2E] overflow-hidden">
                        <table className="w-full text-xs text-left text-slate-300">
                          <thead className="bg-[#0A0A0F] text-[10px] code-font text-[#8E8E9E] border-b border-[#1F1F2E]">
                            <tr>
                              <th className="p-2">RECURRING GAP</th>
                              <th className="p-2 text-center">FREQUENCY</th>
                              <th className="p-2 text-right">RECTIFICATION RESOURCE</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1F1F2E]/40">
                            {analytics.skill_gap_patterns?.map((gap: SkillGapPattern, idx: number) => (
                              <tr key={idx} className="hover:bg-[#0E0E16]/50">
                                <td className="p-2 font-bold text-white">{gap.skill}</td>
                                <td className="p-2 text-center">
                                  <span className={`inline-block px-1.5 py-0.5 text-[9px] font-medium tracking-wide border ${getPriorityColor(gap.frequency.toLowerCase())}`}>
                                    {gap.frequency.toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-2 text-right text-[#8E8E9E] italic">{gap.recommendation}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Corrective Action Items */}
                    <div className="space-y-3">
                      <span className="text-[10px] code-font text-[#00FF88] tracking-widest block font-semibold">CORRECTIVE SYSTEM ACTION ITEMS</span>
                      <div className="space-y-3">
                        {analytics.action_items?.map((item: ActionItem, idx: number) => (
                          <div key={idx} className="flex gap-4 border border-[#1F1F2E] p-4 bg-[#09090E]">
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] code-font text-[#8E8E9E] mb-1">PRIORITY</span>
                              <span className={`px-2 py-0.5 border text-[9px] font-bold tracking-wider uppercase ${getPriorityColor(item.priority)}`}>
                                {item.priority}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <strong className="text-white text-xs block font-bold">{item.action}</strong>
                              <p className="text-xs text-[#8E8E9E] leading-relaxed">{item.rationale}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommended target shifts */}
                    <div className="space-y-3">
                      <span className="text-[10px] code-font text-[#00FF88] tracking-widest block font-semibold">RECOMMENDED ROLE/STRATEGY SHIFTS</span>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {analytics.recommended_roles?.map((role: RecommendedRole, idx: number) => (
                          <div key={idx} className="border border-[#1F1F2E] p-4 bg-[#09090E] flex gap-3">
                            <div className="text-[#00FF88] mt-0.5"><Target size={16} className="glow-text-green" /></div>
                            <div className="space-y-1">
                              <strong className="text-white text-xs block font-semibold">{role.role}</strong>
                              <p className="text-xs text-[#8E8E9E] leading-relaxed">{role.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

              </CardContent>
            </Card>
          </div>

        </div>
      )}
    </div>
  );
}
