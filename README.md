# Title: Bytes

Bytes is a mobile-first kitchen companion that stores every recipe at a single serving, so you can
pick how many people you're feeding and watch the ingredient amounts scale themselves. It's for
anyone who has tried to do fraction arithmetic with flour on their hands.

## Live Links

| Resource | URL |
|---|---|
| Mobile app (EAS Expo link) | <https://expo.dev/accounts/dominicgodfrey/projects/bytes/builds/600dd720-abf1-4bc2-9212-11e48051f283> |
| Backend API (deployed) | <https://final-project-dominicgodfrey.onrender.com> |
| Web frontend (deployed) | <https://byte-final.vercel.app> |
| Demo video (Google Drive) | <https://drive.google.com/file/d/1ef4KGxqMKu2GLBsc5bKP_ANpoDG8aWt4/view?usp=sharing> |

> The demo video sharing is set to **"Anyone with the link can view."**
> To open the mobile app, tap the EAS link on an Android phone and install the `.apk`
> (you'll need to allow installs from your browser). No Expo Go needed; it's a standalone build.
>
> **Demo account:** `demo@bytes.app` / `demopass123`
>
> The backend is on Render's free tier, which sleeps after 15 minutes idle. The first request
> after a nap can take up to a minute. The app pings `/api/health` on launch to wake it early,
> so give it a moment on the login screen if it's been quiet.

## Tech Stack

- **Mobile frontend:** React Native + Expo (SDK 54), Expo Router, TypeScript
- **Web frontend:** React 19 + Vite, React Router
- **Backend:** Node.js + Express 5 (ES modules)
- **Database:** MongoDB Atlas + Mongoose
- **Authentication:** JWT + `expo-secure-store` on mobile, `localStorage` on web
- **Device and persistence feature:** `expo-camera` cook photos uploaded via Cloudinary, and
  AsyncStorage offline caching for the recipe library, the unit table, and in-progress drafts
- **Hosting/publishing:** EAS (mobile `.apk`), Render (backend), Vercel (web)

## Features

- **Recipes that scale.** Every recipe is stored normalized to one serving. A stepper on the detail
  screen re-renders every ingredient amount live, formatted as kitchen fractions (`⅓ cup`, `1½ tsp`)
  rather than raw decimals. Scaling runs on-device, so it works with no signal.
- **Full CRUD from mobile.** Create, browse, search, edit and delete recipes, all backed by the API
  and database, with ownership enforced server-side.
- **Authentication.** Register, log in and log out. The JWT lives in the device keystore via
  `expo-secure-store`, screens are gated with `Stack.Protected`, and every write route is protected
  on the server.
- **Cook photos.** Cook mode keeps the screen awake, shows the scaled amounts step by step, and ends
  with a camera capture that's saved to the recipe along with the serving count you actually cooked.
- **Unit conversion.** Convert between volume, weight and count units. The table is served by the
  API and cached on-device, so the converter works offline too.
- **Offline library.** The recipe list is cached in AsyncStorage. Lose connection and the app shows
  your saved recipes with an offline banner instead of an empty screen. Half-finished recipes are
  autosaved as drafts and restored if the app is killed.
- **Web client.** A public browse page shows shared recipes with no login required, plus a login
  flow, a private library, and a create-recipe form with the same validation and scaling rules.

## Getting Started (Local Setup)

### Prerequisites

- Node.js 18+ (developed on 24)
- A MongoDB connection string (Atlas free tier)
- A Cloudinary account for photo uploads (free tier); everything but photos works without it
- Expo Go on your phone, or an Android emulator

### Installation & Run

```bash
# Backend
cd backend
npm install
cp .env.example .env    # then fill in MONGO_URI and JWT_SECRET
npm run dev
```

```bash
# Mobile app (in a separate terminal)
cd frontend/react-native
npm install
npx expo start
```

```bash
# Web frontend (in a separate terminal)
cd frontend/react-web
npm install
npm run dev
```

**Seeding demo data.** With `MONGO_URI` set, `cd backend && npm run seed` creates the demo account
and a few recipes so the library isn't empty on first run.

**Which URL the mobile app expects.** With no `EXPO_PUBLIC_API_URL` set, the app falls back to
`http://10.0.2.2:3000` on Android (the emulator's alias for your machine) and
`http://localhost:3000` elsewhere. **A physical phone can reach neither**; `localhost` is the
phone itself. Put your computer's LAN IP in `frontend/react-native/.env` and make sure both devices
are on the same Wi-Fi:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.42:3000
```

**CORS.** The backend only accepts browser origins listed in `CLIENT_URL`. If Vite starts on a
different port than 5173 (it will if 5173 is taken), add that origin or the web app's requests will
be blocked. Native mobile requests send no `Origin` header and aren't affected.

## Environment Variables

List of variable **names**. Real values live in `.env` files, which are gitignored.

| Variable | Used by | Description |
|---|---|---|
| `MONGO_URI` | backend | MongoDB connection string |
| `JWT_SECRET` | backend | Secret used to sign auth tokens |
| `CLIENT_URL` | backend | Comma-separated browser origins allowed by CORS |
| `PORT` | backend | Port to listen on (defaults to 3000) |
| `CLOUDINARY_CLOUD_NAME` | backend | Cloudinary account name for photo hosting |
| `CLOUDINARY_API_KEY` | backend | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | backend | Cloudinary API secret |
| `EXPO_PUBLIC_API_URL` | mobile | Base URL of the backend API |
| `VITE_API_URL` | web | Base URL of the backend API |

## API Overview

| Method | Endpoint | Auth? | Description |
|---|---|---|---|
| GET | `/api/health` | No | Liveness check; also wakes a sleeping free-tier dyno |
| POST | `/api/users/register` | No | Create an account, returns token + user |
| POST | `/api/users/login` | No | Log in, returns token + user |
| GET | `/api/users/me` | Yes | Current user's profile |
| GET | `/api/recipes` | Yes | The caller's library; `?q=` search, `?tag=` filter |
| GET | `/api/recipes/public` | No | Public feed that the web landing page renders |
| GET | `/api/recipes/:id` | Optional | One recipe; owner always, others only if public |
| POST | `/api/recipes` | Yes | Create a recipe |
| PATCH | `/api/recipes/:id` | Yes | Update a recipe (owner only) |
| DELETE | `/api/recipes/:id` | Yes | Delete a recipe and its Cloudinary photos (owner only) |
| POST | `/api/recipes/:id/cooks` | Yes | Log a cook session with a photo |
| DELETE | `/api/recipes/:id/cooks/:cookId` | Yes | Remove a cook photo |
| GET | `/api/units` | No | The unit table clients build their pickers from |
| POST | `/api/convert` | No | `{quantity, from, to}` → converted amount |
| POST | `/api/uploads` | Yes | Multipart image → Cloudinary, returns hosted URL |

Protected routes require an `Authorization: Bearer <token>` header. Mutations additionally check
that the recipe's `author` matches the caller; being logged in isn't enough, you have to own it.

### How scaling works

Recipes are stored with quantities **per one serving**, so scaling is a single multiply and needs
no network round trip. Because nobody writes a recipe that serves one, the create form asks *"these
amounts make how many servings?"* and divides before saving. The original number is kept as
`enteredForServings` so the edit form shows the amounts you actually typed.

Cross-dimension conversion (cups of flour → grams) is deliberately **not** supported: it depends on
each ingredient's density, and a generic implementation would produce confidently wrong numbers.
The API returns `400` rather than guessing.

## Project Structure

```
project/
├── frontend/
│   ├── react-native/            # Expo mobile app (primary focus)
│   │   ├── app/                 # Expo Router screens: (auth), (tabs), recipe/
│   │   ├── components/          # RecipeForm, ServingsStepper, UnitPicker, ui
│   │   ├── context/             # Auth (SecureStore), Recipes (AsyncStorage), Units
│   │   └── lib/units.ts         # conversion, scaling, fraction formatting
│   └── react-web/               # React + Vite web client
│       └── src/                 # pages/, components/, context/, lib/units.js
└── backend/                     # Express API
    ├── models/                  # User, Recipe (ingredients + embedded cook photos)
    ├── controllers/             # users, recipes, cooks, convert, uploads
    ├── middleware/              # auth (JWT), validate (allowlist + checks), parseUpload
    ├── lib/units.js             # the unit table, single source of truth
    └── scripts/seed.js          # demo account and starter recipes
```

## Author

Dominic Godfrey - dominicgodfrey@brandeis.edu
