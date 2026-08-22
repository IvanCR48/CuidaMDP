# CuidaMDP

A lightweight civic reporting map for Mar del Plata where residents can log public infrastructure issues and track their resolution.

![React](https://img.shields.io/badge/React-19-blue?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-purple?style=flat-square)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-green?style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## Why it exists

Reporting potholes, broken street lamps, or illegal dumping to municipal channels often feels like sending messages into a void. You rarely know if someone else has already filed the same complaint, and there is almost no public visibility into whether crews are actually working on it.

CuidaMDP takes inspiration from civic platforms like *FixMyStreet*. It gives neighbors an open, visual map to drop a pin on a problem, attach photos, and upvote existing issues to show collective priority. An employee view lets municipal staff change statuses and upload photo proof once work is done.

---

## Quick start

### Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) account

### 1. Install dependencies

```bash
git clone https://github.com/your-username/cuidamdp.git
cd cuidamdp
npm install
```

### 2. Configure the database and storage

1. Go to your Supabase project dashboard and open the **SQL Editor**.
2. Run the queries in [`schema.sql`](./schema.sql). This creates the `reports`, `votes`, and `banned_ips` tables, along with Row Level Security (RLS) policies and rate-limiting triggers.
3. In **Storage**, create a new public bucket named `report-photos`.
4. (Optional) In **Authentication > Users**, create an email/password account if you want to test the staff moderation tools.

### 3. Set environment variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Start the dev server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Key technical decisions

- **No required citizen login**: Forcing account registration kills engagement for simple civic tools. Anyone can drop a pin or vote on an issue immediately.
- **Client-side reverse geocoding**: When you click the map, the app queries OpenStreetMap's Nominatim API to suggest a street name and neighborhood automatically so people do not have to type full addresses on their phones.
- **Spam prevention via Postgres triggers**: Since there is no user login for citizens, the database enforces a limit of 3 reports per 24 hours per IP and client UUID. If an IP gets banned by an admin, the `before_report_inserted` trigger aborts the insert directly in PostgreSQL.
- **Pure CSS dashboard**: Rather than pulling in a heavy charting library like Chart.js or Recharts for a few summary metrics, the statistics tab renders neighborhood bars and status breakdowns using basic CSS flexbox and percentage widths.
- **Realtime updates**: Uses Supabase Realtime subscriptions so new pins and upvotes reflect across active clients without manual refreshing.

---

## How it works

1. **Pinning an issue**: Click anywhere on the Mar del Plata map or use the GPS button. A drawer opens with the coordinates and an auto-detected street address.
2. **Details & photos**: Select a category (streets, lighting, trash, sidewalks, drainage), write a short description, and optionally attach up to 3 photos.
3. **Community upvotes**: Neighbors can click "Apoyar" to boost an issue. An internal database trigger increments the vote count.
4. **Resolution workflow**: Staff members sign in through the header modal. They can set reports to *In Progress* or mark them *Resolved* by uploading a photo of the completed fix. Staff can also delete spam reports or ban repeat offender IPs.

---

## Known limitations and trade-offs

- **Client-side IP detection**: To keep the app completely serverless with direct Supabase calls, client IPs are fetched using `api.ipify.org` before saving. This works fine for honest users, but a determined bad actor could spoof headers or bypass the frontend. Moving insertions behind an Edge Function would harden this.
- **Nominatim rate limits**: Reverse geocoding runs directly from the browser against OSM's public Nominatim instance. If multiple people tap around rapidly, requests may be throttled.
- **No image compression pipeline**: Uploaded photos are stored directly in Supabase Storage. High-resolution photos from modern phones are uploaded as-is, which can consume storage quota faster than resized thumbnails.

---

## License

MIT
