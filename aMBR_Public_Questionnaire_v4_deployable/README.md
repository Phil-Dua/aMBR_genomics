# aMBR Genomics interview notes

Team tool for recording a customer-discovery interview. The interviewer fills it in. The interviewee does not.

The live form is the Apps Script web app below. The NSF I-CORPS Drive folder keeps the response spreadsheet and the I-Corps materials. It does not contain the form.

## Open the form

Sign in with a `@wisc.edu` Google account, then open:

https://script.google.com/a/macros/wisc.edu/s/AKfycbyGPoxpnnK9zqBtJoUbqLSGVWB8i-a6h6enjga0e-IxUR8Umb-XfarkDGsr71zwBC7l7A/exec

That is the same link on the repository home page. A private window, or a browser that is not signed into a UW–Madison account, cannot open it.

The deployment runs as `yduan47@wisc.edu` and is limited to **Anyone within UW-Madison Google Workspace**. The script writes the sheet. Interviewers do not need spreadsheet edit access.

Do not post the link publicly and do not send it to interviewees.

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
4. Reload the web app. Keep **Execute as: Me** and **Who has access: Anyone within UW-Madison Google Workspace**.
