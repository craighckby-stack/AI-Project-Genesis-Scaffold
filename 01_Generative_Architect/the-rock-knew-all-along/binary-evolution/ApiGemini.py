!pip install -q google-generativeai pdfplumber python-docx fpdf2
!apt-get install -qq poppler-utils

import os, subprocess, time
import google.generativeai as genai
from docx import Document
from fpdf import FPDF

# ── CONFIG ───────────────────────────────────────────────────
# Free API key from: aistudio.google.com
API_KEY = "YOUR_GEMINI_API_KEY_HERE"
MODEL   = "gemini-2.0-flash"  # free tier, fast, generous limits

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel(MODEL)

print("Craig's Science Machine: ONLINE\n")

# ── READ FILES ───────────────────────────────────────────────
def read_file(filepath, filename):
    ext = filename.lower()
    if ext.endswith(".pdf"):
        result = subprocess.run(
            ["pdftotext", "-layout", filepath, "-"],
            capture_output=True, timeout=120
        )
        return result.stdout.decode("utf-8", errors="ignore").strip()
    elif ext.endswith((".docx", ".doc")):
        doc = Document(filepath)
        return "\n".join(p.text for p in doc.paragraphs).strip()
    else:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            return f.read().strip()

# ── CALL GEMINI WITH RETRIES ─────────────────────────────────
def ask_gemini(content, retries=3):
    for attempt in range(retries):
        try:
            resp = model.generate_content(content)
            return resp.text
        except Exception as e:
            err = str(e)[:120]
            if "quota" in err.lower() or "429" in err:
                print(f"\n  rate limited, waiting 30s...")
                time.sleep(30)
            elif attempt < retries - 1:
                print(f"\n  retry {attempt+1}: {err}")
                time.sleep(5)
            else:
                raise
    return ""

# ── SUMMARISE EACH FILE ──────────────────────────────────────
def summarise(filename, text):
    MAX    = 6000  # Gemini free tier handles much larger contexts
    chunks = [text[i:i+MAX] for i in range(0, len(text), MAX)]
    chunks = chunks[:10]
    summary = ""

    for i, chunk in enumerate(chunks):
        chunk = chunk.encode("utf-8", "ignore").decode("utf-8")
        if len(chunk.strip()) < 50:
            continue
        prompt = (
            f"Summarise this document fragment scientifically but faintly unhinged. "
            f"150 words max. Be honest about what's in it even if it's a guy named Craig "
            f"shutting down the internet or a drill press time machine.\n\n"
            f"File: {filename} (part {i+1}/{len(chunks)})\n---\n{chunk}"
        )
        summary += ask_gemini(prompt) + "\n\n"
        time.sleep(1)  # free tier rate limit is ~15 req/min

    return summary.strip()

# ── MAIN LOOP ────────────────────────────────────────────────
content_dir = "/content/"
valid_ext   = (".pdf", ".docx", ".doc", ".txt", ".md", ".json", ".py")
files       = [f for f in os.listdir(content_dir)
               if f.lower().endswith(valid_ext) and not f.startswith(".")]

print(f"Found {len(files)} files.\n")

summaries = []
for fname in files:
    fpath = os.path.join(content_dir, fname)
    print(f"Reading: {fname}...", end=" ", flush=True)
    try:
        text = read_file(fpath, fname)
        if len(text) < 100:
            print("too short, skipped.")
            continue
        summary = summarise(fname, text)
        if summary:
            summaries.append(f"SOURCE: {fname}\n{summary}\n{'='*60}")
            print("done.")
        else:
            print("empty summary, skipped.")
    except Exception as e:
        print(f"failed: {str(e)[:100]}")

# ── SYNTHESISE ───────────────────────────────────────────────
if not summaries:
    print("No documents processed. Check your API key and files.")
    raise SystemExit

print(f"\nSynthesising {len(summaries)} sources into one cursed paper...")

context = "\n\n".join(summaries)

synthesis_prompt = (
    "You are a Nobel Prize winner who has been awake for 72 hours "
    "and has just been handed documents including a novel about Craig Huckerby "
    "shutting down the internet, a physics paper about bubble dynamics called "
    "The Female, a time travel device made from a drill press, a philosophical "
    "treatise on whether rocks are self-aware, and several hundred chapters of "
    "absurdist comedy fiction.\n\n"
    "Write a bold interdisciplinary paper unifying these documents. "
    "Treat every gap between them as the most important discovery of the 21st century. "
    "The paper must be real science. The paper must also make sense of the drill press.\n\n"
    "Required sections:\n"
    "1. Title (academic and slightly threatening)\n"
    "2. Abstract (200-300 words)\n"
    "3. Introduction\n"
    "4. Unified Framework (name it something good)\n"
    "5. Methodology (the drill press fits in here)\n"
    "6. Discussion and Implications\n"
    "7. References\n\n"
    f"Source summaries:\n{context}"
)

generated = ask_gemini(synthesis_prompt)
print("\nSynthesis complete. Generating PDF...")

# ── PDF ──────────────────────────────────────────────────────
class CraigPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, "Craig Huckerby Institute for Advanced Gibberish", 0, 1, "R")
        self.ln(3)
    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Page {self.page_no()} | does a rock know this is page {self.page_no()}?", 0, 0, "C")

pdf = CraigPDF()
pdf.add_page()
pdf.set_auto_page_break(auto=True, margin=20)

clean = generated.encode("latin-1", "replace").decode("latin-1")

for line in clean.split("\n"):
    s = line.strip()
    if s.startswith("#") or (s and s[0].isupper() and len(s) < 90 and not s.endswith(".")):
        pdf.set_font("Helvetica", "B", 13)
        pdf.set_text_color(40, 40, 40)
        pdf.multi_cell(0, 9, s.lstrip("#* "))
        pdf.ln(3)
    else:
        pdf.set_font("Helvetica", size=11)
        pdf.set_text_color(60, 60, 60)
        pdf.multi_cell(0, 6.5, line)
    pdf.ln(1.5)

out = "Craig_Unified_Theory_of_Everything.pdf"
pdf.output(out)

from google.colab import files
files.download(out)
print(f"\nDownloaded: {out}")
print("the rock knew all along.")
