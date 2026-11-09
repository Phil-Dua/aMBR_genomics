# aMBR Genomics interview notes

Team tool for recording a customer-discovery interview. The interviewer fills it in. The interviewee does not.

Anyone with the link can open the form. The response spreadsheet stays private to the team.

## Open the form

https://script.google.com/a/macros/wisc.edu/s/AKfycbyGPoxpnnK9zqBtJoUbqLSGVWB8i-a6h6enjga0e-IxUR8Umb-XfarkDGsr71zwBC7l7A/exec

That is the link on the repository home page. No UW–Madison account is required to open the form.

Do not replace it with `script.google.com/macros/s/...`. If the browser is signed into more than one Google account, Google rewrites that address to `/macros/u/0/` or `/macros/u/1/` and shows “Sorry, unable to open the file at this time.” The `wisc.edu` address above does not get rewritten.

The deployment runs as `yduan47@wisc.edu` with **Who has access: Anyone**. The script writes the sheet. People opening the form do not need spreadsheet edit access, and they cannot open the spreadsheet from the form.

## What you enter

1. **Who did you interview?** Perspective, what they were talking about, and how the interview was arranged. Optional context can stay blank.
2. **Four prompts.** The prompts change with the perspective. Type what they said. At least one answer is required. The fourth prompt can be left blank.
3. Check **These notes are from the interview. I left out names and identifiers.**
4. **Save interview notes.** The page shows a confirmation such as `1B26DE90`. That same interview is one new row on `Responses`.

Each row has the role, context, four answers, then four blank columns so it still lines up with the older eight-answer sheet. The version cell is `6.1-team-interview-record`.

## Files

- `Index.html` — the interview page used by Apps Script.
- `Code.gs` — checks the submission and appends one row to the `Responses` tab.
- `ambr_public_form_preview.html` — older long questionnaire, offline only. It does not save.
- `question_banks.json` — older eight-prompt banks. The live page does not load this file.

Private spreadsheet (team only):

https://docs.google.com/spreadsheets/d/1JG-N2IsdR4kYH-JupwXDsmcJZfwW9qE5hOTcxrb_V0o/edit

## Update the live page

1. Open the Apps Script project `aMBR_interview`.
2. Replace `Code.gs` and the `Index` HTML file with the copies in this folder.
3. Save, then **Deploy → Manage deployments → Edit → New version → Deploy**.
4. Reload the web app. Keep **Execute as: Me** and **Who has access: Anyone**.
