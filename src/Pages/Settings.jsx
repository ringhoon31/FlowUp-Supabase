import { useState } from 'react'
import '../styles/settings.css'

function SettingsIcon({ name }) {
  const paths = {
    sensor: (
      <>
        <circle cx="12" cy="12" r="2" />
        <path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9" />
        <path d="M4.5 4.5a10.6 10.6 0 0 0 0 15M19.5 4.5a10.6 10.6 0 0 1 0 15" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
        <path d="M10 21h4" />
      </>
    ),
    store: (
      <>
        <path d="M3 10h18v11H3V10ZM3 10l2-6h14l2 6M9 21v-7h6v7" />
        <path d="M3 10c0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0" />
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
    database: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
        <path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" />
      </>
    )
  }

  return (
    <svg
      className="flow-settings-icon"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function SettingsPanelHeader({
  icon,
  title,
  description,
  right
}) {
  return (
    <div className="flow-settings-panel-heading">
      <div className="flow-settings-panel-heading-main">
        <span className="flow-settings-panel-icon">
          <SettingsIcon name={icon} />
        </span>

        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      {right}
    </div>
  )
}

function SettingToggle({
  id,
  title,
  description,
  checked,
  onChange
}) {
  return (
    <div className="flow-settings-option">
      <div>
        <label
          className="flow-settings-option-title"
          htmlFor={id}
        >
          {title}
        </label>

        <p>{description}</p>
      </div>

      <label
        className="flow-settings-toggle"
        htmlFor={id}
        aria-label={title}
      >
       <input
  id={id}
  type="checkbox"
  checked={checked}
  onChange={onChange}
/>

        <span
          className="flow-settings-toggle-track"
          aria-hidden="true"
        />
      </label>
    </div>
  )
}

function Settings({
  selectedStore,
  theme,
  onChangeTheme
}) {
   const [crowdAlert, setCrowdAlert] = useState(true)
  const [sensorAlert, setSensorAlert] = useState(true)
  return (
    <div className="flow-settings-page">
      <div className="flow-settings-inner">
        {/* 페이지 제목 */}
        <header className="flow-settings-header">
          <span className="flow-settings-kicker">
            FLOWUP SETTINGS
          </span>

          <h1>설정</h1>

          <p>
            센서와 매장 분석 시스템의 설정을 관리합니다.
          </p>
        </header>

        <div className="flow-settings-grid">
          {/* 센서 상태 */}
          <section className="flow-settings-panel">
            <SettingsPanelHeader
              icon="sensor"
              title="센서 상태"
              description="현재 연결된 센서의 상태를 확인합니다."
              right={
                <span className="flow-settings-status-badge">
                  <span aria-hidden="true" />
                  정상
                </span>
              }
            />

            <div className="flow-settings-panel-body">
              <div className="flow-settings-sensor-row">
                <span className="flow-settings-row-icon">
                  <SettingsIcon name="people" />
                </span>

                <div>
                  <strong>방문객 센서</strong>
                  <p>
                    매장 출입 데이터를 수집합니다.
                  </p>
                </div>

                <span className="flow-settings-row-status">
                  정상 작동
                </span>
              </div>

              <div className="flow-settings-sensor-row">
                <span className="flow-settings-row-icon">
                  <SettingsIcon name="database" />
                </span>

                <div>
                  <strong>데이터 수집</strong>
                  <p>
                    센서 데이터가 서버로 정상
                    전송되고 있습니다.
                  </p>
                </div>

                <span className="flow-settings-row-status">
                  정상
                </span>
              </div>
            </div>
          </section>

          {/* 알림 설정 */}
          <section className="flow-settings-panel">
            <SettingsPanelHeader
              icon="bell"
              title="알림 설정"
              description="매장 상태에 대한 알림을 관리합니다."
            />

            <div className="flow-settings-panel-body">
             <SettingToggle
  id="flow-settings-crowd-alert"
  title="혼잡 알림"
  description="매장이 혼잡해지면 알림을 표시합니다."
  checked={crowdAlert}
  onChange={(e) => setCrowdAlert(e.target.checked)}
/>

<SettingToggle
  id="flow-settings-sensor-alert"
  title="센서 이상 알림"
  description="센서 연결에 문제가 발생하면 알림을 표시합니다."
  checked={sensorAlert}
  onChange={(e) => setSensorAlert(e.target.checked)}
/>
            </div>
          </section>

       {/* 화면 테마 */}
<section className="flow-settings-panel">
  <SettingsPanelHeader
    icon="settings"
    title="화면 테마"
    description="Flowup 화면의 테마를 설정합니다."
  />

  <div className="flow-settings-panel-body">
    <div className="flow-settings-theme-options">

      <button
        type="button"
        className={`flow-settings-theme-option ${
          theme === 'light' ? 'active' : ''
        }`}
        onClick={() =>
          onChangeTheme('light')
        }
      >
        <span className="flow-settings-theme-icon">
          ☀
        </span>

        <div>
          <strong>라이트 모드</strong>
          <p>밝은 화면으로 사용합니다.</p>
        </div>
      </button>

      <button
        type="button"
        className={`flow-settings-theme-option ${
          theme === 'dark' ? 'active' : ''
        }`}
        onClick={() =>
          onChangeTheme('dark')
        }
      >
        <span className="flow-settings-theme-icon">
          🌙
        </span>

        <div>
          <strong>다크 모드</strong>
          <p>어두운 화면으로 사용합니다.</p>
        </div>
      </button>

    </div>
  </div>
</section>

          {/* 매장 정보 */}
          <section className="flow-settings-panel">
            <SettingsPanelHeader
              icon="store"
              title="매장 정보"
              description="방문객 분석에 사용되는 매장 정보를 확인합니다."
            />

            <div className="flow-settings-info-list">
  <div>
    <span>매장 이름</span>
    <strong>
      {selectedStore?.name || '선택된 매장 없음'}
    </strong>
  </div>

              <div>
                <span>데이터 수집 상태</span>
                <strong className="flow-settings-good">
                  정상
                </strong>
              </div>

              <div>
                <span>마지막 데이터 수집</span>
                <strong>방금 전</strong>
              </div>
            </div>
          </section>

          {/* 시스템 정보 */}
          <section className="flow-settings-panel">
            <SettingsPanelHeader
              icon="settings"
              title="시스템 정보"
              description="현재 시스템의 기본 정보를 확인합니다."
            />

            <div className="flow-settings-info-list">
              <div>
                <span>서비스 상태</span>
                <strong className="flow-settings-good">
                  정상 운영 중
                </strong>
              </div>

              <div>
                <span>데이터 연결</span>
                <strong className="flow-settings-good">
                  연결됨
                </strong>
              </div>

              <div>
                <span>버전</span>
                <strong>v1.0.0</strong>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Settings