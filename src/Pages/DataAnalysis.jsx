import { useEffect, useMemo, useState } from 'react'
import '../styles/analysis.css'
import { normalizeVisitorHistory } from '../visitorData'

const API_URL = (import.meta.env.VITE_VISITOR_API_URL || 'http://localhost:3001')

const weekdays = {
  월: '월요일',
  화: '화요일',
  수: '수요일',
  목: '목요일',
  금: '금요일',
  토: '토요일',
  일: '일요일'
}

const iconPaths = {
  trend: (
    <>
      <path d="M3 17 9 11l4 4 8-9" />
      <path d="M16 6h5v5" />
    </>
  ),
  busy: (
    <>
      <path d="m3 8 4 3 5-6 5 6 4-3-2 11H5L3 8Z" />
      <path d="M7 16h10" />
    </>
  ),
  quiet: <path d="M4 19h16M6 16v-4M11 16V6M16 16v-7M21 16v-3" />,
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
  lightbulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M8 15c-1.3-1-2-2.5-2-4a6 6 0 1 1 12 0c0 1.5-.7 3-2 4l-1 2H9l-1-2Z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2" />
      <circle cx="18" cy="9" r="2.2" />
      <path d="M16 14a4.5 4.5 0 0 1 4.5 4.5V20" />
    </>
  ),
  box: (
    <>
      <path d="m3 7 9-4 9 4v11l-9 4-9-4V7Z" />
      <path d="m3 7 9 4 9-4M12 11v11" />
    </>
  ),
  chart: <path d="M4 20V12M10 20V7M16 20V4M22 20V10" />
}

