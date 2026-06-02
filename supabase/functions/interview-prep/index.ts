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

    const { jd_text, application_id } = await req.json();
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
      : "USER PROFILE: Not set up yet.";

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const prompt = `You are an elite technical and behavioral interviewer in India. Generate 6-8 STAR format (Situation, Task, Action, Result) interview questions customized for the following Job Description and user's profile.

${profileContext}

JOB DESCRIPTION:
${jd_text.slice(0, 4000)}

Generate exactly 6-8 questions. For each question, explain why it is asked, provide a framework to answer, customize an example answer based on the user's projects/skills/profile, and list 2-3 follow-up questions.
Return ONLY valid JSON in this exact structure:
{
  "questions": [
    {
      "question": "<question text>",
      "why_asked": "<1 sentence explanation>",
      "framework": "<brief bullet points on how the user should structure their thoughts>",
      "example_answer": "<personalized STAR framework answer matching user's profile>",
      "follow_ups": ["<follow-up 1>", "<follow-up 2>"]
    }
  ]
}

Ensure the answers are deeply personalized using the user's specific skills and projects. If no profile exists, write generic excellent examples.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
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

    // Save star_questions to existing analysis record if application_id is provided
    if (application_id) {
      const { error: updateError } = await supabase
        .from("analyses")
        .update({ star_questions: parsedResult.questions })
        .eq("user_id", user.id)
        .eq("application_id", application_id);

      if (updateError) console.error("Update analysis error:", updateError);
    }

    return new Response(JSON.stringify({ success: true, questions: parsedResult.questions }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("interview-prep error:", err);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
