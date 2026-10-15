# FlowUp Supabase migration (experimental)

- Runtime: React/Vite + existing Express server (port 3001) + Supabase REST. No Oracle connection required for the new Node visitor/store endpoints.
- Original FlowUpApi (.NET/Oracle) is **retained as legacy source** because it also contains Gemini commercial-analysis code. Do not run it for visitor data. Dockerfile/start.sh are legacy and unused by this setup.
- Fill `server/.env` from `server/.env.example` with Supabase URL and a **server-only** secret key. NEVER put the secret key into VITE_ variables or commit it.
- Set `.env` `VITE_VISITOR_API_URL=http://localhost:3001` (or public deployed API URL).
- `npm install`, `npm run server`, then another terminal `npm run dev`.
- Requires Supabase `public.flowup_visitor_logs` columns `log_id,store_id,device_id,event_type,in_count,out_count,current_people,log_time`.
- Store CRUD assumes `public.flowup_stores` columns `store_id` (generated identity), `store_name,address,latitude,longitude,device_id,user_id`; verify against actual schema before using.
- Current React login is not secure server authentication. Express store write routes use a privileged key; **DO NOT publicly deploy** without proper server-side authentication/authorization and per-store access control.
- For local tests, verify GET `/api/people`, `/api/people/history`, `/api/people/hourly`, `/api/stores`.
- Hourly visitor stats use counter differences per store/device and group UTC hours; client displays local hours. For large datasets, move aggregation to a secured Supabase RPC and implement pagination/caching.
- Existing map/localStorage flows remain intact. Store registration uses API but existing map selection still uses localStorage; DB synchronization is a separate integration task.
- The existing Gemini commercial analysis is still in legacy C# code; migrate separately if needed.
