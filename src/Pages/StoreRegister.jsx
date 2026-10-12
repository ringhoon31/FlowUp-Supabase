import { useState } from 'react'
import '../styles/store.css'

function StoreIcon({ name }) {
  const paths = {
    store: (
      <>
        <path d="M3 10h18v11H3V10ZM3 10l2-6h14l2 6M9 21v-7h6v7" />
        <path d="M3 10c0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0" />
      </>
    ),

    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),

    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),

    coordinates: (
      <>
        <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
        <circle cx="12" cy="12" r="4" />
      </>
    ),

    check: (
      <path d="m4 12 5 5L20 6" />
    ),

    save: (
      <>
        <path d="M4 3h14l3 3v15H4V3Z" />
        <path d="M7 3v6h10V3M8 21v-8h9v8" />
      </>
    )
  }

  return (
    <svg
      className="flow-store-icon"
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

function StoreRegister({
  onSaved,
  stores = [],
  selectedStore = null
}) {
  // 이전 기능: 선택된 기존 매장을 열면 정보가 폼에 입력됨
  const [editingId, setEditingId] = useState(
    selectedStore?.id || ''
  )

  const [storeName, setStoreName] = useState(
    selectedStore?.name || ''
  )

  const [address, setAddress] = useState(
    selectedStore?.address || ''
  )

  const [latitude, setLatitude] = useState(
    selectedStore?.latitude ?? ''
  )

  const [longitude, setLongitude] = useState(
    selectedStore?.longitude ?? ''
  )

  const [savedStore, setSavedStore] = useState(
    selectedStore
  )

  const [deviceId, setDeviceId] = useState(
    selectedStore?.deviceId || ''
  )

  const startNewStore = () => {
    setEditingId('')
    setStoreName('')
    setAddress('')
    setLatitude('')
    setLongitude('')
    setDeviceId('')
  }

  const editStore = (store) => {
    setEditingId(store.id)
    setStoreName(store.name)
    setAddress(store.address)
    setLatitude(store.latitude)
    setLongitude(store.longitude)
    setDeviceId(store.deviceId || '')
    setSavedStore(store)
  }

  // 기존 네이버 주소 검색 기능 유지
  const handleAddressSearch = () => {
    if (!address.trim()) {
      alert(
        '매장 주소를 입력해주세요.'
      )

      return
    }

    if (
      !window.naver ||
      !window.naver.maps ||
      !window.naver.maps.Service
    ) {
      alert(
        '네이버 지도 서비스를 불러오는 중입니다.\n잠시 후 다시 시도해주세요.'
      )

      return
    }

    window.naver.maps.Service.geocode(
      {
        query: address.trim()
      },
      (status, response) => {
        if (
          status !==
          window.naver.maps.Service.Status.OK
        ) {
          alert(
            '주소 검색에 실패했습니다.'
          )

          return
        }

        const result = response.v2

        if (
          !result.addresses ||
          result.addresses.length === 0
        ) {
          alert(
            '검색 결과가 없습니다.'
          )

          return
        }

        const item =
          result.addresses[0]

        setAddress(
          item.roadAddress ||
            item.jibunAddress ||
            address
        )

        setLatitude(item.y)
        setLongitude(item.x)

        alert(
          '주소를 찾았습니다.'
        )
      }
    )
  }

  const handleSave = async (event) => {
    event.preventDefault()

    if (!storeName.trim() || !address.trim() || latitude === '' || longitude === '') {
      alert('매장 이름과 주소를 입력하고\n주소 검색을 진행해주세요.')
      return
    }

    try {
      const userId = Number(localStorage.getItem('flowupUserId'))
      const body = {
        storeName: storeName.trim(),
        address: address.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        deviceId: deviceId.trim(),
        userId: Number.isFinite(userId) ? userId : null
      }

      const url = editingId
        ? `${import.meta.env.VITE_VISITOR_API_URL}/api/stores/${editingId}`
        : `${import.meta.env.VITE_VISITOR_API_URL}/api/stores`

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error('매장 정보를 저장하지 못했습니다.')
      }

      const result = await response.json()
      const store = result.store || {
        id: Number(editingId),
        name: body.storeName,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
        deviceId: body.deviceId,
        userId: body.userId
      }

      setSavedStore(store)
      setEditingId(store.id)
      alert('매장 정보가 DB에 저장되었습니다.')

      if (onSaved) onSaved(store)
    } catch (error) {
      console.error('매장 저장 실패:', error)
      alert(error.message || '매장 저장 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="flow-store-page">
      <div className="flow-store-inner">
        <header className="flow-store-header">
          <span className="flow-store-kicker">
            FLOWUP STORE
          </span>

          <h1>매장 등록</h1>

          <p>
            Flowup에서 관리할 매장 정보를 등록합니다.
          </p>
        </header>

        <div className="flow-store-layout">
          <section className="flow-store-panel">
            <div className="flow-store-panel-heading">
              <span className="flow-store-panel-icon">
                <StoreIcon name="store" />
              </span>

              <div>
                <h2>
                  {editingId
                    ? '매장 정보 수정'
                    : '매장 정보 입력'}
                </h2>

                <p>
                  이름과 주소를 입력한 뒤
                  주소를 검색해 주세요.
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  className="flow-store-new-button"
                  onClick={
                    startNewStore
                  }
                >
                  + 새 매장 등록
                </button>
              )}
            </div>

            <form
              className="flow-store-form"
              onSubmit={handleSave}
            >
              <div className="flow-store-field">
                <label htmlFor="flow-store-name">
                  매장 이름
                </label>

                <input
                  id="flow-store-name"
                  type="text"
                  placeholder="예: Flowup 강남점"
                  value={storeName}
                  onChange={(event) =>
                    setStoreName(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="flow-store-field">
                <label htmlFor="flow-store-address">
                  매장 주소
                </label>

                <div className="flow-store-address-row">
                  <div className="flow-store-input-icon">
                    <StoreIcon name="pin" />

                    <input
                      id="flow-store-address"
                      type="text"
                      placeholder="예: 서울특별시 강남구 강남대로 396"
                      value={address}
                      onChange={(event) => {
                        setAddress(
                          event.target.value
                        )

                        // 주소를 바꾸면 이전 좌표는 무효
                        setLatitude('')
                        setLongitude('')
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    className="flow-store-search-button"
                    onClick={
                      handleAddressSearch
                    }
                  >
                    <StoreIcon name="search" />
                    주소 검색
                  </button>
                </div>

                <small className="flow-store-field-help">
                  주소 검색을 완료하면
                  위도와 경도가 자동으로
                  입력됩니다.
                </small>
              </div>

              <div className="flow-store-coordinate-fields">
                <div className="flow-store-field">
                  <label htmlFor="flow-store-latitude">
                    위도
                  </label>

                  <input
                    id="flow-store-latitude"
                    type="number"
                    step="any"
                    placeholder="주소 검색 시 자동 입력"
                    value={latitude}
                    readOnly
                  />
                </div>

                <div className="flow-store-field">
                  <label htmlFor="flow-store-longitude">
                    경도
                  </label>

                  <input
                    id="flow-store-longitude"
                    type="number"
                    step="any"
                    placeholder="주소 검색 시 자동 입력"
                    value={longitude}
                    readOnly
                  />
                </div>
              </div>

              <div className="flow-store-field">
                <label htmlFor="flow-store-device-id">센서 장치 ID</label>
                <input
                  id="flow-store-device-id"
                  type="text"
                  placeholder="예: store01"
                  value={deviceId}
                  onChange={(event) => setDeviceId(event.target.value)}
                />
                <small className="flow-store-field-help">
                  Arduino 센서와 매장을 연결할 때 사용하는 장치 ID입니다.
                </small>
              </div>

              <button
                type="submit"
                className="flow-store-save-button"
              >
                <StoreIcon name="save" />

                {editingId
                  ? '매장 정보 수정'
                  : '매장 정보 저장'}
              </button>
            </form>
          </section>

          <aside className="flow-store-side">
            <section className="flow-store-panel flow-store-current">
              <div className="flow-store-panel-heading">
                <span className="flow-store-panel-icon">
                  <StoreIcon name="check" />
                </span>

                <div>
                  <h2>
                    현재 등록된 매장
                  </h2>

                  <p>
                    저장된 매장 정보를
                    확인할 수 있습니다.
                  </p>
                </div>
              </div>

              {savedStore ? (
                <div className="flow-store-current-content">
                  <span className="flow-store-current-badge">
                    <span aria-hidden="true" />
                    등록 완료
                  </span>

                  <h3>
                    {savedStore.name}
                  </h3>

                  <div className="flow-store-current-address">
                    <StoreIcon name="pin" />
                    <span>
                      {savedStore.address}
                    </span>
                  </div>

                  <div className="flow-store-current-coordinates">
                    <div>
                      <span>위도</span>
                      <strong>
                        {savedStore.latitude}
                      </strong>
                    </div>

                    <div>
                      <span>경도</span>
                      <strong>
                        {savedStore.longitude}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flow-store-empty">
                  <span className="flow-store-empty-icon">
                    <StoreIcon name="store" />
                  </span>

                  <strong>
                    등록된 매장이 없습니다
                  </strong>

                  <p>
                    왼쪽에서 매장 정보를
                    입력하고 저장해 주세요.
                  </p>
                </div>
              )}
            </section>

            {stores.length > 0 && (
              <section className="flow-store-panel flow-store-list-panel">
                <h2>
                  등록된 매장 목록
                </h2>

                <div className="flow-store-list">
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      type="button"
                      className={
                        `flow-store-list-item ${
                          editingId ===
                          store.id
                            ? 'is-active'
                            : ''
                        }`
                      }
                      onClick={() =>
                        editStore(store)
                      }
                    >
                      <strong>
                        {store.name}
                      </strong>

                      <small>
                        {store.address}
                      </small>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="flow-store-hint">
              <span className="flow-store-hint-icon">
                <StoreIcon name="coordinates" />
              </span>

              <p>
                주소 검색 결과의 좌표가
                방문객 분석에 사용됩니다.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default StoreRegister