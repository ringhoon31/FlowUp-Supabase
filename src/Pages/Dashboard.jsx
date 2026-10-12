import { useEffect, useState } from 'react'

import VisitorDbPanel from '../components/VisitorDbPanel'

import {
  dashboardData,
  seoulRealtime as mockSeoulRealtime
} from '../mockData'

import { getSeoulRealtimePopulation } from '../seoulApi'

import '../styles/dashboard.css'
import { normalizeVisitorHistory } from '../visitorData'
import '../styles/visitorDb.css'


// 현재 Login.jsx에서 사용하는 임시 관리자 비밀번호
const TEST_ADMIN_PASSWORD = 'flowup1234'

const iconPaths = {
  visits: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2" />
      <circle cx="18" cy="9" r="2.2" />
      <path d="M16 14a4.5 4.5 0 0 1 4.5 4.5V20" />
    </>
  ),

  chart: (
    <>
      <path d="M4 20V12M10 20V7M16 20V4M22 20V10" />
    </>
  ),

  location: (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),

  ratio: (
    <>
      <path d="M12 3a9 9 0 1 0 9 9h-9V3Z" />
      <path d="M15 3.5A9 9 0 0 1 20.5 9H15V3.5Z" />
    </>
  ),

  sensor: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9" />
      <path d="M4.5 4.5a10.6 10.6 0 0 0 0 15M19.5 4.5a10.6 10.6 0 0 1 0 15" />
    </>
  ),

  busy: (
    <>
      <path d="m3 8 4 3 5-6 5 6 4-3-2 11H5L3 8Z" />
      <path d="M7 16h10" />
    </>
  ),

  quiet: (
    <>
      <path d="M4 19h16M6 16V12M11 16V6M16 16V9M21 16V13" />
    </>
  ),

  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),

  document: (
    <>
      <path d="M6 3h9l4 4v14H6V3Z" />
      <path d="M15 3v5h4M9 12h7M9 16h7" />
    </>
  ),

  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),

  store: (
    <>
      <path d="M3 10h18l-1.5-6h-15L3 10Z" />
      <path d="M5 10v10h14V10M9 20v-7h6v7" />
      <path d="M3 10c0 2 3 3 4.5 1.5C9 13 12 12 12 10c0 2 3 3 4.5 1.5C18 13 21 12 21 10" />
    </>
  ),

  check: (
    <>
      <path d="m5 12 4 4L19 6" />
    </>
  ),

  chevron: (
    <>
      <path d="m6 9 6 6 6-6" />
    </>
  ),

  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5" />
    </>
  )
}

function Icon({ name, className = '' }) {
  return (
    <svg
      className={`flow-dashboard-icon ${className}`}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  )
}

function CardHeading({ icon, children, right }) {
  return (
    <summary className="flow-dashboard-card-heading">
      <span className="flow-dashboard-card-title">
        <span className="flow-dashboard-title-icon">
          <Icon name={icon} />
        </span>

        {children}
      </span>

      <span className="flow-dashboard-heading-right">
        {right}

        <span
          className="flow-dashboard-chevron"
          aria-hidden="true"
        />
      </span>
    </summary>
  )
}

