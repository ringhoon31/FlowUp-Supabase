import { useEffect, useState } from 'react'

import VisitorDbPanel from '../components/VisitorDbPanel'


import '../styles/dashboard.css'
import { normalizeVisitorHistory } from '../visitorData'
import '../styles/visitorDb.css'


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
    useState(null)

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

  const [historyApiData, setHistoryApiData] = useState([])
  const [visitorApiStatus, setVisitorApiStatus] = useState('connecting')


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

  const handleDeleteStore = async (event) => {
    event.preventDefault()
    if (!storeToDelete) return
    if (!deletePassword.trim()) {
      setDeleteError('관리자 비밀번호를 입력해 주세요.')
      return
    }
    try {
      await onDeleteStore(storeToDelete.id, deletePassword)
      if (stores.length <= 1) setStorePickerOpen(false)
      closeDeleteDialog()
    } catch (error) {
      setDeleteError(error.message || '매장을 삭제하지 못했습니다.')
    }
  }

  const fetchCityData = async () => {
    try {
      setCityDataStatus('loading')
      setSeoulApiStatus('loading')
      setSeoulApiError('')

     const response = await fetch(
  '/api/seoul-citydata?area=' + encodeURIComponent('강남역')
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

      const populationData = data?.LIVE_PPLTN_STTS?.[0]
      if (!populationData) {
        setSeoulRealtime(null)
        setSeoulApiStatus('error')
        setSeoulApiError('강남역 실시간 인구 데이터가 없습니다.')
      } else {
        setSeoulRealtime({
          areaName: populationData.AREA_NM || '강남역',
          populationMin: Number(String(populationData.AREA_PPLTN_MIN || 0).replace(/,/g, '')),
          populationMax: Number(String(populationData.AREA_PPLTN_MAX || 0).replace(/,/g, '')),
          congestionLevel: populationData.AREA_CONGEST_LVL || '정보 없음',
          congestionMessage: populationData.AREA_CONGEST_MSG || '',
          updatedAt: populationData.PPLTN_TIME || '정보 없음'
        })
        setSeoulApiStatus('success')
      }
    } catch (error) {
      console.error(
        '서울시 도시데이터 조회 실패:',
        error
      )

      setCityDataStatus('error')
      setSeoulRealtime(null)
      setSeoulApiStatus('error')
      setSeoulApiError('실시간 데이터를 불러오지 못했습니다.')
    }
  }

  /* 기존 방식: 처음 실행하고 5분마다 다시 조회 */
  useEffect(() => {
    fetchCityData()

    const timer = setInterval(() => {
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

  // 상단 통계도 하단 VisitorDbPanel과 동일한 Supabase 방문 기록을 사용합니다.
  // 선택한 매장이 바뀌면 화면에서 데이터를 즉시 다시 필터링합니다.
  useEffect(() => {
    let cancelled = false

    const fetchHistoryData = async () => {
      try {
        const response = await fetch(
          `${(import.meta.env.VITE_VISITOR_API_URL || '').replace(/\/$/, '')}/api/people/history`,
          { signal: AbortSignal.timeout(10000), cache: 'no-store' }
        )
        if (!response.ok) {
          throw new Error(`방문 이력 API 오류: ${response.status}`)
        }
        const result = await response.json()
        if (!Array.isArray(result)) {
          throw new Error('방문 이력 API 응답이 배열이 아닙니다.')
        }
        if (!cancelled) {
          setHistoryApiData(result)
          setVisitorApiStatus('connected')
        }
      } catch (error) {
        if (!cancelled) {
          setVisitorApiStatus('disconnected')
          setHistoryApiData([])
          console.warn('Dashboard 방문 기록 조회 실패:', error)
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

  /* 주변 현황과 동일한 서울시 실시간 인구 혼잡도 사용 (강남역 기준) */
  const cityCongestion =
    seoulRealtime?.congestionLevel || '정보 없음'

  const cityCongestionMessage =
    seoulRealtime?.congestionMessage ||
    '현재 혼잡도 정보를 확인할 수 없습니다.'

  /* 매장별 통계: 하단 패널과 동일한 device_id 우선 규칙 */
  const parsedHistory = normalizeVisitorHistory(historyApiData)
  const selectedDeviceId = String(selectedStore?.deviceId || '').trim()
  const selectedStoreId = selectedStore?.id == null ? '' : String(selectedStore.id)
  const storeHistory = parsedHistory.filter((row) => {
    if (!selectedStoreId && !selectedDeviceId) return false
    // 센서 ID가 지정된 매장은 그 센서에서 발생한 기록만 사용합니다.
    if (selectedDeviceId) return String(row.deviceId || '').trim() === selectedDeviceId
    const rowStoreId = row.storeId ?? row.store_id
    return rowStoreId != null && String(rowStoreId) === selectedStoreId
  })

  // 서버 응답은 날짜/시간순으로 정렬된 상태이며, normalizeVisitorHistory도 정렬합니다.
  const latestStoreRecord = storeHistory.length
    ? storeHistory[storeHistory.length - 1]
    : null

  // 오늘의 출입 기록만 집계합니다. 날짜는 사용자의 현지 날짜를 따릅니다.
  const todayHistory = storeHistory.filter((row) =>
    row.date instanceof Date &&
    !Number.isNaN(row.date.getTime()) &&
    row.date.getFullYear() === currentTime.getFullYear() &&
    row.date.getMonth() === currentTime.getMonth() &&
    row.date.getDate() === currentTime.getDate()
  )

  // 기존 /api/people/hourly는 모든 매장이 합쳐진 값입니다.
  // 그래서 오늘 선택 매장의 실제 증가분으로 시간대별 그래프를 계산합니다.
  const hourlyBuckets = new Map()
  todayHistory.forEach((row) => {
    const hour = row.date.getHours()
    const bucket = hourlyBuckets.get(hour) || { time: `${String(hour).padStart(2, '0')}:00`, count: 0 }
    bucket.count += row.deltaIn
    hourlyBuckets.set(hour, bucket)
  })
  const hourlyData = [...hourlyBuckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, value]) => value)

  // 출입 기록의 시각은 센서 heartbeat가 아니므로 전원/통신 상태로 단정하지 않습니다.
  const validSensorLastSeen = latestStoreRecord?.date ?? null
  const sensorEventAgeMs = validSensorLastSeen
    ? currentTime.getTime() - validSensorLastSeen.getTime()
    : null
  const hasRecentSensorEvent =
    visitorApiStatus === 'connected' &&
    sensorEventAgeMs !== null &&
    sensorEventAgeMs >= -60 * 1000 &&
    sensorEventAgeMs <= 10 * 60 * 1000

  const sensorStatusText =
    visitorApiStatus === 'connecting'
      ? '조회 중'
      : visitorApiStatus === 'disconnected'
        ? '조회 실패'
        : !selectedStore
          ? '매장 선택 필요'
          : !validSensorLastSeen
            ? '수신 기록 없음'
            : hasRecentSensorEvent
              ? '최근 출입 기록 있음'
              : '최근 출입 기록 없음'

  const sensorLastSeenText = validSensorLastSeen
    ? validSensorLastSeen.toLocaleString('ko-KR')
    : '기록 없음'

  const lastSensorEvent = latestStoreRecord?.eventType || ''
  const lastSensorEventText =
    lastSensorEvent === 'IN'
      ? '입장'
      : lastSensorEvent === 'OUT'
        ? '퇴장'
        : lastSensorEvent && lastSensorEvent !== 'NONE'
          ? lastSensorEvent
          : '정보 없음'

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

  const totalInCount = storeHistory.reduce((sum, item) => sum + item.deltaIn, 0)
  const totalOutCount = storeHistory.reduce((sum, item) => sum + item.deltaOut, 0)
  const totalEventCount = totalInCount + totalOutCount

  const entryRatio = totalEventCount > 0
    ? Math.round((totalInCount / totalEventCount) * 100)
    : 0

  const exitRatio = totalEventCount > 0
    ? 100 - entryRatio
    : 0

  const weekdayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dailyVisitorMap = new Map()

  storeHistory.forEach((item) => {
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
            ? '방문 기록 API 연결됨 · 선택 매장 데이터 조회 가능'
            : visitorApiStatus === 'connecting'
              ? '방문 기록 API 연결 중...'
              : '방문 기록 API 조회 실패 · 저장된 데이터를 확인할 수 없습니다.'}
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
          방문자 수는 선택한 매장 기준이며, 서울시 인구·혼잡도는 강남역 기준입니다.
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
  {visitorApiStatus === 'connected' ? `${todayHistory.reduce((sum, item) => sum + item.deltaIn, 0)}명` : '—'}
</strong>

                <small>
  입장 {visitorApiStatus === 'connected' ? `${todayHistory.reduce((sum, item) => sum + item.deltaIn, 0)}명` : '—'}
  {' · '}
  퇴장 {visitorApiStatus === 'connected' ? `${todayHistory.reduce((sum, item) => sum + item.deltaOut, 0)}명` : '—'}
  {' · '}
  마지막 기록 {visitorApiStatus === 'connected' ? (latestStoreRecord ? `${latestStoreRecord.peopleNow}명` : '없음') : '—'}
</small>
              </div>

              <div className="flow-dashboard-main-stat">
                <span className="flow-dashboard-stat-icon">
                  <Icon name="visits" />
                </span>

                <span className="flow-dashboard-stat-label">
                  주변 혼잡도 (강남역)
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
                  입장 {busyTime.average}명
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
                  입장 {quietTime.average}명
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

{seoulRealtime && (
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
            )}
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

        {/* 실제 방문자 API 및 DB 기록을 기준으로 한 운영 정보 */}
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
                <small>센서 기록 상태</small>
                <strong>{sensorStatusText}</strong>
                <p>마지막 출입 기록: {sensorLastSeenText}</p>
                <p>최근 10분간 출입 기록 여부를 기준으로 표시합니다.</p>
              </div>
            </div>

            <div className="flow-dashboard-operation-item">
              <span className="flow-dashboard-operation-icon">
                <Icon name="check" />
              </span>
              <div>
                <small>방문자 API 상태</small>
                <strong>
                  {visitorApiStatus === 'connected'
                    ? '연결됨'
                    : visitorApiStatus === 'connecting'
                      ? '연결 중'
                      : '연결 실패'}
                </strong>
                <p>선택 매장 방문 기록의 Supabase 조회 상태입니다.</p>
              </div>
            </div>

            <div className="flow-dashboard-operation-item">
              <span className="flow-dashboard-operation-icon">
                <Icon name="document" />
              </span>
              <div>
                <small>마지막 기록 정보</small>
                <strong>
                  {visitorApiStatus === 'connected'
                    ? lastSensorEventText
                    : '정보 없음'}
                </strong>
                <p>
                  장치 ID: {visitorApiStatus === 'connected'
                    ? latestStoreRecord?.deviceId || '정보 없음'
                    : '정보 없음'}
                </p>
                <p>출입 이벤트만으로 센서 전원·통신 상태를 확정할 수는 없습니다.</p>
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