function AnalysisIcon({ name }) {
  return (
    <svg
      className="flow-analysis-icon"
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

function PanelHeading({ icon, title, description }) {
  return (
    <div className="flow-analysis-panel-heading">
      <span className="flow-analysis-panel-icon">
        <AnalysisIcon name={icon} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
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
        count: Number.isFinite(count) ? count : 0
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

function DataAnalysis() {
  const [visitorData, setVisitorData] = useState(null)
  const [hourlyVisitors, setHourlyVisitors] = useState([])
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchAnalysisData = async () => {
      try {
        setLoading(true)
        setError('')

        const [visitorResponse, hourlyResponse, historyResponse] = await Promise.all([
          fetch(`${API_URL}/api/people`),
          fetch(`${API_URL}/api/people/hourly`),
          fetch(`${API_URL}/api/people/history`)
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
        console.error('데이터 분석 조회 실패:', fetchError)

        if (!cancelled) {
          setError('분석 데이터를 불러오지 못했습니다.')
          setVisitorData(null)
          setHourlyVisitors([])
          setHistoryData([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAnalysisData()

    const timer = setInterval(fetchAnalysisData, 5 * 60 * 1000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  const inHistory = useMemo(
    () => historyData.filter((item) => item.deltaIn > 0),
    [historyData]
  )

  const dailyStats = useMemo(() => {
    const grouped = new Map()
    inHistory.forEach((item) => {
      const key = getDateKey(item.date)
      grouped.set(key, (grouped.get(key) || 0) + item.deltaIn)
    })
    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }))
  }, [inHistory])

  // 최근 7일(오늘 포함)의 입장 인원을 7일로 나눠 주간 평균을 계산합니다.
  // 기록이 없는 날짜는 0명으로 계산해 날짜별 데이터 유무에 따라 평균이 왜곡되지 않게 합니다.
  const weeklyAverage = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dailyCountByDate = new Map(dailyStats.map((item) => [item.date, item.count]))
    let weeklyTotal = 0

    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date(today)
      date.setDate(today.getDate() - offset)
      weeklyTotal += dailyCountByDate.get(getDateKey(date)) || 0
    }

    return Math.round(weeklyTotal / 7)
  }, [dailyStats])

  const weekdayStats = useMemo(() => {
    const labels = ['일', '월', '화', '수', '목', '금', '토']
    const grouped = new Map()

    inHistory.forEach((item) => {
      const label = labels[item.date.getDay()]
      const dateKey = getDateKey(item.date)
      if (!grouped.has(label)) grouped.set(label, new Map())
      const dates = grouped.get(label)
      dates.set(dateKey, (dates.get(dateKey) || 0) + item.deltaIn)
    })

    return ['월', '화', '수', '목', '금', '토', '일'].map((label) => {
      const dates = grouped.get(label) || new Map()
      const values = Array.from(dates.values())
      return {
        label,
        name: weekdays[label],
        average: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0,
        days: values.length
      }
    })
  }, [inHistory])

  const analysis = useMemo(() => {
    if (!inHistory.length) {
      return { average: null, busyHour: null, quietHour: null, busyDay: null, quietDay: null, total: 0 }
    }

    const busyDay = dailyStats.reduce((max, item) => (item.count > max.count ? item : max), dailyStats[0])
    const quietDay = dailyStats.reduce((min, item) => (item.count < min.count ? item : min), dailyStats[0])
    const busyHour = hourlyVisitors.length
      ? hourlyVisitors.reduce((max, item) => (item.count > max.count ? item : max), hourlyVisitors[0])
      : null
    const quietHour = hourlyVisitors.length
      ? hourlyVisitors.reduce((min, item) => (item.count < min.count ? item : min), hourlyVisitors[0])
      : null

    return {
      average: weeklyAverage,
      busyHour,
      quietHour,
      busyDay,
      quietDay,
      total: inHistory.reduce((sum, item) => sum + item.deltaIn, 0)
    }
  }, [inHistory, dailyStats, weeklyAverage])

  const hourlyMax = Math.max(
    1,
    ...hourlyVisitors.map((item) => item.count)
  )

  const hasData = hourlyVisitors.length > 0

  const resultItems = useMemo(() => {
    if (!analysis.busyHour || !analysis.quietHour) return []

    const items = [
      {
        icon: '🔥',
        title: `${analysis.busyHour.time} 방문객 집중`,
        description: `${analysis.busyHour.time} 시간대의 입장 수가 현재 데이터에서 가장 높게 나타났습니다.`
      },
      {
        icon: '🌿',
        title: `${analysis.quietHour.time} 비교적 한산`,
        description: `${analysis.quietHour.time} 시간대의 입장 수가 현재 데이터에서 가장 낮게 나타났습니다.`
      }
    ]

    if (visitorData?.peopleNow !== undefined) {
      items.push({
        icon: '👥',
        title: `현재 매장 ${visitorData.peopleNow}명`,
        description: '실시간 방문자 API에서 현재 매장 인원을 가져왔습니다.'
      })
    }

    return items
  }, [analysis, visitorData])

  return (
    <div className="flow-analysis-page">
      <div className="flow-analysis-inner">
        <header className="flow-analysis-header">
          <span className="flow-analysis-kicker">FLOWUP ANALYSIS</span>
          <h1>데이터 분석</h1>
          <p>
            매장 방문 데이터를 분석하여 방문 패턴과 혼잡도를 확인합니다.
          </p>
        </header>

        {error && (
          <div className="flow-analysis-panel" style={{ padding: '24px' }}>
            <strong>{error}</strong>
            <p>현재 센서 API 연결 상태를 확인해주세요.</p>
          </div>
        )}

        <section className="flow-analysis-summary" aria-label="핵심 분석 결과">
          <article className="flow-analysis-summary-card">
            <span className="flow-analysis-summary-icon">
              <AnalysisIcon name="trend" />
            </span>
            <div>
              <span>주간 평균 방문객</span>
              <strong>
                {loading
                  ? '확인 중'
                  : analysis.average !== null
                    ? `${analysis.average}명`
                    : '정보 없음'}
              </strong>
              <small style={{ display: 'block', marginTop: '6px', color: 'var(--flow-muted, #9bb9df)' }}>
                최근 7일 입장 인원 ÷ 7일
              </small>
            </div>
          </article>

          <article className="flow-analysis-summary-card">
            <span className="flow-analysis-summary-icon busy">
              <AnalysisIcon name="busy" />
            </span>
            <div>
              <span>최대 혼잡 시간</span>
              <strong>{analysis.busyHour?.time ?? '정보 없음'}</strong>
            </div>
          </article>

          <article className="flow-analysis-summary-card">
            <span className="flow-analysis-summary-icon quiet">
              <AnalysisIcon name="quiet" />
            </span>
            <div>
              <span>가장 한산한 시간</span>
              <strong>{analysis.quietHour?.time ?? '정보 없음'}</strong>
            </div>
          </article>
        </section>

        <section className="flow-analysis-panel flow-analysis-hourly-panel">
          <PanelHeading
            icon="clock"
            title="시간대별 방문 패턴"
            description="센서 API에서 받은 실제 시간대 입장 데이터를 확인합니다."
          />

          {hasData ? (
            <div className="flow-analysis-chart-scroll">
              <div className="flow-analysis-hourly-chart">
                <div className="flow-analysis-chart-grid" aria-hidden="true">
                  <span /><span /><span /><span /><span />
                </div>

                <div className="flow-analysis-y-axis" aria-hidden="true">
                  <span>{hourlyMax}</span>
                  <span>{Math.round(hourlyMax * 0.75)}</span>
                  <span>{Math.round(hourlyMax * 0.5)}</span>
                  <span>{Math.round(hourlyMax * 0.25)}</span>
                  <span>0</span>
                </div>

                <div className="flow-analysis-hourly-bars">
                  {hourlyVisitors.map((item) => (
                    <div
                      className="flow-analysis-hourly-item"
                      key={item.time}
                      title={`${item.time}: ${item.count}명`}
                    >
                      <strong>{item.count}</strong>
                      <div className="flow-analysis-hourly-track">
                        <div
                          className={`flow-analysis-hourly-fill ${item.count === hourlyMax ? 'highlight' : ''}`}
                          style={{
                            height: `${(item.count / hourlyMax) * 100}%`
                          }}
                        />
                      </div>
                      <small>{item.time}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '70px 24px', textAlign: 'center' }}>
              <strong>시간대별 데이터를 불러오는 중입니다.</strong>
              <p>백엔드에서 제공되는 실제 센서 데이터만 표시합니다.</p>
            </div>
          )}
        </section>

        <section className="flow-analysis-two-columns">
          <article className="flow-analysis-panel">
            <PanelHeading
              icon="calendar"
              title="요일별 방문 패턴"
              description="History API의 날짜를 기준으로 React에서 요일을 계산합니다."
            />

            <div className="flow-analysis-weekday-list" style={{ display: 'grid', gap: '14px', padding: '24px' }}>
              {weekdayStats.map((item) => {
                const weekdayMax = Math.max(0, ...weekdayStats.map((day) => day.average))
                const barWidth = item.average > 0 && weekdayMax > 0
                  ? Math.min(100, Math.max(3, (item.average / weekdayMax) * 100))
                  : 0

                return (
                  <div
                    className="flow-analysis-weekday-row"
                    key={item.label}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px minmax(0, 1fr) 60px',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span>{item.name}</span>
                    <div
                      className="flow-analysis-weekday-track"
                      style={{
                        width: '100%',
                        height: '12px',
                        borderRadius: '999px',
                        overflow: 'hidden',
                        background: 'rgba(110, 152, 211, 0.18)'
                      }}
                    >
                      <div
                        className="flow-analysis-weekday-fill"
                        style={{
                          display: 'block',
                          width: `${barWidth}%`,
                          height: '100%',
                          borderRadius: '999px',
                          background: 'linear-gradient(90deg, #4686e4, #8fc4ff)',
                          transition: 'width 300ms ease'
                        }}
                      />
                    </div>
                    <strong>{item.days > 0 ? `${item.average}명` : '-'}</strong>
                  </div>
                )
              })}
            </div>
          </article>

          <article className="flow-analysis-panel flow-analysis-results">
            <PanelHeading
              icon="lightbulb"
              title="분석 결과"
              description="History API의 실제 입장 기록과 시간대 API를 기반으로 자동 계산합니다."
            />

            <div className="flow-analysis-result-list">
              {resultItems.length > 0 ? (
                resultItems.map((result, index) => (
                  <div
                    className="flow-analysis-result-item"
                    key={`${result.title}-${index}`}
                  >
                    <span className="flow-analysis-result-icon" aria-hidden="true">
                      {result.icon}
                    </span>
                    <div>
                      <strong>{result.title}</strong>
                      <p>{result.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <strong>분석할 실제 데이터가 없습니다.</strong>
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="flow-analysis-panel flow-analysis-operation">
          <PanelHeading
            icon="settings"
            title="운영 활용 방안"
            description="실제 방문 데이터를 매장 운영에 활용할 수 있습니다."
          />

          <div className="flow-analysis-operation-grid">
            <div>
              <span className="flow-analysis-operation-icon">
                <AnalysisIcon name="people" />
              </span>
              <strong>인력 배치</strong>
              <p>
                방문객이 많은 시간대에 인력을 집중 배치할 수 있습니다.
              </p>
            </div>

            <div>
              <span className="flow-analysis-operation-icon">
                <AnalysisIcon name="box" />
              </span>
              <strong>재고 관리</strong>
              <p>
                방문객 증가 시간에 맞춰 상품 및 재고를 준비할 수 있습니다.
              </p>
            </div>

            <div>
              <span className="flow-analysis-operation-icon">
                <AnalysisIcon name="chart" />
              </span>
              <strong>매장 운영 개선</strong>
              <p>
                누적 데이터가 확보되면 장기적인 운영 계획에 활용할 수 있습니다.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default DataAnalysis
