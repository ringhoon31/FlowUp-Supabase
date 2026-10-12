const API_KEY = import.meta.env.VITE_SEOUL_API_KEY

const API_BASE_URL = 'http://openapi.seoul.go.kr:8088'

export async function getSeoulRealtimePopulation(areaName = '강남역') {
  if (!API_KEY) {
    throw new Error('서울시 API 인증키가 없습니다.')
  }

  const url =
    `${API_BASE_URL}/${API_KEY}/json/citydata/1/5/` +
    encodeURIComponent(areaName)

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`서울시 API 요청 실패: ${response.status}`)
  }

  const result = await response.json()

  return result
}