function Dashboard({
  visitorCount,
  setCurrentPage,
  stores,
  selectedStore,
  onSelectStore,
  onDeleteStore
}) {
  const [storePickerOpen, setStorePickerOpen] =
    useState(false)

  const [storeToDelete, setStoreToDelete] =
    useState(null)

  const [deletePassword, setDeletePassword] =
    useState('')

  const [deleteError, setDeleteError] =
    useState('')

  const [seoulRealtime, setSeoulRealtime] =
    useState(mockSeoulRealtime)

  const [seoulApiStatus, setSeoulApiStatus] =
    useState('loading')

  const [seoulApiError, setSeoulApiError] =
    useState('')

  const [cityData, setCityData] =
    useState(null)

  const [cityDataStatus, setCityDataStatus] =
    useState('loading')

  const [currentTime, setCurrentTime] =
    useState(new Date())

  const [visitorApiData, setVisitorApiData] = useState(null)
  const [historyApiData, setHistoryApiData] = useState([])
  const [visitorApiStatus, setVisitorApiStatus] = useState('connecting')

  const [hourlyApiData, setHourlyApiData] = useState([])

  const activeStoreId =
    selectedStore?.id ?? ''

  useEffect(() => {
    if (!storeToDelete) {
      return undefined
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setStoreToDelete(null)
        setDeletePassword('')
        setDeleteError('')
      }
    }

    window.addEventListener(
      'keydown',
      handleEscape
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleEscape
      )
    }
  }, [storeToDelete])

  const handleSelectStore = (storeId) => {
    onSelectStore(storeId)
    setStorePickerOpen(false)
  }

  const openDeleteDialog = (store) => {
    setStoreToDelete(store)
    setDeletePassword('')
    setDeleteError('')
  }

  const closeDeleteDialog = () => {
    setStoreToDelete(null)
    setDeletePassword('')
    setDeleteError('')
  }

  const handleDeleteStore = (event) => {
    event.preventDefault()

    if (!storeToDelete) {
      return
    }

    if (
      deletePassword !==
      TEST_ADMIN_PASSWORD
    ) {
      setDeleteError(
        '관리자 비밀번호가 올바르지 않습니다.'
      )

      return
    }

    onDeleteStore(
      storeToDelete.id
    )

    if (stores.length <= 1) {
      setStorePickerOpen(false)
    }

    closeDeleteDialog()
  }

  const fetchSeoulRealtime = () => {
    setSeoulApiStatus('loading')
    setSeoulApiError('')

    getSeoulRealtimePopulation('강남역')
      .then((data) => {
        const populationData =
          data?.CITYDATA?.LIVE_PPLTN_STTS?.[0]

        if (!populationData) {
          throw new Error(
            '실시간 인구 데이터를 찾을 수 없습니다.'
          )
        }

        setSeoulRealtime({
          areaName: populationData.AREA_NM,

          populationMin: Number(
            String(
              populationData.AREA_PPLTN_MIN
            ).replace(/,/g, '')
          ),

          populationMax: Number(
            String(
              populationData.AREA_PPLTN_MAX
            ).replace(/,/g, '')
          ),

          congestionLevel:
            populationData.AREA_CONGEST_LVL,

          congestionMessage:
            populationData.AREA_CONGEST_MSG,

          updatedAt: populationData.PPLTN_TIME
        })

        setSeoulApiStatus('success')
      })
      .catch((error) => {
        console.error('서울시 API 오류:', error)

        setSeoulApiStatus('error')

        setSeoulApiError(
          '실시간 데이터를 불러오지 못했습니다.'
        )
      })
  }

  const fetchCityData = async () => {
    try {
      setCityDataStatus('loading')

      const response = await fetch(
        'http://localhost:3001/api/seoul-citydata?area=강남역'
      )

      if (!response.ok) {
        throw new Error(
          `서울시 도시데이터 API 오류: ${response.status}`
        )
      }

      const result = await response.json()

      console.log(
        '서울시 통합 도시데이터:',
        result
      )

      const data = result?.CITYDATA

      if (!data) {
        throw new Error(
          'CITYDATA 데이터를 찾을 수 없습니다.'
        )
      }

      setCityData(data)
      setCityDataStatus('success')
    } catch (error) {
      console.error(
        '서울시 도시데이터 조회 실패:',
        error
      )

      setCityDataStatus('error')
    }
  }

  /* 기존 방식: 처음 실행하고 5분마다 다시 조회 */
  useEffect(() => {
    fetchSeoulRealtime()
    fetchCityData()

    const timer = setInterval(() => {
      fetchSeoulRealtime()
      fetchCityData()
    }, 5 * 60 * 1000)

    return () => clearInterval(timer)
  }, [])

  /* 현재 시간 갱신 */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60 * 1000)

    return () => clearInterval(timer)
  }, [])

  /* 실시간 방문자 API */
