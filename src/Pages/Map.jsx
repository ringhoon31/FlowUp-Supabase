import MapView from './MapView'
import '../styles/mapRedesign.css'

function Map({ onBack }) {
  return (
    <div className="flow-map-shell">
      <header className="flow-map-topbar">
        <div className="flow-map-brand">
          <span
            className="flow-map-brand-icon"
            aria-hidden="true"
          >
            🏪
          </span>

          <strong>flowup</strong>

          <span
            className="flow-map-brand-divider"
            aria-hidden="true"
          />

          <span className="flow-map-page-name">
            매장 찾기
          </span>
        </div>

        <button
          type="button"
          className="flow-map-home-button"
          onClick={onBack}
        >
          ← 메인으로
        </button>
      </header>

      <div className="flow-map-body">
        <div className="flow-map-sidebar-title">
          <h1>주변 매장 찾기</h1>
          <p>매장의 실시간 정보를 확인할 수 있습니다.</p>
        </div>

        {/* 기존 Map.jsx의 지도·검색·마커 기능을 그대로 사용 */}
        <MapView />
      </div>
    </div>
  )
}

export default Map