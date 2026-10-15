import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config({
  path: './server/.env'
})

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())


// ==========================================
// 네이버 지역 검색 API
// ==========================================

app.get('/api/local-search', async (req, res) => {
  try {
    const query = req.query.query

    if (!query) {
      return res.status(400).json({
        message: '검색어를 입력해주세요.'
      })
    }

    const clientId =
      process.env.NAVER_LOCAL_CLIENT_ID

    const clientSecret =
      process.env.NAVER_LOCAL_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        message: 'NAVER API 인증 정보가 없습니다.'
      })
    }

    const url =
      'https://naverapihub.apigw.ntruss.com/search/v1/local' +
      `?query=${encodeURIComponent(query)}` +
      '&display=30'

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-NCP-APIGW-API-KEY-ID': clientId,
        'X-NCP-APIGW-API-KEY': clientSecret
      }
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('NAVER API 오류:', data)

      return res.status(response.status).json(data)
    }

    res.json(data)

  } catch (error) {
    console.error('서버 오류:', error)

    res.status(500).json({
      message: '매장 검색 중 오류가 발생했습니다.'
    })
  }
})


// ==========================================
// 서울시 실시간 도시데이터 API
// ==========================================

app.get('/api/seoul-citydata', async (req, res) => {
  try {
    const area = req.query.area || '강남역'

    // 서울시 API 인증키
    // 둘 중 하나가 있으면 사용하도록 처리
    const serviceKey =
      process.env.SEOUL_CITYDATA_KEY ||
      process.env.SEOUL_API_KEY

    if (!serviceKey) {
      return res.status(500).json({
        message: '서울시 API 인증키가 없습니다.'
      })
    }

    const url =
      'http://openapi.seoul.go.kr:8088/' +
      `${serviceKey}/json/citydata/1/5/` +
      encodeURIComponent(area)

    console.log(
      `서울시 도시데이터 요청: ${area}`
    )

    const response = await fetch(url)

    const data = await response.json()

    if (!response.ok) {
      console.error(
        '서울시 API 오류:',
        data
      )

      return res.status(response.status).json(data)
    }

    res.json(data)

  } catch (error) {
    console.error(
      '서울시 도시데이터 조회 실패:',
      error
    )

    res.status(500).json({
      message:
        '서울시 도시데이터를 불러오지 못했습니다.'
    })
  }
})