useEffect(() => {
  const fetchVisitorData = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_VISITOR_API_URL}/api/people`,
        { signal: AbortSignal.timeout(5000) }
      )

      if (!response.ok) {
        throw new Error(`방문자 API 오류: ${response.status}`)
      }

      const result = await response.json()

      console.log('Dashboard 방문자 데이터:', result)

      setVisitorApiData(result)
      setVisitorApiStatus('connected')
    } catch (error) {
      setVisitorApiStatus('disconnected')
      console.warn('Dashboard 방문자 데이터 조회 실패:', error)
    }
  }

  fetchVisitorData()

  const timer = setInterval(() => {
    fetchVisitorData()
  }, 5000)

  return () => clearInterval(timer)
}, [])


  /* 방문 이력 API: 서버가 꺼져 있어도 화면은 유지하고 빈 배열을 사용 */
  useEffect(() => {
    let cancelled = false

    const fetchHistoryData = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_VISITOR_API_URL}/api/people/history`,
          { signal: AbortSignal.timeout(5000) }
        )

        if (!response.ok) {
          throw new Error(`방문 이력 API 오류: ${response.status}`)
        }

        const result = await response.json()
        if (!cancelled) {
          setHistoryApiData(Array.isArray(result) ? result : [])
        }
      } catch (error) {
        if (!cancelled) {
          setHistoryApiData([])
          console.warn('방문 이력 API 연결 안 됨:', error)
        }
      }
    }

    fetchHistoryData()
    const timer = setInterval(fetchHistoryData, 30000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  /* 실제 시간대별 방문자 API */
  useEffect(() => {
    const fetchHourlyData = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_VISITOR_API_URL}/api/people/hourly`,
          { signal: AbortSignal.timeout(5000) }
        )

        if (!response.ok) {
          throw new Error(
            `시간대별 방문자 API 오류: ${response.status}`
          )
        }

        const result = await response.json()

        console.log(
          '시간대별 방문자 데이터:',
          result
        )

        // API 응답은 날짜+시간별 집계이므로, 대시보드에서는 같은 시각을 합쳐
        // 날짜가 다른 13:00 항목 등이 중복으로 나타나지 않게 합니다.
        const groupedByHour = new Map()
        const allDaysWithData = new Set()

        if (Array.isArray(result)) {
          result.forEach((item) => {
            const date = new Date(item?.hour)
            if (Number.isNaN(date.getTime())) return

            const hour = date.getHours()
            const time = `${String(hour).padStart(2, '0')}:00`
            const inCount = Number(item?.inCount) || 0
            const outCount = Number(item?.outCount) || 0
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
            allDaysWithData.add(dateKey)

            if (!groupedByHour.has(hour)) {
              groupedByHour.set(hour, { time, totalIn: 0, totalOut: 0 })
            }

            const group = groupedByHour.get(hour)
            group.totalIn += inCount
            group.totalOut += outCount
          })
        }

        const convertedData = Array.from(groupedByHour.values())
          .sort((a, b) => a.time.localeCompare(b.time))
          .map((item) => ({
            time: item.time,
            // 여러 날짜의 단순 합계가 아닌, 데이터가 있는 날짜 기준 시간당 평균입니다.
            count: allDaysWithData.size ? Math.round(item.totalIn / allDaysWithData.size) : 0,
            inCount: allDaysWithData.size ? Math.round(item.totalIn / allDaysWithData.size) : 0,
            outCount: allDaysWithData.size ? Math.round(item.totalOut / allDaysWithData.size) : 0
          }))

        setHourlyApiData(convertedData)
      } catch (error) {
        console.error(
          '시간대별 방문자 데이터 조회 실패:',
          error
        )

        setHourlyApiData([])
      }
    }

    fetchHourlyData()

    const timer = setInterval(() => {
      fetchHourlyData()
    }, 5 * 60 * 1000)

    return () => clearInterval(timer)
  }, [])

  /* 현재 혼잡도 */
  const cityCongestion =
    cityData?.AREA_CONGEST_LVL || '정보 없음'

  const cityCongestionMessage =
    cityData?.AREA_CONGEST_MSG ||
    '현재 혼잡도 정보를 확인할 수 없습니다.'

  /* 날씨 */
  let weatherData = cityData?.WEATHER_STTS

  if (Array.isArray(weatherData)) {
    weatherData = weatherData[0]
  }

  const weatherStatus =
    weatherData?.SKY_STTS ||
    weatherData?.skyStts ||
    '정보 없음'

  const weatherTemperature =
    weatherData?.TEMP ??
    weatherData?.temp ??
    '-'

  const weatherMaxTemperature =
    weatherData?.MAX_TEMP ??
    weatherData?.maxTemp ??
    '-'

  const weatherMinTemperature =
    weatherData?.MIN_TEMP ??
    weatherData?.minTemp ??
    '-'

  const precipitation =
    weatherData?.PRECIPITATION ||
    weatherData?.precipitation ||
    '없음'

  const precipitationType =
    weatherData?.PRECPT_TYPE ||
    weatherData?.precptType ||
    '없음'

  const rainChance =
    weatherData?.RAIN_CHANCE ??
    weatherData?.rainChance ??
    '-'

  let weatherIcon = '☀️'

  if (
    weatherStatus.includes('비') ||
    precipitationType.includes('비')
  ) {
    weatherIcon = '🌧️'
  } else if (
    weatherStatus.includes('눈') ||
    precipitationType.includes('눈')
  ) {
    weatherIcon = '❄️'
  } else if (
    weatherStatus.includes('흐림') ||
    weatherStatus.includes('흐린')
  ) {
    weatherIcon = '☁️'
  } else if (
    weatherStatus.includes('구름')
  ) {
    weatherIcon = '⛅'
  }

  /* 실제 FlowUp DB 데이터 */
  const hourlyData = hourlyApiData
  const parsedHistory = normalizeVisitorHistory(historyApiData)

  // 오늘 날짜의 방문 기록만 집계합니다. API 연결이 끊기면 빈 배열이므로 0명으로 표시됩니다.
  const nowForDateKey = new Date()
  const todayDateKey = `${nowForDateKey.getFullYear()}-${String(nowForDateKey.getMonth() + 1).padStart(2, '0')}-${String(nowForDateKey.getDate()).padStart(2, '0')}`
  const todayHistory = parsedHistory.filter((item) => {
    if (!(item.date instanceof Date) || Number.isNaN(item.date.getTime())) {
      return false
    }

    const itemDateKey = [
      item.date.getFullYear(),
      String(item.date.getMonth() + 1).padStart(2, '0'),
      String(item.date.getDate()).padStart(2, '0')
    ].join('-')

    return itemDateKey === todayDateKey
  })

  const calculatedBusyTime =
    hourlyData.length > 0
      ? hourlyData.reduce(
          (max, item) =>
            item.count > max.count
              ? item
              : max,
          hourlyData[0]
        )
      : null

  const calculatedQuietTime =
    hourlyData.length > 0
      ? hourlyData.reduce(
          (min, item) =>
            item.count < min.count
              ? item
              : min,
          hourlyData[0]
        )
      : null

  const busyTime = calculatedBusyTime
    ? {
        time: calculatedBusyTime.time,
        average: calculatedBusyTime.count
      }
    : {
        time: '정보 없음',
        average: 0
      }

  const quietTime = calculatedQuietTime
    ? {
        time: calculatedQuietTime.time,
        average: calculatedQuietTime.count
      }
    : {
        time: '정보 없음',
        average: 0
      }

  const totalInCount = parsedHistory.reduce((sum, item) => sum + item.deltaIn, 0)
  const totalOutCount = parsedHistory.reduce((sum, item) => sum + item.deltaOut, 0)
  const totalEventCount = totalInCount + totalOutCount

  const entryRatio = totalEventCount > 0
    ? Math.round((totalInCount / totalEventCount) * 100)
    : 0

  const exitRatio = totalEventCount > 0
    ? 100 - entryRatio
    : 0

  const weekdayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dailyVisitorMap = new Map()

  parsedHistory.forEach((item) => {
    const dateKey = [
      item.date.getFullYear(),
      String(item.date.getMonth() + 1).padStart(2, '0'),
      String(item.date.getDate()).padStart(2, '0')
    ].join('-')

    if (!dailyVisitorMap.has(dateKey)) {
      dailyVisitorMap.set(dateKey, { weekday: item.date.getDay(), count: 0 })
    }

    dailyVisitorMap.get(dateKey).count += item.deltaIn
  })

  const weekdayTotals = Array(7).fill(0)
  const weekdayDays = Array(7).fill(0)

  dailyVisitorMap.forEach((dayData) => {
    weekdayTotals[dayData.weekday] += dayData.count
    weekdayDays[dayData.weekday] += 1
  })

  const weeklyData = weekdayNames.map((day, index) => ({
    day,
    count: weekdayDays[index] > 0
      ? Math.round(weekdayTotals[index] / weekdayDays[index])
      : 0
  }))

  const maxHourlyCount = Math.max(
    1,
    ...hourlyData.map((item) => item.count)
  )

  const maxVisitor = Math.max(
    0,
    ...hourlyData.map((item) => item.count)
  )

  const peakData = hourlyData.find(
    (item) => item.count === maxVisitor
  )

  const maxWeeklyCount = Math.max(
    80,
    ...weeklyData.map((item) => item.count)
  )

  /* 현재 날짜 / 시간 */
  const year = currentTime.getFullYear()
  const month = currentTime.getMonth() + 1
  const day = currentTime.getDate()

  const weekdays = [
    '일',
    '월',
    '화',
    '수',
    '목',
    '금',
    '토'
  ]

  const weekday =
    weekdays[currentTime.getDay()]

  let hours = currentTime.getHours()

  const minutes = String(
    currentTime.getMinutes()
  ).padStart(2, '0')

  const period =
    hours >= 12 ? '오후' : '오전'

  hours %= 12

  if (hours === 0) {
    hours = 12
  }

  const formattedTime =
    `${period} ${String(hours).padStart(2, '0')}:${minutes}`

  return (
    <div className="flow-dashboard">
      <div className="flow-dashboard-inner">
        {/* 페이지 제목 / 날짜 */}
        <header className="flow-dashboard-heading">
          <div>
            <span className="flow-dashboard-kicker">
              FLOWUP DASHBOARD
            </span>

            <h1>대시보드</h1>

            <p>
              안녕하세요! 오늘도 좋은 하루 되세요.
            </p>
          </div>

          <div className="flow-dashboard-clock">
            <span>
              {year}년 {month}월 {day}일
              {' '}
              ({weekday})
            </span>

            <strong>{formattedTime}</strong>
          </div>
        </header>

        <div
          className={`flow-api-status-banner ${
            visitorApiStatus === 'connected'
              ? 'is-connected'
              : visitorApiStatus === 'connecting'
                ? 'is-connecting'
                : 'is-disconnected'
          }`}
          role="status"
          aria-live="polite"
        >
          <span className="flow-api-status-dot" />
          {visitorApiStatus === 'connected'
            ? '센서 API 연결됨 · 실시간 데이터 수신 중'
            : visitorApiStatus === 'connecting'
              ? '센서 API 연결 중...'
              : '신호 안 잡힘 · 센서/API 연결을 확인하세요. 화면은 계속 표시됩니다.'}
        </div>

        {/* 현재 매장 */}
        <section
          className="flow-dashboard-store-section"
          aria-label="현재 매장"
        >
          <div className="flow-dashboard-current-store">
            <span className="flow-dashboard-current-store-icon">
              <Icon name="store" />
            </span>

            <div className="flow-dashboard-current-store-info">
              <span className="flow-dashboard-store-label">
                현재 매장
              </span>

              <strong>
                {selectedStore
                  ? selectedStore.name
                  : '등록된 매장이 없습니다'}
              </strong>

              <p>
                {selectedStore
                  ? selectedStore.address ||
                    '등록된 주소가 없습니다.'
                  : '매장을 등록하면 이곳에서 선택할 수 있습니다.'}
              </p>
            </div>

            <div className="flow-dashboard-store-actions">
              {stores.length > 0 && (
                <button
                  type="button"
                  className="flow-dashboard-select-store-button"
                  onClick={() =>
                    setStorePickerOpen(
                      (open) => !open
                    )
                  }
                  aria-expanded={storePickerOpen}
                  aria-controls="flow-dashboard-store-list"
                >
                  매장 선택
                  <Icon name="chevron" />
                </button>
              )}

              <button
                type="button"
                className="flow-dashboard-add-store-button"
                onClick={() =>
                  setCurrentPage('store')
                }
              >
                매장 등록
                <span aria-hidden="true">
                  →
                </span>
              </button>
            </div>
          </div>

          {storePickerOpen && stores.length > 0 && (
            <div
              id="flow-dashboard-store-list"
              className="flow-dashboard-store-picker"
            >
              <div className="flow-dashboard-store-picker-heading">
                <div>
                  <strong>등록된 매장</strong>

                  <p>
                    확인할 매장을 선택해 주세요.
                  </p>
                </div>

                <span>
                  {stores.length}개 매장
                </span>
              </div>

              <div className="flow-dashboard-store-grid">
                {stores.map((store) => {
                  const isSelected =
                    store.id === activeStoreId

                  return (
                    <div
                      className={
                        `flow-dashboard-store-choice ${
                          isSelected
                            ? 'is-selected'
                            : ''
                        }`
                      }
                      key={store.id}
                    >
                      <button
                        type="button"
                        className="flow-dashboard-store-choice-select"
                        onClick={() =>
                          handleSelectStore(
                            store.id
                          )
                        }
                        aria-pressed={isSelected}
                      >
                        <span className="flow-dashboard-store-choice-icon">
                          <Icon name="store" />
                        </span>

                        <span className="flow-dashboard-store-choice-copy">
                          <strong>
                            {store.name}
                          </strong>

                          <small>
                            {store.address ||
                              '등록된 주소가 없습니다.'}
                          </small>
                        </span>

                        {isSelected && (
                          <span className="flow-dashboard-store-choice-check">
                            <Icon name="check" />
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        className="flow-dashboard-store-delete"
                        onClick={() =>
                          openDeleteDialog(store)
                        }
                        aria-label={`${store.name} 매장 삭제`}
                      >
                        <Icon name="trash" />
                        삭제
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        <p className="flow-dashboard-data-note">
          방문자 및 시간대별 통계는 센서 API 데이터를 기준으로 하며,
          요일별 통계는 FlowUp DB의 실제 방문 기록을 기준으로 계산합니다.
          서울시 인구·혼잡도·날씨는 강남역 기준입니다.
        </p>

        {/* 방문 현황 */}
        <details
          className="flow-dashboard-card flow-dashboard-visits"
          open
        >
          <CardHeading icon="visits">
            방문 현황
          </CardHeading>

          <div className="flow-dashboard-visit-layout">
            <div className="flow-dashboard-visit-stats">
              <div className="flow-dashboard-main-stat">
                <span className="flow-dashboard-stat-icon">
                  <Icon name="visits" />
                </span>

                <span className="flow-dashboard-stat-label">
                  오늘 총 방문수
                </span>

                <strong>
  {todayHistory.reduce((sum, item) => sum + item.deltaIn, 0)}명
</strong>

                <small>
  입장 {todayHistory.reduce((sum, item) => sum + item.deltaIn, 0)}명
  {' · '}
  퇴장 {todayHistory.reduce((sum, item) => sum + item.deltaOut, 0)}명
  {' · '}
  현재 {visitorApiData?.peopleNow ?? 0}명
</small>
              </div>

              <div className="flow-dashboard-main-stat">
                <span className="flow-dashboard-stat-icon">
                  <Icon name="visits" />
                </span>

                <span className="flow-dashboard-stat-label">
                  현재 혼잡도
                </span>

                <strong className="flow-dashboard-accent">
                  {cityDataStatus === 'loading'
                    ? '불러오는 중'
                    : cityCongestion}
                </strong>

                <small>
                  {cityDataStatus === 'error'
                    ? '혼잡도 정보를 불러오지 못했습니다.'
                    : cityCongestionMessage}
                </small>
              </div>
            </div>

            {/* 시간대별 방문객 수 */}
            <div className="flow-dashboard-hourly">
              <div className="flow-dashboard-section-heading">
                <h2>
                  시간대별 방문객 수
                </h2>

                <button
                  type="button"
                  className="flow-dashboard-view-all"
                  onClick={() =>
                    setCurrentPage('stats')
                  }
                >
                  전체 보기
                  <span aria-hidden="true">
                    →
                  </span>
                </button>
              </div>

              <div className="flow-dashboard-hourly-bars">
                {hourlyData.map((item) => (
                  <div
                    className="flow-dashboard-hourly-bar-item"
                    key={item.time}
                  >
                    <div className="flow-dashboard-hourly-bar-track">
                      <div
                        className={
                          `flow-dashboard-hourly-bar-fill ${
                            peakData?.time ===
                            item.time
                              ? 'is-peak'
                              : ''
                          }`
                        }
                        style={{
                          height: `${
                            (item.count /
                              maxHourlyCount) *
                            100
                          }%`
                        }}
                        title={
                          `${item.time}: ${item.count}명`
                        }
                      />
                    </div>

                    <span>
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>

              <p className="flow-dashboard-graph-note">
                최대 방문객 {maxVisitor}명

                {peakData &&
                  ` · ${peakData.time}`}
              </p>
            </div>

            {/* 붐비는 시간 / 한산한 시간 */}
            <div className="flow-dashboard-time-analysis">
              <div className="flow-dashboard-time-box">
                <span className="flow-dashboard-stat-icon">
                  <Icon name="busy" />
                </span>

                <span>
                  가장 붐비는 시간
                </span>

                <strong>
                  {busyTime.time}
                </strong>

                <small>
                  평균 {busyTime.average}명
                </small>
              </div>

              <div className="flow-dashboard-time-box">
                <span className="flow-dashboard-stat-icon">
                  <Icon name="quiet" />
                </span>

                <span>
                  가장 한산한 시간
                </span>

                <strong>
                  {quietTime.time}
                </strong>

                <small>
                  평균 {quietTime.average}명
                </small>
              </div>
            </div>
          </div>
        </details>

        {/* 주변 현황 */}
        <details
          className="flow-dashboard-card flow-dashboard-nearby"
          open
        >
          <CardHeading
            icon="location"
            right={
              <span className="flow-dashboard-data-status">
                {seoulApiStatus === 'loading' &&
                  '데이터 불러오는 중...'}

                {seoulApiStatus === 'success' &&
                  '서울시 실시간 데이터'}

                {seoulApiStatus === 'error' &&
                  '실시간 데이터 연결 오류'}
              </span>
            }
          >
            주변 현황
          </CardHeading>

          <div className="flow-dashboard-nearby-body">
            {seoulApiStatus === 'error' && (
              <p className="flow-dashboard-error">
                ⚠️ {seoulApiError}
              </p>
            )}

            <div className="flow-dashboard-nearby-grid">
              <div>
                <span className="flow-dashboard-nearby-icon">
                  <Icon name="location" />
                </span>

                <span>
                  현재 위치
                </span>

                <strong>
                  {seoulRealtime.areaName}
                </strong>
              </div>

              <div>
                <span className="flow-dashboard-nearby-icon">
                  <Icon name="visits" />
                </span>

                <span>
                  실시간 인구
                </span>

                <strong>
                  {seoulRealtime.populationMin.toLocaleString()}
                  {' ~ '}
                  {seoulRealtime.populationMax.toLocaleString()}
                  명
                </strong>
              </div>

              <div>
                <span className="flow-dashboard-nearby-icon">
                  <Icon name="visits" />
                </span>

                <span>
                  주변 혼잡도
                </span>

                <strong>
                  {seoulRealtime.congestionLevel}
                </strong>

                <small>
                  {seoulRealtime.congestionMessage}
                </small>
              </div>

              <div>
                <span className="flow-dashboard-nearby-icon">
                  <Icon name="clock" />
                </span>

                <span>
                  마지막 업데이트
                </span>

                <strong>
                  {seoulRealtime.updatedAt}
                </strong>
              </div>
            </div>
          </div>
        </details>

        {/* 요일별 평균 방문객 / 방문객 비율 */}
        <div className="flow-dashboard-two-columns">
          <details
            className="flow-dashboard-card flow-dashboard-weekly"
            open
          >
            <CardHeading icon="chart">
              요일별 평균 방문객 수
            </CardHeading>

            <div className="flow-dashboard-weekly-body">
              <div className="flow-dashboard-bars">
                {weeklyData.map((item) => (
                  <div
                    className="flow-dashboard-bar-item"
                    key={item.day}
                  >
                    <span className="flow-dashboard-bar-count">
                      {item.count}
                    </span>

                    <div className="flow-dashboard-bar-track">
                      <div
                        className="flow-dashboard-bar-fill"
                        style={{
                          height: `${
                            (item.count /
                              maxWeeklyCount) *
                            100
                          }%`
                        }}
                      />
                    </div>

                    <small>
                      {item.day}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          </details>

          <details
            className="flow-dashboard-card flow-dashboard-ratio"
            open
          >
            <CardHeading icon="ratio">
              방문객 비율
            </CardHeading>

            <div className="flow-dashboard-ratio-body">
              <div
                className="flow-dashboard-donut"
                style={{
                  background: `conic-gradient(
                    #68a9ff 0 ${entryRatio}%,
                    #325b95 ${entryRatio}% 100%
                  )`
                }}
                role="img"
                aria-label={
                  `입장 ${entryRatio}%, 퇴장 ${exitRatio}%`
                }
              >
                <div>
                  <strong>
                    {entryRatio}%
                  </strong>

                  <span>
                    입장
                  </span>
                </div>
              </div>

              <div className="flow-dashboard-ratio-legend">
                <div>
                  <span className="flow-dashboard-legend-dot entry" />
                  입장
                  <strong>
                    {entryRatio}%
                  </strong>
                </div>

                <div>
                  <span className="flow-dashboard-legend-dot exit" />
                  퇴장
                  <strong>
                    {exitRatio}%
                  </strong>
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* 센서 상태 / 오늘의 날씨 / 추가 정보 */}
        <details
          className="flow-dashboard-card flow-dashboard-operation"
          open
        >
          <CardHeading icon="settings">
            운영 정보
          </CardHeading>

          <div className="flow-dashboard-operation-grid">
            <div className="flow-dashboard-operation-item">
              <span className="flow-dashboard-operation-icon">
                <Icon name="sensor" />
              </span>

              <div>
                <small>
                  센서 상태
                </small>

                <strong>
                  {dashboardData.sensor.status}
                </strong>

                <p>
                  {dashboardData.sensor.description}
                </p>
              </div>
            </div>

            <div className="flow-dashboard-operation-item">
              <span className="flow-dashboard-operation-icon">
                {weatherIcon}
              </span>

              <div>
                <small>
                  오늘의 날씨
                </small>

                <strong>
                  {cityDataStatus === 'loading'
                    ? '불러오는 중'
                    : `${weatherTemperature}°C`}
                </strong>

                <p>
                  {cityDataStatus === 'error'
                    ? '날씨 정보를 불러오지 못했습니다.'
                    : `${weatherStatus} · 최고 ${weatherMaxTemperature}°C / 최저 ${weatherMinTemperature}°C`}
                </p>
              </div>
            </div>

            <div className="flow-dashboard-operation-item flow-dashboard-extra">
              <span className="flow-dashboard-operation-icon">
                <Icon name="document" />
              </span>

              <div>
                <small>
                  추가 정보
                </small>

                <strong>
                  {weatherStatus}
                </strong>

                <p>
                  현재 {weatherTemperature}°C
                  {' · '}
                  강수확률 {rainChance}%
                </p>

                <p>
                  강수량 {precipitation}
                  {' · '}
                  강수 형태 {precipitationType}
                </p>

                <p>
                  알림:{' '}
                  {dashboardData.extraInfo.notification}
                </p>
              </div>
            </div>
          </div>
        </details>

        {/* 기존 실시간 방문자 데이터 */}
        <details className="flow-dashboard-card flow-dashboard-realtime">
          <CardHeading icon="document">
            실시간 방문자 데이터
          </CardHeading>

          <div className="flow-dashboard-realtime-body">
            <VisitorDbPanel
  selectedStore={selectedStore}
/>
          </div>
        </details>
      </div>

      {/* 매장 삭제 비밀번호 확인 */}
      {storeToDelete && (
        <div
          className="flow-dashboard-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteDialog()
            }
          }}
        >
          <div
            className="flow-dashboard-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="flow-dashboard-delete-title"
          >
            <span className="flow-dashboard-delete-modal-icon">
              <Icon name="trash" />
            </span>

            <h2 id="flow-dashboard-delete-title">
              매장을 삭제할까요?
            </h2>

            <p>
              <strong>{storeToDelete.name}</strong>
              {' '}
              매장의 등록 정보를 삭제합니다.
            </p>

            <form onSubmit={handleDeleteStore}>
              <label htmlFor="flow-dashboard-delete-password">
                관리자 비밀번호
              </label>

              <input
                id="flow-dashboard-delete-password"
                type="password"
                autoComplete="current-password"
                placeholder="비밀번호를 입력해 주세요."
                value={deletePassword}
                onChange={(event) => {
                  setDeletePassword(event.target.value)
                  setDeleteError('')
                }}
                autoFocus
              />

              {deleteError && (
                <span
                  className="flow-dashboard-delete-error"
                  role="alert"
                >
                  {deleteError}
                </span>
              )}

              <div className="flow-dashboard-delete-actions">
                <button
                  type="button"
                  className="flow-dashboard-delete-cancel"
                  onClick={closeDeleteDialog}
                >
                  취소
                </button>

                <button
                  type="submit"
                  className="flow-dashboard-delete-confirm"
                >
                  매장 삭제
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard