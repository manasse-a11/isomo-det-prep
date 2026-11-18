# ISOMO Prep Center — Python Copy

This is a separate Python implementation of ISOMO Prep Center. It lives on the `python-copy` branch and does not change the production `main` branch or the current Vercel app.

## Open in VS Code

1. Open this repository in GitHub and select the `python-copy` branch.
2. Click **Code → Download ZIP**, or clone the branch:
   ```bash
   git clone -b python-copy https://github.com/manasse-a11/isomo-det-prep.git
   ```
3. Open the downloaded project in VS Code.
4. Create and activate a virtual environment:
   - Windows PowerShell: `py -m venv .venv` then `.venv\\Scripts\\Activate.ps1`
   - macOS/Linux: `python3 -m venv .venv` then `source .venv/bin/activate`
5. Install dependencies: `pip install -r requirements.txt`
6. Run: `streamlit run python_copy/app.py`

## Configuration (optional)

Create `.streamlit/secrets.toml` locally (never commit secrets):

```toml
SUPABASE_URL = "https://YOUR_PROJECT.supabase.co"
SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"
GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"
```

The app supports a local demo preview without Supabase. Demo sign-in and role selection are not secure and must not be used for public access. With Supabase configured, sign-in uses Supabase Auth and reads the role from trusted `app_metadata.role`. Assign teacher role through a trusted admin process, not from the public client.

## Current scope

Includes starter implementations of Dashboard, DET sample practice, SAT sample practice, vocabulary Game Zone, Learning Library, Gemini-powered Study Coach, community posting, and teacher DMS metadata/task tracking.

This is a starter copy, not yet feature-equivalent to every interactive feature of the production React app. The DMS stores metadata and file links; file upload and full RLS policies need to be configured before production use.

## Deployment

This Python app requires a Streamlit-compatible host. It is not a Python deployment for the existing Vercel React project. The existing app at https://isomo-det-prep.vercel.app/ remains unchanged.
