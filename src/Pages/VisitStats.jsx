import { useEffect, useMemo, useState } from 'react'
import '../styles/stats.css'
import { normalizeVisitorHistory } from '../visitorData'

const API_URL = (import.meta.env.VITE_VISITOR_API_URL || '')

function StatsIcon({ name }) {
  const paths = {
    visitors: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2" />
        <circle cx="18" cy="9" r="2.2" />
        <path d="M16 14a4.5 4.5 0 0 1 4.5 4.5V20" />
      </>
    ),
    average: <path d="M4 20V12M10 20V7M16 20V4M22 20V10" />,
    peak: (
      <>
        <path d="m3 8 4 3 5-6 5 6 4-3-2 11H5L3 8Z" />
        <path d="M7 16h10" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18M8 14h3M14 14h3M8 17h3" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5M8 11h5M10.5 8.5v5" />
      </>
    ),
    quiet: <path d="M4 19h16M6 16v-4M11 16V6M16 16v-7M21 16v-3" />
  }

  return (
    <svg
      className="flow-stats-icon"
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
      {paths[name]}
    </svg>
  )
}

function normalizeHourlyData(result) {
  if (!Array.isArray(result)) return []

  return result
    .map((item) => {
      const rawHour = item?.hour ?? item?.time ?? item?.date
      const count = Number(item?.inCount ?? item?.count ?? 0)

      let time = rawHour

      if (rawHour) {
        const date = new Date(rawHour)

        if (!Number.isNaN(date.getTime())) {
          time = `${String(date.getHours()).padStart(2, '0')}:00`
        } else if (/^\d{1,2}$/.test(String(rawHour))) {
          time = `${String(rawHour).padStart(2, '0')}:00`
        } else if (/^\d{1,2}:\d{2}/.test(String(rawHour))) {
          time = String(rawHour).slice(0, 5)
        }
      }

      return {
        time: time || '--:--',
        count: Number.isFinite(count) ? count : 0,
        inCount: Number(item?.inCount ?? count) || 0,
        outCount: Number(item?.outCount ?? 0) || 0
      }
    })
    .filter((item) => item.time !== '--:--')
}

function normalizeHistoryData(result) {
  return normalizeVisitorHistory(result)
}

function getDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getPeriodRange(period) {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  if (period === '이번 주') {
    const day = start.getDay()
    const mondayOffset = day === 0 ? 6 : day - 1
    start.setDate(start.getDate() - mondayOffset)
  } else if (period === '이번 달') {
    start.setDate(1)
  }

  const end = new Date(now)

  return { start, end }
}

