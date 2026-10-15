import { useCallback, useEffect, useState } from 'react'
import '../styles/visitorDb.css'

function VisitorDbPanel({ selectedStore }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchVisitorData = useCallback(async () => {
    try {
      const baseUrl = (import.meta.env.VITE_VISITOR_API_URL || 'http://localhost:3001')

      if (!baseUrl) {
        throw new Error('VITE_VISITOR_API_URL 환경변수가 설정되지 않았습니다.')
      }

      const response = await fetch(`${baseUrl}/api/people`, {
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`)
      }

      const result = await response.json()

      if (!result || typeof result !== 'object') {
        throw new Error('방문자 API 응답 형식이 올바르지 않습니다.')
      }

      setData(result)
      setConnected(true)
      setLastUpdated(new Date())
    } catch (error) {
      setConnected(false)
      // 연결이 끊겨도 이전에 받은 마지막 데이터는 유지합니다.
      // 아직 한 번도 데이터를 받지 못했다면 숫자 대신 — 를 표시합니다.
      console.warn('방문자 데이터 API 연결 안 됨:', error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let disposed = false

    const runFetch = async () => {
      if (disposed) return
      await fetchVisitorData()
    }

    runFetch()
    const interval = setInterval(runFetch, 5000)

    return () => {
      disposed = true
      clearInterval(interval)
    }
  }, [fetchVisitorData])

  const displayCount = (value) => {
    if (value === null || value === undefined || value === '') return '—'
    const parsed = Number(value)
    return Number.isFinite(parsed) ? `${parsed}명` : '—'
  }

  return (
    <section className="visitor-db-panel">
      <div className="visitor-db-header">
        <div>
          <h2>실시간 방문자 데이터</h2>
          <p>센서 API에서 받은 현재 매장 방문 데이터를 확인합니다.</p>
        </div>

        <button
          type="button"
          className="visitor-refresh-button"
          onClick={fetchVisitorData}
        >
          🔄 새로고침
        </button>
      </div>

      <div
        className={`visitor-connection-status ${
          connected
            ? 'is-connected'
            : loading
              ? 'is-connecting'
              : 'is-disconnected'
        }`}
        role="status"
        aria-live="polite"
      >
        <span className="visitor-connection-dot" />
        {connected
          ? '신호 정상 · API 응답 수신 중'
          : loading
            ? '센서 신호 확인 중...'
            : '신호 안 잡힘 · API에 연결할 수 없습니다.'}
      </div>

      <div className="visitor-store-info">
        <div className="visitor-store-icon">🏪</div>
        <div>
          <h3>{selectedStore?.name || 'FlowUp 강남점'}</h3>
          <p>실시간 센서 데이터</p>
        </div>
      </div>

      <div className="visitor-db-cards">
        <div className="visitor-db-card">
          <div className="visitor-db-card-icon">🚶</div>
          <div>
            <span>오늘 입장</span>
            <strong>{displayCount(data?.inCount)}</strong>
          </div>
        </div>

        <div className="visitor-db-card">
          <div className="visitor-db-card-icon">🚪</div>
          <div>
            <span>오늘 퇴장</span>
            <strong>{displayCount(data?.outCount)}</strong>
          </div>
        </div>

        <div className="visitor-db-card current">
          <div className="visitor-db-card-icon">👥</div>
          <div>
            <span>현재 방문객</span>
            <strong>{displayCount(data?.peopleNow)}</strong>
          </div>
        </div>
      </div>

      <div className="visitor-extra-info">
        <div>
          <span>마지막 이벤트</span>
          <strong>
            {!connected
              ? '신호 없음'
              : data?.lastEvent === 'IN'
                ? '입장 감지'
                : data?.lastEvent === 'OUT'
                  ? '퇴장 감지'
                  : '이벤트 정보 없음'}
          </strong>
        </div>

        <div className="visitor-last-updated">
          마지막 데이터 수신:{' '}
          {lastUpdated
            ? lastUpdated.toLocaleString('ko-KR')
            : '수신 기록 없음'}
        </div>
      </div>
    </section>
  )
}

export default VisitorDbPanel
