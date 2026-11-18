import os
import random
from datetime import date
import streamlit as st

try:
    from supabase import create_client
except ImportError:
    create_client = None

st.set_page_config(page_title="ISOMO Prep Center | Python", page_icon="📘", layout="wide")

def setting(key, default=""):
    try:
        return st.secrets.get(key, os.getenv(key, default))
    except Exception:
        return os.getenv(key, default)

SUPABASE_URL = setting("SUPABASE_URL")
SUPABASE_KEY = setting("SUPABASE_ANON_KEY")
GEMINI_API_KEY = setting("GEMINI_API_KEY")
supabase = None
if SUPABASE_URL and SUPABASE_KEY and create_client:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception:
        supabase = None

st.markdown("""
<style>
.block-container{max-width:1450px;padding-top:1.4rem}
.hero{padding:1.7rem;border-radius:18px;background:linear-gradient(115deg,#102e59,#23669b);color:white}
.hero h1{color:white;margin:0}.hero p{color:#e8f1ff;margin:.4rem 0 0}
div[data-testid="stMetric"]{border:1px solid #e5eaf0;border-radius:14px;padding:12px}
</style>
""", unsafe_allow_html=True)

def save_row(table, payload):
    if not supabase:
        return False
    try:
        supabase.table(table).insert(payload).execute()
        return True
    except Exception as exc:
        st.error(f"Database error: {exc}")
        return False

def read_rows(table, limit=100):
    if not supabase:
        return []
    try:
        return supabase.table(table).select("*").order("created_at", desc=True).limit(limit).execute().data or []
    except Exception:
        return []

if "profile" not in st.session_state:
    st.session_state.profile = None
if "mastered" not in st.session_state:
    st.session_state.mastered = set()
if "activity_count" not in st.session_state:
    st.session_state.activity_count = 0

def sign_in():
    st.markdown('<div class="hero"><h1>ISOMO Prep Center</h1><p>Learn with purpose. Practise with confidence.</p></div>', unsafe_allow_html=True)
    st.subheader("Sign in to your learning space")
    if not supabase:
        st.info("Supabase is not configured. You can preview the application in local demo mode.")
        with st.form("demo_login"):
            email = st.text_input("Email")
            role = st.selectbox("Preview as", ["student", "teacher"])
            go = st.form_submit_button("Enter demo", type="primary", use_container_width=True)
        if go and email.strip():
            st.session_state.profile = {"email": email.strip(), "role": role, "id": "demo"}
            st.rerun()
        st.caption("Demo role selection is not secure authentication. Configure Supabase before public use.")
    else:
        with st.form("auth_login"):
            email = st.text_input("Email")
            password = st.text_input("Password", type="password")
            go = st.form_submit_button("Sign in", type="primary", use_container_width=True)
        if go:
            try:
                result = supabase.auth.sign_in_with_password({"email": email, "password": password})
                u = result.user
                meta = getattr(u, "app_metadata", {}) or {}
                st.session_state.profile = {"email": u.email, "id": u.id, "role": meta.get("role", "student")}
                st.rerun()
            except Exception as exc:
                st.error(f"Sign-in failed: {exc}")

if not st.session_state.profile:
    sign_in()
    st.stop()

profile = st.session_state.profile
with st.sidebar:
    st.markdown("## 📘 ISOMO")
    st.caption(profile["email"])
    st.caption(f"Access: {profile['role'].title()}")
    page = st.radio("Navigation", [
        "Dashboard", "DET Practice", "SAT World", "Game Zone",
        "Learning Library", "AI Study Coach", "Groups & Community", "Teacher DMS"
    ])
    if st.button("Sign out", use_container_width=True):
        if supabase:
            try:
                supabase.auth.sign_out()
            except Exception:
                pass
        st.session_state.profile = None
        st.rerun()

def record_activity(label, score=None, detail=""):
    st.session_state.activity_count += 1
    if profile["id"] != "demo":
        save_row("python_activity", {
            "user_id": profile["id"], "activity": label, "score": score, "detail": detail
        })

if page == "Dashboard":
    st.markdown('<div class="hero"><h1>Welcome to ISOMO Prep Center</h1><p>Your space for English proficiency, academic skills and purposeful practice.</p></div>', unsafe_allow_html=True)
    a,b,c = st.columns(3)
    a.metric("Activities this session", st.session_state.activity_count)
    b.metric("Vocabulary mastered", len(st.session_state.mastered))
    c.metric("Learning status", "In progress")
    st.subheader("Learning spaces")
    cols = st.columns(2)
    spaces = [
        ("DET Practice", "Practise reading, writing, listening and speaking skills."),
        ("SAT World", "Build academic reading, writing and mathematics skills."),
        ("Game Zone", "Learn through vocabulary and reasoning games."),
        ("Learning Library", "Review vocabulary and useful learning notes."),
        ("AI Study Coach", "Ask for explanations and study guidance."),
        ("Groups & Community", "Share questions and learning updates.")
    ]
    for i,(name,desc) in enumerate(spaces):
        with cols[i%2]:
            with st.container(border=True):
                st.markdown(f"**{name}**")
                st.write(desc)
    st.caption("Python copy — separate from the existing React application.")

