# Craig's Interdimensional Science Synthesizer

Reads books. Makes science. Nobody asked for this.

## What it does

Drops all your documents into Claude, summarises each one, then synthesises them into a single unhinged academic paper and downloads it as a PDF.

## Setup

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Open `synthesizer.py` in Google Colab
3. Paste your API key on line 6
4. Upload your books to `/content/`
5. Run it

## Requirements

```
anthropic
pdfplumber
python-docx
fpdf2
poppler-utils (apt)
2x joints (recommended)
1x iced coffee (Craig-approved)
```

## Included

- `synthesizer.py` — the machine
- `666__A_Hilarious_History_of_Humanity_s_Beginnings_fin.PDF` — the book that started all this

## Notes

- The 666 PDF will not hang anymore. That was a PyPDF2 problem. It's gone.
- The footer of every output PDF asks "does a rock know this is page N?"
- This is non-negotiable.

---

*Craig Huckerby Institute for Advanced Gibberish*
