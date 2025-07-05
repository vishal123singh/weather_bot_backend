### Google OAuth Admin Authentication

This app uses `passport-google-oauth20` to authenticate admin users via Google.

#### Setup

Add the following environment variables:

<!-- ```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-app.com/api/auth/google/callback
 -->



### POST /api/send-weather

Sends daily weather updates to all subscribed users via Telegram.

**Called by:** 
- cron-job.org
- Admin triggers (manual)

**Response**
- `200 OK`: `{ sent: number, total: number }`
- `500 Error`: `{ error: string }`

**Environment Required**
- `weatherApiKey` must be saved in DB via `/api/settings`



### POST /api/auth/login

**Description**: Logs in an admin using email and password.

**Body**:
```json
{
  "email": "admin@example.com",
  "password": "yourpassword"
}
