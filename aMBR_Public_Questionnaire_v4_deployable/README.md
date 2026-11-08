# aMBR Genomics public questionnaire — v4 (staging)

## What is included
- `Index.html`: respondent-facing HTML, used as the **Index** HTML file in Apps Script.
- `Code.gs`: server-side Google Apps Script endpoint writing to **aMBR private Google Sheet**.
- `ambr_public_form_preview.html`: same user interface, usable offline, but **cannot submit**.
- `question_banks.json`: 14 role-specific question banks, 8 prompts each (mostly optional); original 10 stakeholder categories are kept distinct where appropriate, and the wider social-media population adds scientists, caregivers, general public, etc.

Public web app (execute as the aMBR account, anyone can open it):

https://script.google.com/macros/s/AKfycbyGPoxpnnK9zqBtJoUbqLSGVWB8i-a6h6enjga0e-IxUR8Umb-XfarkDGsr71zwBC7l7A/exec

## Deployment (authorized aMBR team account)
1. Open https://script.google.com/ and create a new project (e.g. `aMBR — Public Customer Discovery Form`).
2. Replace the content of `Code.gs` with the supplied `Code.gs`.
3. Add an HTML file named **Index** (do not include `.html` when naming the Apps Script HTML file). Paste in the supplied `Index.html`.
4. Verify `RESPONSE_SHEET_ID` matches your *private* response spreadsheet and the tab is exactly `Responses`.
5. Click **Deploy → New deployment → Web app**.
6. Set **Execute as: Me** (aMBR authorized account) and **Who has access: Anyone**. Do not use “execute as user accessing web app”, or respondents would need sign-in and Sheets permissions.
7. Authorize the script's Google Sheets access when prompted. Copy the returned `/exec` Web app URL; that's the shareable public questionnaire. Test in a signed-out/private/incognito browser window.
8. Submit a *fictional* test response and confirm it appears in the private spreadsheet. Verify that a signed-out participant cannot open the response spreadsheet or see prior answers.
9. To update the public app, update the code and redeploy a **new version** via Deploy → Manage deployments → Edit.

## Privacy, operational safeguards, and limitations
- Anyone with the web app URL can *submit*, but cannot *read* the private spreadsheet through this interface.
- Keep the Sheet shared only with authorized team members; avoid enabling “Anyone with link” for the Sheet.
- Neither an IP-based rate limit nor CAPTCHA is included. The honeypot only deters elementary bots; a public launch may attract spam.
- The form intentionally does not ask for names, personal contact details, or identifiable medical histories; survey answers are free text and could still include sensitive details. Review institutional ethics/privacy requirements and establish a retention/deletion policy before posting publicly.
- A public self-service questionnaire (~8–12 minutes) **is not** the 30–60-minute guided customer-discovery interview; use both approaches for complementary evidence and report them separately.
- The role chosen by a participant is self-reported, not verified. Do not treat a claimed clinician qualification as verified.
- All question-answer fields are optional; respondent acknowledges the research-purpose notice.
- This ZIP is not a deployed app. `ambr_public_form_preview.html` never sends data and the private Google Sheet is not connected until deployment.

Private staging Google Sheet (team only):
https://docs.google.com/spreadsheets/d/1JG-N2IsdR4kYH-JupwXDsmcJZfwW9qE5hOTcxrb_V0o/edit