elif page == "DET Practice":
    st.title("DET Practice")
    st.write("Original sample questions for practice; these are not official DET test items.")
    questions = [
        ("Choose the grammatically correct sentence.", ["She go to class daily.", "She goes to class daily.", "She going to class daily."], 1, "Use goes with the third-person singular subject."),
        ("The word 'concise' most nearly means:", ["Brief and clear", "Angry and loud", "Uncertain"], 0, "Concise means expressing something clearly in few words."),
        ("Complete the sentence: If I had studied, I ___ passed.", ["will have", "would have", "would"], 1, "This is a third conditional structure.")
    ]
    with st.form("det_quiz"):
        answers = []
        for i,(question,options,correct,why) in enumerate(questions):
            st.markdown(f"**{i+1}. {question}**")
            answers.append(st.radio("Answer", options, key=f"detq{i}", label_visibility="collapsed"))
        submit = st.form_submit_button("Submit practice", type="primary")
    if submit:
        score = sum(answers[i] == q[1][q[2]] for i,q in enumerate(questions))
        st.metric("Result", f"{score}/{len(questions)}")
        for i,q in enumerate(questions):
            if answers[i] == q[1][q[2]]:
                st.success(f"Question {i+1}: Correct")
            else:
                st.error(f"Question {i+1}: {q[3]}")
        record_activity("DET sample practice", score, "Three sample questions")

elif page == "SAT World":
    st.title("SAT World")
    reading, math = st.tabs(["Reading & Writing", "Math"])
    with reading:
        st.write("The committee postponed the meeting. Which word is closest in meaning to postponed?")
        choice = st.radio("Choose one", ["Delayed", "Celebrated", "Prepared", "Forgotten"], key="satread")
        if st.button("Check reading answer"):
            if choice == "Delayed":
                st.success("Correct. Postponed means delayed until a later time.")
                record_activity("SAT Reading and Writing", 1)
            else:
                st.error("Try again.")
    with math:
        st.write("Solve: 3x + 5 = 20")
        value = st.number_input("Enter x", value=0, step=1)
        if st.button("Check math answer"):
            if value == 5:
                st.success("Correct. 3x = 15, so x = 5.")
                record_activity("SAT Math", 1)
            else:
                st.error("Not quite. Subtract 5, then divide by 3.")

elif page == "Game Zone":
    st.title("Game Zone")
    items = [
        ("METICULOUS", "Showing great attention to detail"),
        ("RESILIENT", "Able to recover after difficulty"),
        ("ABUNDANT", "Existing in large quantities"),
        ("AMBIGUOUS", "Having more than one possible meaning")
    ]
    if "game_n" not in st.session_state:
        st.session_state.game_n = 0
    word,meaning = items[st.session_state.game_n % len(items)]
    distractors = [x[1] for x in items if x[0] != word]
    options = [meaning] + distractors
    random.Random(st.session_state.game_n).shuffle(options)
    st.subheader(f"What does {word} mean?")
    answer = st.radio("Select the meaning", options, key=f"game{st.session_state.game_n}")
    if st.button("Submit answer", type="primary"):
        if answer == meaning:
            st.success("Excellent! Correct answer.")
            st.session_state.mastered.add(word)
            record_activity("Vocabulary game", 1, word)
            st.session_state.game_n += 1
            st.rerun()
        else:
            st.error("Not yet. Try another answer.")
    st.caption(f"Mastered in this session: {len(st.session_state.mastered)}")

elif page == "Learning Library":
    st.title("Learning Library")
    entries = [
        ("Abundant","Adjective","Existing in large quantities.","The region has abundant rainfall."),
        ("Concise","Adjective","Giving information clearly in few words.","Write a concise summary."),
        ("Diligent","Adjective","Showing care and effort in your work.","A diligent learner practises consistently."),
        ("Inevitable","Adjective","Certain to happen; unavoidable.","Some changes are inevitable."),
        ("Resilient","Adjective","Able to recover after difficulty.","Resilient learners learn from mistakes."),
        ("Substantial","Adjective","Large in amount, value or importance.","The project made substantial progress.")
    ]
    query = st.text_input("Search words")
    for word,kind,definition,example in entries:
        if query.lower() in (word+definition+example).lower():
            with st.expander(f"{word} · {kind}"):
                st.write(definition)
                st.caption("Example: "+example)
                if st.button("Mark as mastered", key="word_"+word):
                    st.session_state.mastered.add(word.upper())
                    st.success("Added to your mastered words.")

