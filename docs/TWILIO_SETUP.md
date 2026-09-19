# Twilio OTP — APAD login

End-user flow: **Register/Login → Ad 1 → Ad 2 → SMS OTP → Enter code → Dashboard**

## Recommended: Programmable Messaging (`twilio_messaging`)

Uses your **approved 10DLC OTP template** (only `{otp}` changes per user). APAD generates the code and verifies it in the database.

### Twilio Console

1. **Paid account** with **US 10DLC campaign** approved.
2. **Messaging Service** (`MG...`) with at least one **US SMS number** assigned.
3. **Messaging → Geo permissions** — enable destinations you send to (US for 10DLC).
4. **Advanced Opt-Out** on the Messaging Service if your template includes `Reply STOP`.

Note: **`PN...` is a phone number SID** (Console reference). The API uses **`TWILIO_MESSAGING_SERVICE_SID`** (`MG...`) and/or **`TWILIO_FROM_NUMBER`** (`+1...`).

### Backend `.env`

```env
SMS_PROVIDER=twilio_messaging
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxx
TWILIO_FROM_NUMBER=+1857xxxxxxx
OTP_TTL_SECONDS=600
OTP_SIMULATION_MODE=false
OTP_SHOW_ON_SCREEN=false
OTP_SMS_TEMPLATE=Quantum Ad Tech, Inc: Your one-time password is {otp}. It expires in 10 minutes. Do not share this code with anyone. Reply STOP to opt out.
```

Restart the API after changing `.env`.

---

## Legacy: Twilio Verify (`twilio` / `twilio_verify`)

Verify sends its **own** SMS wording — not your 10DLC template. Use only if you do not need a fixed body.

```env
SMS_PROVIDER=twilio
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxx
```

Trial accounts usually only send to **verified** destination numbers (max 5). Paid accounts + geo permissions allow any valid E.164.

---

## Phone numbers in APAD

All mobiles are stored in **E.164** (e.g. `+14155552671`, `+919876543210`).

- Register/Login use a **country picker**.
- You do **not** add each user’s mobile in Twilio on a paid account.

## Local test

1. Start API and frontend (`README.md`).
2. Register with a **US mobile** if using US 10DLC sender.
3. Login → complete both ads → SMS OTP → verify.

## Local POC (no Twilio)

```env
SMS_PROVIDER=mock
OTP_SHOW_ON_SCREEN=true
OTP_SIMULATION_MODE=true
```

## Render

See [RENDER_DEPLOYMENT.md](../RENDER_DEPLOYMENT.md) for production env vars.
