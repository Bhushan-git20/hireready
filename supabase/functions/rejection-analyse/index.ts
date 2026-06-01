import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });

    // Fetch user profile for context
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills, experience_text, projects_text, resume_text, target_roles, cgpa")
      .eq("user_id", user.id)
      .single();

    // Fetch all user's applications
    const { data: applications, error: appsError } = await supabase
      .from("applications")
      .select("company, role, status, jd_text, fit_grade, applied_date, notes")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (appsError) throw appsError;

    // Check count requirement (requires 5+ applications)
    if (!applications || applications.length < 5) {
      return new Response(
        JSON.stringify({
          error: "Minimum of 5 applications required for rejection pattern analysis.",
          count: applications ? applications.length : 0,
        }),
        { status: 400, headers: cors }
      );
    }

    const profileContext = profile
      ? `
USER PROFILE:
Skills: ${profile.skills?.join(", ") || "Not specified"}
Experience: ${profile.experience_text || "Not specified"}
Projects: ${profile.projects_text || "Not specified"}
Target Roles: ${profile.target_roles?.join(", ") || "Not specified"}
CGPA: ${profile.cgpa || "Not specified"}
Resume: ${profile.resume_text ? profile.resume_text.slice(0, 1500) : "Not provided"}
`
      : "USER PROFILE: Not set up yet.";

    const appsContext = applications
      .map((app, index) => {
        return `
APPLICATION #${index + 1}:
Company: ${app.company}
Role: ${app.role}
Status: ${app.status}
Fit Grade: ${app.fit_grade || "N/A"}
Applied Date: ${app.applied_date}
JD Snippet: ${app.jd_text ? app.jd_text.slice(0, 400) : "N/A"}
Notes: ${app.notes || "None"}
`;
      })
      .join("\n");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const prompt = `You are a brilliant career coach and recruiting director in India. You are performing a deep-dive rejection analysis on a fresher/MCA student's job hunt history to find systemic issues, mismatch patterns, and identify corrective action.

${profileContext}

APPLICATION HISTORY:
${appsContext}

Analyse the history and return ONLY valid JSON in this exact structure:
{
  "patterns": [
    {
      "title": "<pattern name, e.g., Target Role Mismatch>",
      "description": "<detailed honest description of the pattern found in rejections/ghostings>"
    }
  ],
  "skill_gap_patterns": [
    {
      "skill": "<skill name>",
      "frequency": "<how often this gap led to problems, e.g. High | Medium>",
      "recommendation": "<practical resource or way to learn this immediately>"
    }
  ],
  "action_items": [
    {
      "priority": "high" | "medium" | "low",
      "action": "<specific structural shift, e.g., Stop applying to Lead roles>",
      "rationale": "<why this is recommended based on data>"
    }
  ],
  "recommended_roles": [
    {
      "role": "<recommended role title>",
      "reason": "<why this is a better fit for their current profile>"
    }
  ],
  "confidence_score": <number 0-100 indicating the analysis strength based on volume of data>
}

Be completely honest, constructive, and direct. Do not sugarcoat.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      throw new Error(`Gemini error: ${err}`);
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("Empty Gemini response");

    const parsedResult = JSON.parse(rawText);

    return new Response(JSON.stringify({ success: true, ...parsedResult }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("rejection-analyse error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
