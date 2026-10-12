const hourlyData = [
  { hour: '09', value: 18 },
  { hour: '10', value: 29 },
  { hour: '11', value: 34 },
  { hour: '12', value: 40 },
  { hour: '13', value: 48 },
  { hour: '14', value: 58 },
  { hour: '15', value: 72 },
  { hour: '16', value: 59 },
  { hour: '17', value: 46 },
  { hour: '18', value: 31 },
  { hour: '19', value: 24 },
  { hour: '20', value: 15 }
]

function AnalyticsPreview() {
  return (
    <div className="flow-home-analytics">
      <div className="flow-home-analytics-heading">
        <strong>실시간 방문 현황</strong>
        <span className="flow-home-live">
          <i />
          화면 미리보기
        </span>
      </div>

      <div className="flow-home-metrics">
        <div className="flow-home-metric">
          <span className="flow-home-metric-icon">♟</span>
          <div>
            <span className="flow-home-metric-label">현재 방문객 수</span>
            <strong>28<small>명</small></strong>
            <span className="flow-home-trend green">▼ 12%</span>
          </div>
        </div>

        <div className="flow-home-metric">
          <span className="flow-home-metric-icon">▥</span>
          <div>
            <span className="flow-home-metric-label">오늘 누적 방문객</span>
            <strong>412<small>명</small></strong>
            <span className="flow-home-trend blue">▲ 18%</span>
          </div>
        </div>
      </div>

      <div className="flow-home-chart-card">
        <div className="flow-home-chart-heading">
          <strong>시간대별 방문 패턴</strong>
          <span>오늘 방문 현황</span>
        </div>

        <svg
          className="flow-home-chart-svg"
          viewBox="0 0 720 210"
          preserveAspectRatio="none"
          role="img"
          aria-label="09시부터 20시까지의 방문 패턴을 보여주는 예시 그래프"
        >
          <defs>
            <linearGradient id="flowupBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#59a5ff" />
              <stop offset="100%" stopColor="#23539c" />
            </linearGradient>
            <linearGradient id="flowupPeakGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#92d5ff" />
              <stop offset="100%" stopColor="#3987ed" />
            </linearGradient>
          </defs>

          {[35, 80, 125, 170].map((y) => (
            <line
              key={y}
              x1="16"
              x2="704"
              y1={y}
              y2={y}
              stroke="#456083"
              strokeDasharray="3 6"
              opacity="0.55"
            />
          ))}

          {hourlyData.map(({ hour, value }, index) => {
            const barHeight = value * 1.7
            const x = 29 + index * 57

            return (
              <g key={hour}>
                <rect
                  x={x}
                  y={170 - barHeight}
                  width="28"
                  height={barHeight}
                  rx="4"
                  fill={
                    hour === '15'
                      ? 'url(#flowupPeakGradient)'
                      : 'url(#flowupBarGradient)'
                  }
                />

                <text
                  x={x + 14}
                  y="196"
                  textAnchor="middle"
                  fill={hour === '15' ? '#9bd3ff' : '#b9c9df'}
                  fontSize="12"
                  fontWeight={hour === '15' ? '700' : '400'}
                >
                  {hour}시
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function MapPreview() {
  return (
    <div className="flow-home-map" aria-hidden="true">
      {/* 지도 미리보기의 도로와 공원 */}
      <svg
        className="flow-home-map-art"
        viewBox="0 0 900 560"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="900" height="560" fill="#f4f7f4" />

        <path
          d="M-40 490 C140 365 170 570 385 468 S715 440 940 270"
          fill="none"
          stroke="#d9e9fb"
          strokeWidth="62"
        />

        <path
          d="M70 40 L250 120 L130 280 L25 220 Z"
          fill="#e5f1dd"
        />
        <path
          d="M580 80 L830 65 L810 225 L620 205 Z"
          fill="#e5f1dd"
        />
        <path
          d="M300 310 L480 280 L520 400 L385 450 Z"
          fill="#e6f0df"
        />

        <g stroke="#fff" fill="none" strokeLinecap="round">
          <path d="M-20 105 L930 410" strokeWidth="23" />
          <path d="M-20 330 L930 95" strokeWidth="18" />
          <path d="M125 -20 L300 600" strokeWidth="20" />
          <path d="M520 -20 L680 600" strokeWidth="19" />
          <path d="M-20 205 L930 490" strokeWidth="12" />
          <path d="M-20 440 L930 210" strokeWidth="12" />
          <path d="M365 -20 L510 590" strokeWidth="10" />
          <path d="M760 -20 L870 590" strokeWidth="11" />
          <path d="M-20 25 L930 325" strokeWidth="9" />
        </g>

        <g stroke="#f5dda0" fill="none" strokeLinecap="round">
          <path d="M-20 105 L930 410" strokeWidth="8" />
          <path d="M-20 330 L930 95" strokeWidth="5" />
        </g>
      </svg>

      <div className="flow-home-map-search">
        <span>⌕</span>
        지역, 매장명으로 검색해보세요.
      </div>

      <div className="flow-home-map-filters">
        <span className="selected">▦ 전체</span>
        <span>☕ 카페</span>
        <span>음식점</span>
        <span>쇼핑</span>
      </div>

      <span className="flow-home-map-label label-a">연남동</span>
      <span className="flow-home-map-label label-b">홍대입구역</span>
      <span className="flow-home-map-label label-c">마포구</span>
      <span className="flow-home-map-label label-d">경의선숲길</span>

      <div className="flow-home-map-pin pin-a">
        <span className="flow-home-pin-dot blue" />
        <span className="flow-home-pin-card">
          플로우 커피 <b className="blue-text">여유</b>
        </span>
      </div>

      <div className="flow-home-map-pin pin-b">
        <span className="flow-home-pin-dot red" />
        <span className="flow-home-pin-card">
          코지 베이커리 <b className="red-text">혼잡</b>
        </span>
      </div>

      <div className="flow-home-map-pin pin-c">
        <span className="flow-home-pin-dot gray" />
        <span className="flow-home-pin-card">
          어반카페 <b>보통</b>
        </span>
      </div>

      <div className="flow-home-store">
        <div className="flow-home-store-image">
          <span>FLOW COFFEE</span>
        </div>

        <div className="flow-home-store-details">
          <strong>플로우 커피</strong>
          <small>⌖ 서울 마포구 연남동 123</small>
          <span><i /> 현재 혼잡도 · <b>여유</b></span>
          <small>현재 방문객 약 12명</small>
        </div>

        <span className="flow-home-store-arrow">›</span>
      </div>
    </div>
  )
}

function Home({ onFindStore, onAdminLogin }) {
  return (
    <div className="flow-home">
      <section className="flow-home-left">
        <div className="flow-home-brand">
          <span className="flow-home-symbol" aria-hidden="true">
          </span>
          <span>🏪 Flowup</span>
        </div>

        <div className="flow-home-left-copy">
          <span className="flow-home-badge flow-home-badge-left">
            <span>♟</span> 방문객을 위한 공간
          </span>

          <p>위치에 따른 매장을 검색해보고 실시간으로 <br></br>혼잡도를 확인해보실 수 있습니다.</p>

          <button
            type="button"
            className="flow-home-button flow-home-find"
            onClick={onFindStore}
          >
            매장 찾기 <span aria-hidden="true">→</span>
          </button>
        </div>

        <MapPreview />
      </section>

      <section className="flow-home-right">
        <div className="flow-home-right-inner">
          <span className="flow-home-badge flow-home-badge-right">
            <span>▂▅▇</span> 매장 운영자를 위한 공간
          </span>

          <p className="flow-home-manager-description">
            Arduino 센서로 측정한 방문객 수와 시간대별 패턴을 통해<br />
            매장의 운영을 더 스마트하게 관리할 수 있습니다.
          </p>

          <button
            type="button"
            className="flow-home-button flow-home-login"
            onClick={onAdminLogin}
          >
            관리자 로그인 <span aria-hidden="true">→</span>
          </button>

          <AnalyticsPreview />
        </div>
      </section>
    </div>
  )
}

export default Home