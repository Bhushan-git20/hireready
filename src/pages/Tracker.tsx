import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { 
  ClipboardList, 
  Terminal, 
  Plus, 
  Loader2, 
  Trash2, 
  Eye,
  CheckCircle,
  HelpCircle,
  Briefcase,
  AlertCircle,
  Bookmark
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../components/ui/dialog";
import { toast } from "sonner";

interface ApplicationRecord {
  id: string;
  company: string;
  role: string;
  jd_text?: string;
  notes?: string;
  status: string;
  fit_grade?: string;
  applied_date: string;
  created_at: string;
  user_id: string;
}

interface SkillGapAnalysis {
  skill: string;
  priority: string;
}

interface MatchingSkillAnalysis {
  skill: string;
  strength: string;
}

interface ApplicationAnalysis {
  id: string;
  application_id: string;
  fit_grade: string;
  fit_score: number;
  recommendation: string;
  skill_gaps: SkillGapAnalysis[];
  matching_skills: MatchingSkillAnalysis[];
}

export function Tracker() {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<ApplicationRecord[]>([]);

  // Add App Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jdText, setJdText] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("applied");
  const [saving, setSaving] = useState(false);

  // View Analysis Modal states
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<ApplicationAnalysis | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadTrackerData();
  }, []);

  const loadTrackerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApps(data || []);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load tracker applications.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) {
      toast.error("Company and Role are required fields.");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No session.");

      // Add application
      const { error } = await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          company: company.trim(),
          role: role.trim(),
          jd_text: jdText.trim(),
          notes: notes.trim(),
          status: status,
          fit_grade: "N/A" // Manual entries start with N/A unless analysed
        });

      if (error) throw error;

      toast.success("Application created successfully!");
      setIsAddOpen(false);
      
      // Reset inputs
      setCompany("");
      setRole("");
      setJdText("");
      setNotes("");
      setStatus("applied");

      loadTrackerData();
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to add application.";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", appId);

      if (error) throw error;
      toast.success("Application status updated!");
      loadTrackerData();
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update status.";
      toast.error(errorMessage);
    }
  };

  const handleDeleteApp = async (appId: string) => {
    if (!confirm("Are you sure you want to permanently delete this application?")) return;

    try {
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", appId);

      if (error) throw error;
      toast.success("Application deleted.");
      loadTrackerData();
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete application.";
      toast.error(errorMessage);
    }
  };

  const handleViewAnalysis = async (appId: string) => {
    try {
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .eq("application_id", appId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          toast.info("No AI JD Analysis is saved for this manually added application.");
        } else {
          throw error;
        }
        return;
      }

      if (data) {
        setSelectedAnalysis(data);
        setIsViewOpen(true);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load analysis details.";
      toast.error(errorMessage);
    }
  };

  // Status counters
  const totalCount = apps.length;
  const inProgressCount = apps.filter(a => ["applied", "assessment", "interview"].includes(a.status)).length;
  const offerCount = apps.filter(a => a.status === "offer").length;
  const rejectionCount = apps.filter(a => a.status === "rejected").length;

  const getStatusColor = (val: string) => {
    switch (val) {
      case "applied": return "text-emerald-400 border-emerald-900/50 bg-emerald-950/20";
      case "assessment": return "text-sky-400 border-sky-900/50 bg-sky-950/20";
      case "interview": return "text-amber-400 border-amber-900/50 bg-amber-950/20";
      case "offer": return "text-green-400 border-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(0,255,136,0.1)]";
      case "rejected": return "text-red-400 border-red-900/50 bg-red-950/20";
      default: return "text-slate-400 border-slate-900/50 bg-slate-950/20"; // ghosted
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "text-emerald-400 border-emerald-800/40 bg-emerald-950/30";
      case "B": return "text-green-400 border-green-800/40 bg-green-950/30";
      case "C": return "text-amber-400 border-amber-800/40 bg-amber-950/30";
      case "D": return "text-orange-400 border-orange-800/40 bg-orange-950/30";
      case "F": return "text-red-400 border-red-800/40 bg-red-950/30";
      default: return "text-slate-500 border-slate-800/30 bg-slate-900/30";
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
      
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-wider text-white" style={{ fontFamily: 'Clash Display' }}>
            APPLICATION <span className="text-[#00FF88] glow-text-green">TRACKER</span>
          </h1>
          <p className="text-xs code-font text-[#8E8E9E] mt-1">
            MANAGE AND AUDIT PENDING JOB PIPELINE AND SYSTEM LOG DATA
          </p>
        </div>
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="bg-[#00FF88] text-[#0A0A0F] hover:bg-[#00D972] rounded-none font-semibold flex items-center gap-2 terminal-glow-btn transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>STAGE NEW JOB</span>
        </Button>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        
        {/* Total Staged */}
        <Card className="border border-[#1F1F2E] bg-[#0E0E16] text-white rounded-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] code-font text-[#8E8E9E] block">TOTAL STAGED</span>
              <span className="text-3xl font-bold code-font text-white mt-1 block">{totalCount}</span>
            </div>
            <div className="h-10 w-10 flex items-center justify-center border border-[#1F1F2E] bg-[#0A0A0F] text-[#8E8E9E]">
              <ClipboardList size={18} />
            </div>
          </CardContent>
        </Card>

        {/* Active Pipeline */}
        <Card className="border border-[#1F1F2E] bg-[#0E0E16] text-white rounded-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] code-font text-[#8E8E9E] block">IN PROGRESS</span>
              <span className="text-3xl font-bold code-font text-white mt-1 block text-sky-400">{inProgressCount}</span>
            </div>
            <div className="h-10 w-10 flex items-center justify-center border border-sky-900/50 bg-[#0A0A0F] text-sky-400">
              <Briefcase size={18} />
            </div>
          </CardContent>
        </Card>

        {/* Offers Secured */}
        <Card className="border border-[#1F1F2E] bg-[#0E0E16] text-white rounded-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] code-font text-[#8E8E9E] block">OFFERS SECURED</span>
              <span className="text-3xl font-bold code-font text-white mt-1 block text-[#00FF88] glow-text-green">{offerCount}</span>
            </div>
            <div className="h-10 w-10 flex items-center justify-center border border-green-800 bg-[#0A0A0F] text-[#00FF88] shadow-[0_0_10px_rgba(0,255,136,0.1)]">
              <CheckCircle size={18} />
            </div>
          </CardContent>
        </Card>

        {/* Rejections Logged */}
        <Card className="border border-[#1F1F2E] bg-[#0E0E16] text-white rounded-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] code-font text-[#8E8E9E] block">REJECTIONS LOGGED</span>
              <span className="text-3xl font-bold code-font text-white mt-1 block text-red-400">{rejectionCount}</span>
            </div>
            <div className="h-10 w-10 flex items-center justify-center border border-red-900/50 bg-[#0A0A0F] text-red-400">
              <AlertCircle size={18} />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Tracker Table */}
      <Card className="border border-[#1F1F2E] bg-[#0E0E16] text-white rounded-none">
        <CardHeader className="border-b border-[#1F1F2E] py-4 bg-[#0A0A0F] flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold tracking-wider flex items-center gap-2 text-[#00FF88]" style={{ fontFamily: 'Clash Display' }}>
            <ClipboardList size={16} />
            ACTIVE STAGE REGISTRY
          </CardTitle>
          <span className="text-[10px] code-font text-[#8E8E9E]">{apps.length} RECORD(S) RETRIEVED</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-[#0A0A0F] text-[10px] code-font text-[#8E8E9E] border-b border-[#1F1F2E]">
                <tr>
                  <th className="p-4">COMPANY</th>
                  <th className="p-4">ROLE/POSITION</th>
                  <th className="p-4">DATE STAGED</th>
                  <th className="p-4 text-center">FIT GRADE</th>
                  <th className="p-4">STATUS STATE</th>
                  <th className="p-4 text-right">SYSTEM ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F2E]/40">
                {apps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#4E4E5E] italic code-font">
                      [SYS_EMPTY] Tracker registry containing no active rows. Click 'Stage New Job' to manually input records.
                    </td>
                  </tr>
                ) : (
                  apps.map((app) => (
                    <tr key={app.id} className="hover:bg-[#0A0A0F]/50 transition-colors">
                      <td className="p-4 font-bold text-white tracking-wide">{app.company}</td>
                      <td className="p-4 text-slate-300">{app.role}</td>
                      <td className="p-4 code-font text-[#8E8E9E]">
                        {new Date(app.applied_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-0.5 border text-[10px] font-bold code-font select-none ${getGradeColor(app.fit_grade)}`}>
                          {app.fit_grade || "N/A"}
                        </span>
                      </td>
                      <td className="p-4">
                        <Select 
                          value={app.status} 
                          onValueChange={(val) => handleUpdateStatus(app.id, val)}
                        >
                          <SelectTrigger className={`h-7 w-28 text-[10px] font-semibold tracking-wider rounded-none focus:ring-0 border ${getStatusColor(app.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0E0E16] border-[#1F1F2E] text-white rounded-none">
                            <SelectItem value="applied" className="focus:bg-[#00FF88] focus:text-[#0A0A0F] text-xs rounded-none">APPLIED</SelectItem>
                            <SelectItem value="assessment" className="focus:bg-[#00FF88] focus:text-[#0A0A0F] text-xs rounded-none">ASSESSMENT</SelectItem>
                            <SelectItem value="interview" className="focus:bg-[#00FF88] focus:text-[#0A0A0F] text-xs rounded-none">INTERVIEW</SelectItem>
                            <SelectItem value="offer" className="focus:bg-[#00FF88] focus:text-[#0A0A0F] text-xs rounded-none">OFFER</SelectItem>
                            <SelectItem value="rejected" className="focus:bg-[#00FF88] focus:text-[#0A0A0F] text-xs rounded-none">REJECTED</SelectItem>
                            <SelectItem value="ghosted" className="focus:bg-[#00FF88] focus:text-[#0A0A0F] text-xs rounded-none">GHOSTED</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          onClick={() => handleViewAnalysis(app.id)}
                          className="h-7 w-7 p-0 border border-[#1F1F2E] hover:bg-[#12121E] hover:text-[#00FF88] text-[#8E8E9E] rounded-none"
                          title="View AI Analysis"
                        >
                          <Eye size={12} />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleDeleteApp(app.id)}
                          className="h-7 w-7 p-0 border border-[#1F1F2E] hover:bg-red-950/20 hover:text-red-400 text-[#8E8E9E] rounded-none"
                          title="Delete Application"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* DIALOG 1: Add Application Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-[#0E0E16] border border-[#1F1F2E] text-white rounded-none max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-wider text-[#00FF88]" style={{ fontFamily: 'Clash Display' }}>
              STAGE NEW APPLICATION ROW
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8E8E9E] code-font">
              MANUALLY INJECT APPLICATION SPECIFICS INTO SYSTEM REGISTRY
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateApp} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="add_company" className="text-[10px] code-font text-[#8E8E9E]">COMPANY NAME</Label>
                <Input 
                  id="add_company" 
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google"
                  className="bg-[#0A0A0F] border-[#1F1F2E] focus:border-[#00FF88] focus:ring-[#00FF88] rounded-none text-xs placeholder-[#4E4E5E]"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="add_role" className="text-[10px] code-font text-[#8E8E9E]">ROLE / POSITION</Label>
                <Input 
                  id="add_role" 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. SDE Intern"
                  className="bg-[#0A0A0F] border-[#1F1F2E] focus:border-[#00FF88] focus:ring-[#00FF88] rounded-none text-xs placeholder-[#4E4E5E]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="add_status" className="text-[10px] code-font text-[#8E8E9E]">STATUS STATE</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-[#0A0A0F] border-[#1F1F2E] text-white text-xs rounded-none focus:ring-0 focus:ring-offset-0 focus:border-[#00FF88]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0E0E16] border-[#1F1F2E] text-white rounded-none">
                  <SelectItem value="applied" className="focus:bg-[#00FF88] focus:text-[#0A0A0F] text-xs rounded-none">APPLIED</SelectItem>
                  <SelectItem value="assessment" className="focus:bg-[#00FF88] focus:text-[#0A0A0F] text-xs rounded-none">ASSESSMENT</SelectItem>
                  <SelectItem value="interview" className="focus:bg-[#00FF88] focus:text-[#0A0A0F] text-xs rounded-none">INTERVIEW</SelectItem>
                  <SelectItem value="offer" className="focus:bg-[#00FF88] focus:text-[#0A0A0F] text-xs rounded-none">OFFER</SelectItem>
                  <SelectItem value="rejected" className="focus:bg-[#00FF88] focus:text-[#0A0A0F] text-xs rounded-none">REJECTED</SelectItem>
                  <SelectItem value="ghosted" className="focus:bg-[#00FF88] focus:text-[#0A0A0F] text-xs rounded-none">GHOSTED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="add_notes" className="text-[10px] code-font text-[#8E8E9E]">SYSTEM NOTES</Label>
              <Input 
                id="add_notes" 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., HR reached out / applied via campus placement"
                className="bg-[#0A0A0F] border-[#1F1F2E] focus:border-[#00FF88] focus:ring-[#00FF88] rounded-none text-xs placeholder-[#4E4E5E]"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="add_jd" className="text-[10px] code-font text-[#8E8E9E]">JD RAW TEXT (OPTIONAL)</Label>
              <Textarea 
                id="add_jd" 
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Job specifications text, needed if you plan to generate interview questions later."
                className="bg-[#0A0A0F] border-[#1F1F2E] focus:border-[#00FF88] focus:ring-[#00FF88] rounded-none min-h-[120px] text-xs placeholder-[#4E4E5E] code-font"
              />
            </div>

            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="text-[#8E8E9E] rounded-none border border-[#1F1F2E] hover:bg-[#12121E]">
                  CANCEL
                </Button>
              </DialogClose>
              <Button type="submit" disabled={saving} className="bg-[#00FF88] text-[#0A0A0F] hover:bg-[#00D972] rounded-none font-semibold px-4 flex items-center gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark size={14} />}
                SAVE RECORD
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: View Analysis Summary Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="bg-[#0E0E16] border border-[#1F1F2E] text-white rounded-none max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#1F1F2E] pb-3">
            <DialogTitle className="text-lg font-bold tracking-wider text-[#00FF88] flex items-center gap-2" style={{ fontFamily: 'Clash Display' }}>
              <Terminal size={18} />
              AI MATCH ARCHIVE LOGS
            </DialogTitle>
          </DialogHeader>

          {selectedAnalysis && (
            <div className="space-y-4 py-4 text-xs">
              
              {/* Score header */}
              <div className="flex items-center gap-4 bg-[#0A0A0F] border border-[#1F1F2E] p-4">
                <div className={`flex h-14 w-14 items-center justify-center border font-bold text-2xl select-none ${getGradeColor(selectedAnalysis.fit_grade)}`}>
                  {selectedAnalysis.fit_grade}
                </div>
                <div>
                  <div className="text-xl font-bold code-font text-white">{selectedAnalysis.fit_score}% MATCH</div>
                  <div className="text-[9px] code-font text-[#8E8E9E]">SEMANTIC COMPATIBILITY COEFFICIENT</div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="space-y-1">
                <span className="text-[9px] code-font text-[#00FF88] tracking-widest block font-semibold uppercase">SYSTEM ANALYSIS</span>
                <p className="text-slate-300 leading-relaxed bg-[#0A0A0F] border border-[#1F1F2E] p-3 italic">
                  "{selectedAnalysis.recommendation}"
                </p>
              </div>

              {/* Skill Gaps list */}
              <div className="space-y-1">
                <span className="text-[9px] code-font text-amber-500 tracking-widest block font-semibold uppercase">IDENTIFIED SKILL GAPS</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAnalysis.skill_gaps?.map((gap: SkillGapAnalysis, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-[#0A0A0F] border border-[#1F1F2E] text-xs px-2 py-0.5 text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {gap.skill}
                      <span className="text-[9px] code-font text-[#8E8E9E]">({gap.priority})</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Matching Skills list */}
              <div className="space-y-1">
                <span className="text-[9px] code-font text-[#00FF88] tracking-widest block font-semibold uppercase">CONFIRMED MATCHES</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAnalysis.matching_skills?.map((item: MatchingSkillAnalysis, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-[#0A0A0F] border border-[#1F1F2E] text-xs px-2 py-0.5 text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#00FF88]" />
                      {item.skill}
                      <span className="text-[9px] code-font text-[#8E8E9E]">({item.strength})</span>
                    </span>
                  ))}
                </div>
              </div>

            </div>
          )}

          <DialogFooter className="border-t border-[#1F1F2E] pt-3">
            <DialogClose asChild>
              <Button type="button" className="bg-[#00FF88] text-[#0A0A0F] hover:bg-[#00D972] rounded-none font-semibold px-4">
                CLOSE LOGS
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
