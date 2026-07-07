/* ============================================================
   SHREVIA — investor inquiry endpoint (Vercel serverless function)

   Deployed automatically by Vercel as POST /api/contact.
   Forwards the inquiry to the Google Apps Script web app, which
   appends it to the Google Sheet. The script URL is never exposed
   to the browser — it lives in the APP_SCRIPT_URL environment
   variable (Vercel → Project → Settings → Environment Variables).

   Field names (Name / Email / Number / Message) intentionally
   match the existing Apps Script's e.parameter keys.
   ============================================================ */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { Name, Email, Number, Message } = req.body || {};

    if (!Name || !Email || !Message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const APP_SCRIPT_URL = process.env.APP_SCRIPT_URL;
    if (!APP_SCRIPT_URL) {
      console.error("APP_SCRIPT_URL is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const upstream = await fetch(APP_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        Name: String(Name).slice(0, 200),
        Email: String(Email).slice(0, 200),
        Number: String(Number || "").slice(0, 30),
        Message: String(Message).slice(0, 4000),
      }).toString(),
    });

    // Apps Script replies via a 302 redirect that fetch follows;
    // a non-ok final status means the script itself failed.
    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      console.error("Apps Script error:", upstream.status, text.slice(0, 300));
      return res.status(502).json({ error: "Upstream error" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Contact handler error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
