# Twilio A2P 10DLC Campaign Registration — APAD

Use this guide when submitting your messaging campaign in the Twilio Console. Values match the current APAD implementation.

## Before you submit

1. Deploy the latest frontend and backend.
2. Set frontend env vars and **rebuild** (`npm run build`):
   ```env
   VITE_PUBLIC_SITE_URL=https://your-frontend-domain.com
   VITE_SUPPORT_EMAIL=support@yourcompany.com
   VITE_APP_NAME=APAD Portal
   ```
3. Replace `support@yourcompany.com` with your real support email before Twilio review.
4. Confirm these URLs load in a browser (no login required):
   - `{VITE_PUBLIC_SITE_URL}/privacy-policy`
   - `{VITE_PUBLIC_SITE_URL}/terms-of-service`
   - `{VITE_PUBLIC_SITE_URL}/register` (must show SMS consent checkbox)

---

## Twilio form fields (copy-paste)

### 1. Campaign Privacy Policy URL

```
https://your-frontend-domain.com/privacy-policy
```

### 2. Campaign Terms of Service URL

```
https://your-frontend-domain.com/terms-of-service
```

### 3. How do end users consent to receive messages?

```
End users consent during account registration on our website. On the registration form at /register, users provide their mobile number and must check an explicit, unchecked SMS consent checkbox before creating an account. The checkbox states that they agree to receive SMS messages from APAD Portal for account verification and service-related communications, that message frequency may vary, that message and data rates may apply, and that they may reply STOP to opt out or HELP for assistance. Links to our Privacy Policy and Terms of Service are displayed next to the checkbox. Consent is recorded in our database with a timestamp (sms_consent, sms_consent_at). Admin-created users follow the same consent checkbox on the admin user creation form.
```

---

## What APAD uses SMS for (current setup)

| Use case | Provider | When sent |
|----------|----------|-----------|
| Account verification OTP | Twilio Verify | After user completes ad flow and requests OTP |
| Login / identity verification | Twilio Verify | Same OTP flow |

Email campaigns use **Amazon SES**, not SMS — do not describe email campaigns in the Twilio SMS campaign form.

Backend config (`.env`):

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=...
TWILIO_OTP_CHANNEL=sms
```

---

## Twilio Console requirements (what you need from Twilio)

### Account setup

| Item | Where in Twilio | Notes |
|------|-----------------|-------|
| Twilio account | [console.twilio.com](https://console.twilio.com) | Upgrade from trial for production |
| Account SID + Auth Token | Console → Account Info | Already in `backend/.env` |
| Verify Service | Console → Verify → Services | `TWILIO_VERIFY_SERVICE_SID` (starts with `VA...`) |
| Verified phone numbers (trial) | Phone Numbers → Verified Caller IDs | Trial can only SMS verified numbers |
| Geo permissions | Messaging → Settings → Geo permissions | Enable India (+91) if sending to Indian numbers |

### A2P 10DLC (US long codes / US messaging)

If you send SMS to **US numbers** using a US 10DLC number, you also need:

| Item | Purpose |
|------|---------|
| **Brand registration** | Register your business (EIN or equivalent) |
| **Campaign registration** | Describe use case; paste Privacy URL, Terms URL, opt-in description above |
| **Messaging Service** | Link your phone number to the approved campaign |
| **Sample messages** | Provide 1–2 example OTP/verification message texts |

### For India (+91) OTP via Twilio Verify

APAD’s primary flow targets Indian mobiles. Twilio Verify handles OTP delivery; requirements differ from US 10DLC:

- Enable **India** in Geo permissions
- Trial: verify destination numbers in Console
- Production: upgrade account; comply with Twilio’s India SMS rules
- DLT (India telecom) may apply for certain sender types — confirm with Twilio support for your use case

### Campaign use case to select

Choose the closest match in Twilio’s campaign form:

- **Account Notifications** or **2FA / OTP** — best fit for verification codes
- **Mixed** — only if you also send promotional SMS (APAD currently does not via SMS)

Suggested sample message for Twilio:

```
Your APAD Portal verification code is: 123456. This code expires in 5 minutes. Reply HELP for help, STOP to opt out.
```

---

## Screenshot checklist for Twilio review

Twilio may manually review your opt-in. Capture screenshots of:

1. `/register` — mobile field + unchecked SMS checkbox + Privacy/Terms links
2. `/privacy-policy` — SMS section visible
3. `/terms-of-service` — SMS program section visible
4. Site footer — Privacy Policy and Terms links

---

## Deploy checklist

| Step | Action |
|------|--------|
| 1 | Set `VITE_PUBLIC_SITE_URL`, `VITE_SUPPORT_EMAIL`, rebuild frontend |
| 2 | Set `CORS_ORIGINS` to your frontend URL on backend |
| 3 | Restart backend (applies `sms_consent` DB migration on startup) |
| 4 | Test registration with SMS checkbox — verify `sms_consent=true` in database |
| 5 | Submit Twilio campaign with URLs and opt-in description above |
| 6 | Replace placeholder support email on legal pages before final review |

---

## Optional future improvements

- Inbound STOP/HELP webhook for Twilio (if you send non-Verify marketing SMS later)
- Separate consent flags for transactional vs promotional SMS
- Custom domain with HTTPS (recommended over raw IP:port for Twilio review)
