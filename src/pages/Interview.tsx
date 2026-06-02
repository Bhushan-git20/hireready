import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { 
  HelpCircle, 
  Terminal, 
  Loader2, 
  Play, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  CheckCircle2, 
  ArrowRight,
  BookOpen
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { toast } from "sonner";

interface InterviewApplication {
  id: string;
  company: string;
  role: string;
  jd_text: string;
}

interface QuestionItem {
  question: string;
  why_asked: string;
  framework: string;
  example_answer: string;
  follow_ups: string[];
}

export function Interview() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [jdText, setJdText] = useState("");
  const [savedApps, setSavedApps] = useState<InterviewApplication[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("manual");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);

  useEffect(() => {
    // Check if redirect came with a prefilled JD
    if (location.state && location.state.jdText) {
      setJdText(location.state.jdText);
    }
    loadApplications();
  }, [location]);

  const loadApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("applications")
        .select("id, company, role, jd_text")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedApps(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAppChange = (val: string) => {
    setSelectedAppId(val);
    if (val === "manual") {
      setJdText("");
    } else {
      const selected = savedApps.find(app => app.id === val);
      if (selected) {
        setJdText(selected.jd_text);
      }
    }
  };

  const handleGeneratePrep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) {
      toast.error("Please paste or select a Job Description.");
      return;
    }

    setLoading(true);
    setQuestions([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Authentication session missing. Please re-login.");
        setLoading(false);
        return;
      }

      // Invoke Supabase Deno Edge Function
      const { data, error } = await supabase.functions.invoke("interview-prep", {
        body: {
          jd_text: jdText,
          application_id: selectedAppId !== "manual" ? selectedAppId : null,
        },
      });

      if (error) throw error;

      if (data && data.success) {
        setQuestions(data.questions);
        toast.success("Interview prep generated successfully!");
      } else {
        throw new Error(data?.error || "Invalid response format.");
      }
    } catch (err) {
      console.error("Prep failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate interview prep.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-wider text-white" style={{ fontFamily: 'Clash Display' }}>
          INTERVIEW <span className="text-[#00FF88] glow-text-green">PREP</span>
        </h1>
        <p className="text-xs code-font text-[#8E8E9E] mt-1">
          GENERATE STAR FRAMEWORK BEHAVIORAL QUESTIONS TAILORED TO PROFILE AND JD
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Select Source / Past JD */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-[#1F1F2E] bg-[#0E0E16] text-white rounded-none">
            <CardHeader className="border-b border-[#1F1F2E] py-4 bg-[#0A0A0F]">
              <CardTitle className="text-sm font-semibold tracking-wider flex items-center gap-2 text-[#00FF88]" style={{ fontFamily: 'Clash Display' }}>
                <Terminal size={16} />
                CONFIGURATION SETUP
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <form onSubmit={handleGeneratePrep} className="space-y-4">
                
                <div className="space-y-1.5">
                  <Label htmlFor="source" className="text-[11px] code-font text-[#8E8E9E]">SELECT JD SOURCE</Label>
                  <Select value={selectedAppId} onValueChange={handleAppChange}>
                    <SelectTrigger className="bg-[#0A0A0F] border-[#1F1F2E] text-white rounded-none focus:ring-0 focus:ring-offset-0 focus:border-[#00FF88]">
                      <SelectValue placeholder="Select Application" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0E0E16] border-[#1F1F2E] text-white rounded-none">
                      <SelectItem value="manual" className="focus:bg-[#00FF88] focus:text-[#0A0A0F] rounded-none">Paste Manually</SelectItem>
                      {savedApps.map(app => (
                        <SelectItem key={app.id} value={app.id} className="focus:bg-[#00FF88] focus:text-[#0A0A0F] rounded-none">
                          {app.company} — {app.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="jd" className="text-[11px] code-font text-[#8E8E9E]">JOB SPECIFICATION TEXT</Label>
                  <Textarea
                    id="jd"
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste JD text here if not selecting from tracker..."
                    className="bg-[#0A0A0F] border-[#1F1F2E] focus:border-[#00FF88] focus:ring-[#00FF88] rounded-none min-h-[250px] text-xs placeholder-[#4E4E5E] code-font"
                    disabled={selectedAppId !== "manual"}
                    required
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00FF88] text-[#0A0A0F] hover:bg-[#00D972] rounded-none font-bold shadow-[0_0_15px_rgba(0,255,136,0.15)] flex items-center justify-center gap-2 terminal-glow-btn transition-all py-5 text-xs tracking-wider"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#0A0A0F]" />
                      <span className="code-font text-[10px]">PREPARING RESPONSES...</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span>GENERATE INTERVIEW PREP</span>
                    </>
                  )}
                </Button>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Questions Accordion */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-[#1F1F2E] bg-[#0E0E16] text-white rounded-none min-h-[500px] flex flex-col">
            <CardHeader className="border-b border-[#1F1F2E] py-4 bg-[#0A0A0F]">
              <CardTitle className="text-sm font-semibold tracking-wider flex items-center gap-2 text-[#00FF88]" style={{ fontFamily: 'Clash Display' }}>
                <HelpCircle size={16} />
                CUSTOM STAR QUESTION BANK
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-center">
              
              {/* Empty/Awaiting State */}
              {!loading && questions.length === 0 && (
                <div className="text-center space-y-4 py-16 max-w-sm mx-auto">
                  <div className="inline-flex h-12 w-12 items-center justify-center border border-[#1F1F2E] bg-[#0C0C14] text-[#4E4E5E] rounded-none">
                    <BookOpen size={20} />
                  </div>
                  <h3 className="text-sm font-semibold tracking-wider code-font text-white">INTERVIEW LOGIC OFFLINE</h3>
                  <p className="text-xs text-[#8E8E9E] leading-relaxed">
                    Paste a job description or select a staged application from the sidebar, then click Generate to initialize our custom STAR question framework index.
                  </p>
                </div>
              )}

              {/* Loading Prompt */}
              {loading && (
                <div className="text-center space-y-6 py-16 max-w-md mx-auto">
                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center border border-[#00FF88]/40 bg-[#0C0C14] text-[#00FF88] rounded-none terminal-glow">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold tracking-widest code-font text-[#00FF88]">COMPILING PERSONALIZED STAR ANSWERS...</h3>
                    <div className="text-[10px] code-font text-[#4E4E5E] space-y-1 text-left bg-[#0A0A0F] border border-[#1F1F2E] p-3 max-h-32 overflow-hidden">
                      <div>[AI] Reading JD technical requirements... OK</div>
                      <div>[AI] Referencing academic profile variables... OK</div>
                      <div>[AI] Writing SITUATION constructs... OK</div>
                      <div>[AI] Customizing RESULT CGPA highlights... ACTIVE</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions List */}
              {!loading && questions.length > 0 && (
                <div className="space-y-6 animate-fade-in text-left">
                  
                  {/* Tips banner */}
                  <div className="flex gap-3 bg-[#1A1A26]/30 border border-[#00FF88]/20 p-4 text-xs leading-relaxed text-[#E1E1E6]">
                    <div className="text-[#00FF88] mt-0.5"><Lightbulb size={16} className="glow-text-green" /></div>
                    <div className="space-y-1">
                      <strong className="text-white block font-semibold">TIPS FOR THE INTERVIEW</strong>
                      <span>These answers are mathematically mapped to highlight your exact matching skills and projects in the STAR format. Review how your projects (like MindCare) are contextualized under the Result/Action headings to wow the interviewer.</span>
                    </div>
                  </div>

                  <Accordion type="single" collapsible className="w-full space-y-3">
                    {questions.map((q, idx) => (
                      <AccordionItem 
                        key={idx} 
                        value={`item-${idx}`}
                        className="border border-[#1F1F2E] bg-[#0A0A0F] rounded-none px-4 py-2"
                      >
                        <AccordionTrigger className="hover:no-underline text-left py-3 group">
                          <div className="flex gap-3 items-start">
                            <span className="text-[10px] code-font text-[#00FF88] border border-[#00FF88]/30 px-1.5 py-0.5 mt-0.5 select-none font-bold">
                              Q{idx + 1}
                            </span>
                            <span className="text-sm font-semibold text-white group-hover:text-[#00FF88] transition-colors leading-snug">
                              {q.question}
                            </span>
                          </div>
                        </AccordionTrigger>
                        
                        <AccordionContent className="pt-4 border-t border-[#1F1F2E] space-y-4 pb-4">
                          
                          {/* Why Asked */}
                          <div className="space-y-1 bg-[#0E0E16] border border-[#1F1F2E]/40 p-3">
                            <span className="text-[9px] code-font text-amber-500 font-bold tracking-widest block">WHY THE RECRUITER ASKS THIS</span>
                            <p className="text-xs text-[#8E8E9E] leading-relaxed">{q.why_asked}</p>
                          </div>

                          {/* Cognitive Framework */}
                          <div className="space-y-1">
                            <span className="text-[9px] code-font text-[#00FF88] font-bold tracking-widest block">COGNITIVE ANSWER FRAMEWORK</span>
                            <div className="text-xs text-[#E1E1E6] leading-relaxed pl-1 whitespace-pre-line">
                              {q.framework}
                            </div>
                          </div>

                          {/* Example STAR Answer */}
                          <div className="space-y-1 bg-[#1A1A26]/10 border border-[#00FF88]/10 p-4">
                            <span className="text-[9px] code-font text-[#00FF88] font-bold tracking-widest block">PERSONALIZED STAR MODEL RESPONSE</span>
                            <p className="text-xs text-white leading-relaxed whitespace-pre-line italic">
                              "{q.example_answer}"
                            </p>
                          </div>

                          {/* Follow-up Questions */}
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[9px] code-font text-[#8E8E9E] font-bold tracking-widest block">EXPECTED DRILL-DOWN FOLLOW-UPS</span>
                            <div className="flex flex-wrap gap-2 pl-1">
                              {q.follow_ups?.map((follow: string, fIdx: number) => (
                                <span key={fIdx} className="inline-flex items-center gap-1 bg-[#0E0E16] border border-[#1F1F2E] text-xs px-2 py-1 text-slate-300">
                                  <ArrowRight size={10} className="text-[#00FF88]" />
                                  {follow}
                                </span>
                              ))}
                            </div>
                          </div>

                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
