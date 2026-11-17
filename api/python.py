"""ISOMO Prep Center Python API for Vercel.

This file is deployed alongside the existing React/Vite application.
It deliberately uses only Python's standard library so no paid service or
additional package is required.
"""
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import json
import os
import re


VOCABULARY = [
    {"word": "abundant", "meaning": "existing in large quantities", "example": "The region has abundant natural resources."},
    {"word": "coherent", "meaning": "logical, clear, and well organised", "example": "Her essay presents a coherent argument."},
    {"word": "resilient", "meaning": "able to recover after difficulty", "example": "Resilient communities adapt to change."},
    {"word": "significant", "meaning": "important or large enough to matter", "example": "The study found a significant improvement."},
    {"word": "evaluate", "meaning": "to judge quality or importance carefully", "example": "Researchers evaluate evidence before drawing conclusions."},
    {"word": "sustainable", "meaning": "able to continue without exhausting resources", "example": "The school introduced sustainable farming practices."},
    {"word": "interpret", "meaning": "to explain the meaning of information", "example": "Readers interpret the author's central claim."},
    {"word": "contribute", "meaning": "to give or add something towards a result", "example": "Daily reading can contribute to stronger vocabulary."},
    {"word": "relevant", "meaning": "closely connected to the subject", "example": "Use relevant examples to support your answer."},
    {"word": "consequently", "meaning": "as a result; therefore", "example": "The sample was small; consequently, the findings were limited."},
]


def send_json(handler, status, payload):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(body)))
    origin = handler.headers.get("Origin", "")
    allowed = {
        item.strip()
        for item in os.getenv(
            "ISOMO_ALLOWED_ORIGINS",
            "https://isomo-det-prep.vercel.app,http://localhost:5173",
        ).split(",")
        if item.strip()
    }
    if origin in allowed:
        handler.send_header("Access-Control-Allow-Origin", origin)
        handler.send_header("Vary", "Origin")
    handler.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type, apikey")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.end_headers()
    handler.wfile.write(body)


def read_json(handler):
    try:
        length = int(handler.headers.get("Content-Length", "0"))
    except ValueError:
        raise ValueError("Invalid request size.")
    if length < 1 or length > 20000:
        raise ValueError("Send a request between 1 byte and 20 KB.")
    raw = handler.rfile.read(length)
    try:
        data = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise ValueError("The request body must be valid JSON.")
    if not isinstance(data, dict):
        raise ValueError("The request body must be a JSON object.")
    return data


def verify_user(access_token):
    supabase_url = (
        os.getenv("SUPABASE_URL")
        or os.getenv("VITE_SUPABASE_URL")
        or ""
    ).rstrip("/")
    anon_key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or ""
    if not supabase_url or not anon_key:
        raise RuntimeError("Supabase server configuration is missing.")
    request = Request(
        supabase_url + "/auth/v1/user",
        headers={
            "apikey": anon_key,
            "Authorization": "Bearer " + access_token,
            "Accept": "application/json",
        },
    )
    try:
        with urlopen(request, timeout=8) as response:
            user = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        if error.code in (400, 401, 403):
            return None
        raise RuntimeError("Supabase could not verify the session.")
    except (URLError, TimeoutError):
        raise RuntimeError("Supabase is temporarily unavailable.")
    return user if isinstance(user, dict) and user.get("id") else None


