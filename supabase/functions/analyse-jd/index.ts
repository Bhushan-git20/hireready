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

    const { jd_text, save_application, company, role } = await req.json();
    if (!jd_text) return new Response(JSON.stringify({ error: "jd_text required" }), { status: 400, headers: cors });

    // Fetch user profile for context
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills, experience_text, projects_text, resume_text, target_roles, cgpa")
      .eq("user_id", user.id)
      .single();

    const hasProfile = profile && (profile.skills?.length > 0 || profile.experience_text);

    const profileContext = hasProfile
      ? `
USER PROFILE:
Skills: ${profile.skills?.join(", ") || "Not specified"}
Experience: ${profile.experience_text || "Not specified"}
Projects: ${profile.projects_text || "Not specified"}
Target Roles: ${profile.target_roles?.join(", ") || "Not specified"}
CGPA: ${profile.cgpa || "Not specified"}
Resume: ${profile.resume_text ? profile.resume_text.slice(0, 2000) : "Not provided"}
`
      : "USER PROFILE: Not set up yet. Analyse the JD generally.";

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const prompt = `You are a career advisor helping a fresher in India evaluate a job opportunity.

${profileContext}

JOB DESCRIPTION:
${jd_text.slice(0, 4000)}

Analyse this JD against the user's profile and return ONLY valid JSON in this exact structure:
{
  "fit_grade": "A" | "B" | "C" | "D" | "F",
  "fit_score": <number 0-100>,
  "should_apply": <boolean>,
  "recommendation": "<2-3 sentence honest recommendation>",
  "matching_skills": [
    { "skill": "<skill name>", "strength": "strong" | "moderate" | "weak" }
  ],
  "skill_gaps": [
    { "skill": "<missing skill>", "priority": "critical" | "important" | "nice-to-have", "weeks_to_learn": <number> }
  ],
  "role_summary": "<1 sentence: what this role actually does>",
  "red_flags": ["<any concerns about this JD>"],
  "apply_now": <boolean>,
  "upskill_first": <boolean>
}

Grade guide: A = 80%+ match, B = 60-79%, C = 40-59%, D = 20-39%, F = below 20%.
Be honest and specific. Do not be overly optimistic.`;

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

    const analysis = JSON.parse(rawText);

    // Save to analyses table
    const { data: savedAnalysis, error: saveError } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        jd_text,
        fit_grade: analysis.fit_grade,
        fit_score: analysis.fit_score,
        recommendation: analysis.recommendation,
        skill_gaps: analysis.skill_gaps,
        matching_skills: analysis.matching_skills,
        star_questions: [],
        should_apply: analysis.should_apply,
      })
      .select()
      .single();

    if (saveError) console.error("Save error:", saveError);

    // Optionally save application
    if (save_application && company && role) {
      const { data: app } = await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          company,
          role,
          jd_text,
          fit_grade: analysis.fit_grade,
          status: "applied",
        })
        .select()
        .single();

      if (app && savedAnalysis) {
        await supabase
          .from("analyses")
          .update({ application_id: app.id })
          .eq("id", savedAnalysis.id);
      }
    }

    return new Response(JSON.stringify({ success: true, analysis, analysis_id: savedAnalysis?.id }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("analyse-jd error:", err);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
