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


// ==========================================
// 서버 실행
// ==========================================

app.listen(PORT, () => {
  console.log(
    `Flowup server running on http://localhost:${PORT}`
  )
})