elif page == "AI Study Coach":
    st.title("AI Study Coach")
    prompt = st.text_area("Ask a learning question", placeholder="Explain how to identify the main idea in an academic passage.")
    if st.button("Ask the coach", type="primary", disabled=not prompt.strip()):
        if not GEMINI_API_KEY:
            st.info("Add GEMINI_API_KEY to Streamlit secrets to enable the AI response.")
        else:
            try:
                import requests
                url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
                response = requests.post(url, params={"key": GEMINI_API_KEY},
                    json={"contents":[{"parts":[{"text":"You are the ISOMO Prep Center study coach. Explain clearly and support learning. Do not claim to be an official test provider.\n\n"+prompt}]}]}, timeout=45)
                response.raise_for_status()
                st.markdown(response.json()["candidates"][0]["content"]["parts"][0]["text"])
                record_activity("AI Study Coach", None, "Study question submitted")
            except Exception as exc:
                st.error(f"AI request failed: {exc}")

elif page == "Groups & Community":
    st.title("Groups & Community")
    with st.form("community"):
        topic = st.text_input("Discussion topic")
        message = st.text_area("Message")
        submit = st.form_submit_button("Publish")
    if submit:
        if topic.strip() and message.strip():
            saved = save_row("python_community_posts", {
                "user_id": profile["id"], "topic": topic.strip(), "message": message.strip()
            }) if profile["id"] != "demo" else False
            st.success("Post saved." if saved else "Demo post captured for this session only; configure Supabase for shared posts.")
            if profile["id"] == "demo":
                st.session_state.setdefault("demo_posts", []).insert(0, {"topic":topic,"message":message,"author":profile["email"]})
        else:
            st.error("Enter a topic and message.")
    st.subheader("Recent discussions")
    posts = st.session_state.get("demo_posts", []) + read_rows("python_community_posts", 30)
    if not posts:
        st.info("No discussions have been posted yet.")
    for post in posts:
        with st.container(border=True):
            st.markdown("**"+post.get("topic","Community discussion")+"**")
            st.write(post.get("message",""))
            st.caption(post.get("author", post.get("user_id","Community member")))

elif page == "Teacher DMS":
    st.title("Teacher Document Management System")
    if profile.get("role") != "teacher":
        st.error("This workspace is restricted to teacher accounts.")
        st.stop()
    st.warning("For production, enforce teacher permissions in Supabase RLS as well as in this interface.")
    tab_docs, tab_tasks = st.tabs(["Document Register", "Task Tracker"])
    with tab_docs:
        with st.form("doc_form"):
            title = st.text_input("Document title")
            dtype = st.selectbox("Document type", ["Policy","Teaching resource","Assessment","Administrative","Other"])
            owner = st.text_input("Owner / department")
            version = st.text_input("Version", "1.0")
            status = st.selectbox("Status", ["Draft","Under review","Approved","Archived"])
            confidentiality = st.selectbox("Confidentiality", ["Internal","Confidential","Public"])
            link = st.text_input("Secure file link")
            review = st.date_input("Next review date", date.today())
            notes = st.text_area("Notes")
            submit = st.form_submit_button("Add document", type="primary")
        if submit:
            if not title.strip():
                st.error("Document title is required.")
            else:
                payload = {"title":title,"document_type":dtype,"owner_department":owner,"version":version,
                    "status":status,"confidentiality":confidentiality,"file_url":link,
                    "review_date":review.isoformat(),"notes":notes,"created_by":profile["id"]}
                if profile["id"] == "demo":
                    st.session_state.setdefault("demo_docs", []).append(payload)
                    st.success("Document added to this demo session.")
                elif save_row("python_documents", payload):
                    st.success("Document saved.")
        docs = st.session_state.get("demo_docs", []) + read_rows("python_documents", 200)
        st.subheader("Document register")
        if docs:
            st.dataframe(docs, use_container_width=True, hide_index=True)
        else:
            st.info("No documents registered yet.")
    with tab_tasks:
        with st.form("task_form"):
            task = st.text_input("Task / action")
            assignee = st.text_input("Assigned to")
            due = st.date_input("Due date", date.today(), key="taskdue")
            priority = st.selectbox("Priority", ["Low","Medium","High"])
            progress = st.selectbox("Progress", ["Not started","In progress","Completed"])
            submit_task = st.form_submit_button("Add task", type="primary")
        if submit_task:
            if task.strip():
                payload = {"task":task,"assignee":assignee,"due_date":due.isoformat(),
                    "priority":priority,"progress":progress,"created_by":profile["id"]}
                if profile["id"] == "demo":
                    st.session_state.setdefault("demo_tasks", []).append(payload)
                    st.success("Task added to this demo session.")
                elif save_row("python_document_tasks", payload):
                    st.success("Task saved.")
            else:
                st.error("Enter a task.")
        tasks = st.session_state.get("demo_tasks", []) + read_rows("python_document_tasks", 200)
        if tasks:
            st.dataframe(tasks, use_container_width=True, hide_index=True)
        else:
            st.info("No tasks have been added.")

st.divider()
st.caption("ISOMO Prep Center · Independent Python copy · Existing Vercel application remains untouched.")
