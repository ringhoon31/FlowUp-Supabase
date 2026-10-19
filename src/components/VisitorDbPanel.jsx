import { useCallback, useEffect, useRef, useState } from 'react'
import { normalizeVisitorHistory } from '../visitorData'
import '../styles/visitorDb.css'

const API_BASE_URL = (import.meta.env.VITE_VISITOR_API_URL || '').replace(/\/$/, '')

function VisitorDbPanel({ selectedStore }) {
  const [records, setRecords] = useState([])
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [lastChecked, setLastChecked] = useState(null)
  const requestSequence = useRef(0)

  const selectedStoreId = selectedStore?.id == null ? '' : String(selectedStore.id)
  const selectedDeviceId = String(selectedStore?.deviceId || '').trim()

  const fetchVisitorData = useCallback(async () => {
    // 매장을 선택하지 않았다면 다른 매장의 전체 기록을 잘못 표시하지 않습니다.
    const sequence = ++requestSequence.current
    if (!selectedStoreId && !selectedDeviceId) {
      setRecords([])
      setStatus('no-store')
      setErrorMessage('')
      return
    }

    try {
      setStatus((old) => old === 'connected' ? old : 'loading')
      const response = await fetch(`${API_BASE_URL}/api/people/history`, {
        signal: AbortSignal.timeout(10000),
        cache: 'no-store'
      })
      if (!response.ok) throw new Error(`방문 기록 API 오류: HTTP ${response.status}`)

      const result = await response.json()
      if (!Array.isArray(result)) throw new Error('방문 기록 API 응답이 배열이 아닙니다.')

      // 센서 누적 카운터의 실제 증가분은 기존 공통 함수에서 계산합니다.
      const normalized = normalizeVisitorHistory(result)
      const matched = normalized.filter((row) => {
        const rowStoreId = row.storeId ?? row.store_id
        const rowDeviceId = String(row.deviceId || '').trim()

        // 매장 ID가 저장된 기록은 매장 ID가 최우선입니다.
        // 같은 store_id라면 과거 장치 ID(store01)의 기록도 포함합니다.
        if (rowStoreId !== null && rowStoreId !== undefined && String(rowStoreId) !== '') {
          return selectedStoreId !== '' && String(rowStoreId) === selectedStoreId
        }
        // store_id가 없는 구형 데이터만 장치 ID로 보완합니다.
        return selectedDeviceId !== '' && rowDeviceId === selectedDeviceId
      })

      if (sequence !== requestSequence.current) return
      setRecords(matched)
      setStatus('connected')
      setErrorMessage('')
      setLastChecked(new Date())
    } catch (error) {
      if (sequence !== requestSequence.current) return
      setStatus('error')
      setErrorMessage(error.message || '방문 기록 조회에 실패했습니다.')
      // 실패했을 때 이전 매장의 기록이 표시되지 않도록 처리합니다.
      setRecords([])
    }
  }, [selectedStoreId, selectedDeviceId])

  useEffect(() => {
    // 다른 매장을 선택할 때 기존 매장 기록을 즉시 비웁니다.
    setRecords([])
    setLastChecked(null)
    setStatus(selectedStoreId || selectedDeviceId ? 'loading' : 'no-store')
    fetchVisitorData()
    const interval = setInterval(fetchVisitorData, 30000)
    return () => {
      ++requestSequence.current
      clearInterval(interval)
    }
  }, [fetchVisitorData, selectedStoreId, selectedDeviceId])

  const latest = records.length ? records[records.length - 1] : null
  const now = new Date()
  const isToday = (date) => date &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  const todayRecords = records.filter((row) => isToday(row.date))
  const todayIn = todayRecords.reduce((sum, row) => sum + row.deltaIn, 0)
  const todayOut = todayRecords.reduce((sum, row) => sum + row.deltaOut, 0)
  const connected = status === 'connected'

  const displayCount = (number) => connected ? `${number}명` : '—'
  const lastEventText = latest?.eventType === 'IN'
    ? '입장 감지'
    : latest?.eventType === 'OUT'
      ? '퇴장 감지'
      : '이벤트 기록 없음'
  const latestTime = latest?.date?.toLocaleString('ko-KR') || '기록 없음'

  return (
    <section className="visitor-db-panel">
      <div className="visitor-db-header">
        <div>
          <h2>실시간 방문자 데이터</h2>
          <p>선택된 매장의 Supabase 방문 기록을 확인합니다.</p>
        </div>
        <button
          type="button"
          className="visitor-refresh-button"
          onClick={fetchVisitorData}
          disabled={status === 'no-store'}
        >
          🔄 새로고침
        </button>
      </div>

      <div
        className={`visitor-connection-status ${
          connected ? 'is-connected' : status === 'loading' ? 'is-connecting' : 'is-disconnected'
        }`}
        role="status"
        aria-live="polite"
      >
        <span className="visitor-connection-dot" />
        {connected
          ? '방문 기록 API 연결됨 · 저장된 데이터 조회 가능 (센서 연결 상태와는 별개)'
          : status === 'loading'
            ? '방문 기록 조회 중...'
            : status === 'no-store'
              ? '조회할 매장을 먼저 선택해 주세요.'
              : `방문 기록 API 조회 실패 · ${errorMessage}`}
      </div>

      <div className="visitor-store-info">
        <div className="visitor-store-icon">🏪</div>
        <div>
          <h3>{selectedStore?.name || '선택된 매장 없음'}</h3>
          <p>매장 ID: {selectedStoreId || '설정되지 않음'} · 등록 장치 ID: {selectedDeviceId || '설정되지 않음'}</p>
        </div>
      </div>

      <div className="visitor-db-cards">
        <div className="visitor-db-card">
          <div className="visitor-db-card-icon">🚶</div>
          <div>
            <span>오늘 입장</span>
            <strong>{displayCount(todayIn)}</strong>
          </div>
        </div>
        <div className="visitor-db-card">
          <div className="visitor-db-card-icon">🚪</div>
          <div>
            <span>오늘 퇴장</span>
            <strong>{displayCount(todayOut)}</strong>
          </div>
        </div>
        <div className="visitor-db-card current">
          <div className="visitor-db-card-icon">👥</div>
          <div>
            <span>마지막 기록 인원</span>
            <strong>{connected && latest ? `${latest.peopleNow}명` : '—'}</strong>
          </div>
        </div>
      </div>

      <div className="visitor-extra-info">
        <div>
          <span>마지막 이벤트</span>
          <strong>{connected ? lastEventText : '정보 없음'}</strong>
        </div>
        <div className="visitor-last-updated">
          마지막 출입 기록: {connected ? latestTime : '확인 불가'}
          {' · '}
          최근 조회: {lastChecked ? lastChecked.toLocaleString('ko-KR') : '조회 전'}
        </div>
        <p>방문객 수는 저장된 출입 기록을 기준으로 하며, 센서 전원·통신 상태를 의미하지 않습니다.</p>
      </div>
    </section>
  )
}

export default VisitorDbPanel