function VisitStats() {
  const [period, setPeriod] = useState('오늘')
  const [visitorData, setVisitorData] = useState(null)
  const [historyData, setHistoryData] = useState([])
  const [hourlyVisitors, setHourlyVisitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchStats = async () => {
      try {
        setLoading(true)
        setError('')

        const [visitorResponse, hourlyResponse, historyResponse] = await Promise.all([
          fetch(`${API_URL}/api/people`, { signal: AbortSignal.timeout(5000) }),
          fetch(`${API_URL}/api/people/hourly`, { signal: AbortSignal.timeout(5000) }),
          fetch(`${API_URL}/api/people/history`, { signal: AbortSignal.timeout(5000) })
        ])

        if (!visitorResponse.ok) {
          throw new Error(`방문자 API 오류: ${visitorResponse.status}`)
        }

        if (!hourlyResponse.ok) {
          throw new Error(`시간대별 API 오류: ${hourlyResponse.status}`)
        }

        if (!historyResponse.ok) {
          throw new Error(`방문 기록 API 오류: ${historyResponse.status}`)
        }

        const visitorResult = await visitorResponse.json()
        const hourlyResult = await hourlyResponse.json()
        const historyResult = await historyResponse.json()

        if (cancelled) return

        setVisitorData(visitorResult)
        setHourlyVisitors(normalizeHourlyData(hourlyResult))
        setHistoryData(normalizeHistoryData(historyResult))
      } catch (fetchError) {
        console.error('방문 통계 조회 실패:', fetchError)

        if (!cancelled) {
          setError('방문 통계 데이터를 불러오지 못했습니다.')
          setVisitorData(null)
          setHourlyVisitors([])
          setHistoryData([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchStats()

    const timer = setInterval(fetchStats, 5 * 60 * 1000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  const { start: periodStart, end: periodEnd } = useMemo(
    () => getPeriodRange(period),
    [period]
  )

  const periodHistory = useMemo(() => {
    return historyData.filter((item) => item.date >= periodStart && item.date <= periodEnd)
  }, [historyData, periodStart, periodEnd])

  const periodInEvents = useMemo(
    () => periodHistory.filter((item) => item.deltaIn > 0),
    [periodHistory]
  )

  const periodHourlyVisitors = useMemo(() => {
    const grouped = new Map()

    periodInEvents.forEach((item) => {
      const hour = item.date.getHours()
      grouped.set(hour, (grouped.get(hour) || 0) + item.deltaIn)
    })

    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([hour, count]) => ({
        time: `${String(hour).padStart(2, '0')}:00`,
        count
      }))
  }, [periodInEvents])

  // 선택 기간의 방문 이력만 표시합니다. 오늘 기록이 없을 때 과거 날짜 통계를 오늘 통계처럼 보여주지 않습니다.
  const hourlyDataForView = periodHourlyVisitors

  const hourlyMax = Math.max(
    1,
    ...hourlyDataForView.map((item) => item.count)
  )

  const periodStats = useMemo(() => {
    if (!periodInEvents.length) {
      return { total: 0, average: 0, max: null, maxTime: null, busy: null, quiet: null }
    }

    const dates = new Map()
    periodInEvents.forEach((item) => {
      const key = getDateKey(item.date)
      dates.set(key, (dates.get(key) || 0) + item.deltaIn)
    })

    const dailyValues = Array.from(dates.entries()).map(([date, count]) => ({ date, count }))
    const busyDay = dailyValues.reduce((max, item) => (item.count > max.count ? item : max), dailyValues[0])
    const quietDay = dailyValues.reduce((min, item) => (item.count < min.count ? item : min), dailyValues[0])

    const busy = hourlyDataForView.length
      ? hourlyDataForView.reduce((max, item) => (item.count > max.count ? item : max), hourlyDataForView[0])
      : null
    const quiet = hourlyDataForView.length
      ? hourlyDataForView.reduce((min, item) => (item.count < min.count ? item : min), hourlyDataForView[0])
      : null

    return {
      total: periodInEvents.reduce((sum, item) => sum + item.deltaIn, 0),
      average: Math.round(periodInEvents.reduce((sum, item) => sum + item.deltaIn, 0) / dailyValues.length),
      max: period === '오늘' ? busy?.count ?? null : busyDay.count,
      maxTime: period === '오늘' ? busy?.time ?? null : busyDay.date,
      busy,
      quiet,
      busyDay,
      quietDay
    }
  }, [period, periodInEvents, hourlyDataForView])

  const weekdayStats = useMemo(() => {
    const labels = ['일', '월', '화', '수', '목', '금', '토']
    const grouped = new Map()

    periodInEvents.forEach((item) => {
      const weekday = labels[item.date.getDay()]
      const dateKey = getDateKey(item.date)
      if (!grouped.has(weekday)) grouped.set(weekday, new Map())
      const dates = grouped.get(weekday)
      dates.set(dateKey, (dates.get(dateKey) || 0) + item.deltaIn)
    })

    return ['월', '화', '수', '목', '금', '토', '일'].map((label) => {
      const dates = grouped.get(label) || new Map()
      const values = Array.from(dates.values())
      return {
        label,
        name: { 월: '월요일', 화: '화요일', 수: '수요일', 목: '목요일', 금: '금요일', 토: '토요일', 일: '일요일' }[label],
        average: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0,
        days: values.length
      }
    })
  }, [periodInEvents])

  const isToday = period === '오늘'
  const hasData = hourlyDataForView.length > 0

  return (
    <div className="flow-stats-page">
      <div className="flow-stats-inner">
        <header className="flow-stats-header">
          <div>
            <span className="flow-stats-kicker">FLOWUP STATISTICS</span>
            <h1>방문 통계</h1>
            <p>매장 방문 데이터를 기간별로 확인할 수 있습니다.</p>
          </div>

          <div
            className="flow-stats-periods"
            role="group"
            aria-label="통계 기간 선택"
          >
            {['오늘', '이번 주', '이번 달'].map((item) => (
              <button
                type="button"
                key={item}
                className={period === item ? 'active' : ''}
                aria-pressed={period === item}
                onClick={() => setPeriod(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </header>

        {error && (
          <div className="flow-stats-panel" style={{ padding: '24px' }}>
            <strong>{error}</strong>
            <p>현재 센서 API 연결 상태를 확인해주세요.</p>
          </div>
        )}

        <section
          className="flow-stats-summary"
          aria-label={`${period} 방문 통계 요약`}
        >
          <article className="flow-stats-summary-card">
            <div className="flow-stats-summary-icon">
              <StatsIcon name="visitors" />
            </div>
            <div>
              <span>총 방문객</span>
              <strong>
                {loading
                  ? '확인 중'
                  : periodStats.total !== null
                    ? `${periodStats.total}명`
                    : '데이터 없음'}
              </strong>
              <small>
                {isToday ? '오늘 실제 입장 기록' : `${period} 실제 입장 기록`}
              </small>
            </div>
          </article>

          <article className="flow-stats-summary-card">
            <div className="flow-stats-summary-icon">
              <StatsIcon name="average" />
            </div>
            <div>
              <span>평균 방문객</span>
              <strong>
                {loading
                  ? '확인 중'
                  : periodStats.average !== null
                    ? `${periodStats.average}명`
                    : '데이터 없음'}
              </strong>
              <small>{isToday ? '오늘 일평균' : `${period} 일평균`}</small>
            </div>
          </article>

          <article className="flow-stats-summary-card">
            <div className="flow-stats-summary-icon">
              <StatsIcon name="peak" />
            </div>
            <div>
              <span>최대 방문객</span>
              <strong>
                {loading
                  ? '확인 중'
                  : periodStats.max !== null
                    ? `${periodStats.max}명`
                    : '데이터 없음'}
              </strong>
              <small>
                {periodStats.maxTime ? `${periodStats.maxTime} 기준` : '실제 기록 없음'}
              </small>
            </div>
          </article>
        </section>

        <section className="flow-stats-main-grid">
          <article className="flow-stats-panel flow-stats-hourly-panel">
            <div className="flow-stats-panel-heading">
              <div>
                <span className="flow-stats-panel-icon">
                  <StatsIcon name="clock" />
                </span>
                <div>
                  <h2>시간대별 방문객 수</h2>
                  <p>센서 API에서 받은 실제 시간대 데이터를 표시합니다.</p>
                </div>
              </div>
              <span className="flow-stats-heading-tag">
                {period} 실제 API 데이터
              </span>
            </div>

            {hasData ? (
              <div className="flow-stats-chart-scroll">
                <div className="flow-stats-hourly-chart">
                  <div className="flow-stats-hourly-grid" aria-hidden="true">
                    <span /><span /><span /><span /><span />
                  </div>

                  <div className="flow-stats-y-axis" aria-hidden="true">
                    <span>{hourlyMax}</span>
                    <span>{Math.round(hourlyMax * 0.75)}</span>
                    <span>{Math.round(hourlyMax * 0.5)}</span>
                    <span>{Math.round(hourlyMax * 0.25)}</span>
                    <span>0</span>
                  </div>

                  <div className="flow-stats-hourly-bars">
                    {hourlyDataForView.map((item) => {
                      const isPeak = item.count === hourlyMax

                      return (
                        <div
                          className="flow-stats-hourly-item"
                          key={item.time}
                          title={`${item.time}: ${item.count}명`}
                        >
                          <strong>{item.count}</strong>
                          <div className="flow-stats-hourly-track">
                            <div
                              className={`flow-stats-hourly-fill ${isPeak ? 'is-peak' : ''}`}
                              style={{
                                height: `${(item.count / hourlyMax) * 100}%`
                              }}
                            />
                          </div>
                          <small>{item.time}</small>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '70px 24px', textAlign: 'center' }}>
                <strong>{hasData ? '' : '현재 기간의 실제 입장 기록이 없습니다.'}</strong>
                <p>History API의 실제 입장 기록을 기준으로 계산합니다.</p>
              </div>
            )}

            {hasData && (
              <div className="flow-stats-chart-footer">
                <span className="flow-stats-dot" />
                각 막대 위의 숫자는 해당 시간대 실제 입장 수입니다.
              </div>
            )}
          </article>

          <article className="flow-stats-panel flow-stats-analysis-panel">
            <div className="flow-stats-panel-heading">
              <div>
                <span className="flow-stats-panel-icon">
                  <StatsIcon name="search" />
                </span>
                <div>
                  <h2>방문 분석</h2>
                  <p>실제 시간대 데이터에서 자동 계산합니다.</p>
                </div>
              </div>
            </div>

            <div className="flow-stats-analysis-list">
              <div className="flow-stats-analysis-box busy">
                <span className="flow-stats-analysis-icon">
                  <StatsIcon name="peak" />
                </span>
                <div>
                  <span>가장 붐비는 시간</span>
                  <strong>
                    {periodStats.busy ? periodStats.busy.time : '정보 없음'}
                  </strong>
                  <small>
                    {periodStats.busy
                      ? `평균 ${periodStats.busy.count}명`
                      : '실제 데이터가 없습니다.'}
                  </small>
                </div>
              </div>

              <div className="flow-stats-analysis-box quiet">
                <span className="flow-stats-analysis-icon">
                  <StatsIcon name="quiet" />
                </span>
                <div>
                  <span>가장 한산한 시간</span>
                  <strong>
                    {periodStats.quiet ? periodStats.quiet.time : '정보 없음'}
                  </strong>
                  <small>
                    {periodStats.quiet
                      ? `평균 ${periodStats.quiet.count}명`
                      : '실제 데이터가 없습니다.'}
                  </small>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="flow-stats-panel flow-stats-weekly-panel">
          <div className="flow-stats-panel-heading">
            <div>
              <span className="flow-stats-panel-icon">
                <StatsIcon name="calendar" />
              </span>
              <div>
                <h2>요일별 평균 방문객</h2>
                <p>요일별 누적 데이터 API가 연결되면 자동으로 표시됩니다.</p>
              </div>
            </div>
            <span className="flow-stats-heading-tag">API 준비 필요</span>
          </div>

          <div className="flow-stats-weekday-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '12px', padding: '24px' }}>
            {weekdayStats.map((item) => (
              <div className="flow-stats-weekday-item" key={item.label}>
                <span>{item.name}</span>
                <strong>{item.days > 0 ? `${item.average}명` : '데이터 없음'}</strong>
                <small>{item.days > 0 ? `${item.days}일 기준` : '기록 없음'}</small>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default VisitStats