def make_study_plan(data):
    area = str(data.get("weakestArea", "Reading")).strip().title()
    if area not in {"Reading", "Listening", "Writing", "Speaking", "Vocabulary", "Grammar"}:
        area = "Reading"
    try:
        minutes = int(data.get("dailyMinutes", 45))
        target = int(data.get("targetScore", 120))
    except (TypeError, ValueError):
        raise ValueError("dailyMinutes and targetScore must be numbers.")
    minutes = max(15, min(minutes, 240))
    target = max(10, min(target, 160))
    focus = {
        "Reading": ["Read one short academic passage", "Identify the main idea and two supporting details", "Complete a timed vocabulary-in-context drill"],
        "Listening": ["Listen to a short English clip twice", "Write a precise transcript of 3–5 sentences", "Summarise the speaker's main point aloud"],
        "Writing": ["Write one clear paragraph", "Revise sentence variety and transitions", "Edit grammar, spelling, and supporting examples"],
        "Speaking": ["Speak for 60–90 seconds on one prompt", "Listen to your recording and note pauses", "Repeat with clearer structure and examples"],
        "Vocabulary": ["Learn five useful academic words", "Write an original sentence for each word", "Review yesterday's words using active recall"],
        "Grammar": ["Review one grammar pattern", "Write five original example sentences", "Edit a short paragraph for accuracy"],
    }
    days = []
    for index in range(7):
        days.append({
            "day": index + 1,
            "focus": area if index in (0, 2, 4) else ("Integrated practice" if index == 6 else "Mixed skills"),
            "tasks": focus[area] if index in (0, 2, 4) else [
                "Complete a short timed DET-style task",
                "Review mistakes and write down the correction",
                "Practise one additional skill for balance",
            ],
            "minutes": minutes,
        })
    return {
        "title": "Your 7-day ISOMO study plan",
        "targetScore": target,
        "dailyMinutes": minutes,
        "priorityArea": area,
        "note": "This is a study plan, not a score prediction or an official DET assessment.",
        "days": days,
    }


def analyse_response(data):
    answer = str(data.get("response", "")).strip()
    area = str(data.get("area", "Writing")).strip().title()
    if len(answer) < 10:
        raise ValueError("Write at least 10 characters so the practice can be reviewed.")
    words = re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", answer)
    sentences = [part for part in re.split(r"[.!?]+", answer) if part.strip()]
    transitions = [
        word for word in ("however", "therefore", "moreover", "for example",
                          "consequently", "although", "in addition")
        if word in answer.lower()
    ]
    suggestions = []
    if len(words) < 35:
        suggestions.append("Develop the response with more explanation or a specific example.")
    if len(sentences) < 3:
        suggestions.append("Use several complete sentences to develop your ideas.")
    if not transitions:
        suggestions.append("Try a suitable transition to show how your ideas connect.")
    if not suggestions:
        suggestions.append("Review precision, grammar, and whether every sentence supports your main point.")
    return {
        "area": area,
        "wordCount": len(words),
        "sentenceCount": len(sentences),
        "transitionsFound": transitions,
        "suggestions": suggestions,
        "disclaimer": "This is a basic writing-support checklist, not an official DET score or a complete AI assessment.",
    }


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        send_json(self, 204, {})

    def do_GET(self):
        parsed = urlparse(self.path)
        action = parse_qs(parsed.query).get("action", [""])[0]
        if action == "health":
            return send_json(self, 200, {
                "ok": True,
                "service": "ISOMO Python API",
                "runtime": "Vercel Python serverless function",
                "version": "1.0.0",
            })
        token = self._token()
        if not token:
            return send_json(self, 401, {"error": "Please sign in to ISOMO first."})
        try:
            user = verify_user(token)
            if not user:
                return send_json(self, 401, {"error": "Your session has expired. Please sign in again."})
            if action == "vocabulary":
                return send_json(self, 200, {"items": VOCABULARY, "count": len(VOCABULARY)})
            return send_json(self, 400, {"error": "Unknown action. Try action=vocabulary or action=health."})
        except RuntimeError as error:
            return send_json(self, 503, {"error": str(error)})

    def do_POST(self):
        token = self._token()
        if not token:
            return send_json(self, 401, {"error": "Please sign in to ISOMO first."})
        try:
            user = verify_user(token)
            if not user:
                return send_json(self, 401, {"error": "Your session has expired. Please sign in again."})
            data = read_json(self)
            action = data.get("action")
            if action == "study_plan":
                return send_json(self, 200, make_study_plan(data))
            if action == "analyse_response":
                return send_json(self, 200, analyse_response(data))
            return send_json(self, 400, {"error": "Unknown action. Use study_plan or analyse_response."})
        except ValueError as error:
            return send_json(self, 400, {"error": str(error)})
        except RuntimeError as error:
            return send_json(self, 503, {"error": str(error)})
        except Exception:
            return send_json(self, 500, {"error": "The ISOMO Python service encountered an unexpected error."})

    def _token(self):
        value = self.headers.get("Authorization", "")
        return value[7:].strip() if value.startswith("Bearer ") else ""

    def log_message(self, format, *args):
        # Avoid logging request bodies or bearer tokens.
        return