// Supabase REST API (server-only key; never expose to Vite/client)
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function supabase(table, query = '', options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase server credentials missing')
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...(options.body ? { 'Content-Type': 'application/json', Prefer: 'return=representation' } : {}),
      ...(options.headers || {})
    }
  })
  const body = await response.text()
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${body.slice(0, 250)}`)
  return body ? JSON.parse(body) : []
}

function reportError(res, error) {
  console.error('[Supabase API]', error.message)
  res.status(502).json({ message: 'Supabase 조회 또는 저장에 실패했습니다. 서버 로그와 테이블 구조를 확인해주세요.' })
}

const visitorFields = 'log_id,store_id,device_id,event_type,in_count,out_count,current_people,log_time'
const asVisitor = (r) => ({
  logId: r.log_id, storeId: r.store_id, deviceId: r.device_id,
  eventType: r.event_type, inCount: r.in_count ?? 0,
  outCount: r.out_count ?? 0, peopleNow: r.current_people ?? 0,
  createdAt: r.log_time
})

app.get('/api/people', async (req, res) => {
  try {
    const rows = await supabase('flowup_visitor_logs', `?select=${visitorFields}&order=log_time.desc,log_id.desc&limit=1`)
    res.json(rows.length ? { ...asVisitor(rows[0]), lastEvent: rows[0].event_type } : {
      inCount: 0, outCount: 0, peopleNow: 0, lastEvent: 'NONE', createdAt: null
    })
  } catch (e) { reportError(res, e) }
})

app.get('/api/people/history', async (req, res) => {
  try {
    // PostgREST commonly limits each response to 1,000 rows; paginate for correct statistics.
    const all = []
    for (let start = 0; start < 100000; start += 1000) {
      const rows = await supabase('flowup_visitor_logs', `?select=${visitorFields}&order=log_time.asc,log_id.asc&offset=${start}&limit=1000`)
      all.push(...rows)
      if (rows.length < 1000) break
    }
    res.json(all.map(asVisitor))
  } catch (e) { reportError(res, e) }
})

app.get('/api/people/hourly', async (req, res) => {
  try {
    const all = []
    for (let start = 0; start < 100000; start += 1000) {
      const rows = await supabase('flowup_visitor_logs', `?select=${visitorFields}&order=log_time.asc,log_id.asc&offset=${start}&limit=1000`)
      all.push(...rows)
      if (rows.length < 1000) break
    }
    const previous = new Map()
    const buckets = new Map()
    for (const row of all) {
      const date = new Date(row.log_time)
      if (Number.isNaN(date.getTime())) continue
      const key = `${row.store_id ?? ''}:${row.device_id ?? ''}`
      const old = previous.get(key)
      const currentIn = Number(row.in_count) || 0
      const currentOut = Number(row.out_count) || 0
      // Counters may reset on reboot; use positive deltas.
      const deltaIn = old ? (currentIn >= old.i ? currentIn - old.i : currentIn) : currentIn
      const deltaOut = old ? (currentOut >= old.o ? currentOut - old.o : currentOut) : currentOut
      previous.set(key, { i: currentIn, o: currentOut })
      const hour = new Date(Math.floor(date.getTime() / 3600000) * 3600000).toISOString()
      const value = buckets.get(hour) || { hour, inCount: 0, outCount: 0 }
      value.inCount += Math.max(0, deltaIn)
      value.outCount += Math.max(0, deltaOut)
      buckets.set(hour, value)
    }
    res.json([...buckets.values()].sort((a, b) => a.hour.localeCompare(b.hour)))
  } catch (e) { reportError(res, e) }
})

// Expected columns in public.flowup_stores:
// store_id (identity PK), store_name, address, latitude, longitude, device_id, user_id.
const storeFields = 'store_id,store_name,address,latitude,longitude,device_id,user_id'
const asStore = (r) => ({ id: String(r.store_id), name: r.store_name, address: r.address,
  latitude: r.latitude, longitude: r.longitude, deviceId: r.device_id || '', userId: r.user_id })
const storePayload = (r) => ({ store_name: String(r.storeName || '').trim(), address: String(r.address || '').trim(),
  latitude: r.latitude, longitude: r.longitude, device_id: r.deviceId || null, user_id: r.userId || null })

app.get('/api/stores', async (req, res) => {
  try { res.json((await supabase('flowup_stores', `?select=${storeFields}&order=store_id.asc`)).map(asStore)) }
  catch (e) { reportError(res, e) }
})
app.post('/api/stores', async (req, res) => {
  try {
    const payload = storePayload(req.body)
    if (!payload.store_name || !payload.address) return res.status(400).json({ message: '매장명과 주소가 필요합니다.' })
    const rows = await supabase('flowup_stores', `?select=${storeFields}`, { method: 'POST', body: JSON.stringify(payload) })
    res.json({ store: asStore(rows[0]) })
  } catch (e) { reportError(res, e) }
})
app.put('/api/stores/:id', async (req, res) => {
  try {
    const rows = await supabase('flowup_stores', `?store_id=eq.${encodeURIComponent(req.params.id)}&select=${storeFields}`, {
      method: 'PATCH', body: JSON.stringify(storePayload(req.body))
    })
    if (!rows.length) return res.status(404).json({ message: '매장을 찾을 수 없습니다.' })
    res.json({ store: asStore(rows[0]) })
  } catch (e) { reportError(res, e) }
})
app.delete('/api/stores/:id', async (req, res) => {
  try {
    // Never silently delete visitor history. Supabase FK policy decides if deletion is allowed.
    await supabase('flowup_stores', `?store_id=eq.${encodeURIComponent(req.params.id)}`, { method: 'DELETE' })
    res.json({ message: '매장 삭제 요청이 완료되었습니다.', storeId: req.params.id })
  } catch (e) { reportError(res, e) }
})

// ==========================================
// 서버 실행
// ==========================================

app.listen(PORT, () => {
  console.log(
    `Flowup server running on http://localhost:${PORT}`
  )
})