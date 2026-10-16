import { useEffect, useRef, useState } from 'react'

function Map({ onBack }) {
  const mapElement = useRef(null)
  const mapRef = useRef(null)

  // 매장 마커와 정보창을 매장 단위로 함께 관리
  const markerEntriesRef = useRef([])

  // 내 위치 마커는 일반 매장 마커와 따로 관리
  const userLocationMarkerRef = useRef(null)

  // 왼쪽 매장 목록 DOM을 매장별로 기억
  // 지도 마커를 클릭했을 때 해당 목록으로 자동 스크롤하기 위해 사용
  const storeListRefs = useRef({})

  const [searchKeyword, setSearchKeyword] = useState('')
  const [stores, setStores] = useState([])
  const [isMapReady, setIsMapReady] = useState(false)

  // 선택된 매장
  const [selectedStore, setSelectedStore] = useState(null)

  // Flowup 등록 매장 상세 카드
  const [selectedFlowupStore, setSelectedFlowupStore] =
    useState(null)

  // 현재 위치를 확인했는지 여부
  const [hasUserLocation, setHasUserLocation] = useState(false)

  // =====================================
  // 저장된 Flowup 매장
  // =====================================

  const getSavedStore = () => {
    try {
      return JSON.parse(
        localStorage.getItem('flowupStore') || 'null'
      )
    } catch (error) {
      console.error('Flowup 매장 정보를 불러오지 못했습니다.', error)
      return null
    }
  }

  // =====================================
  // HTML 태그 제거
  // =====================================

  const removeHtml = (text = '') => {
    return text.replace(/<[^>]*>/g, '')
  }

  // =====================================
  // 매장 고유 키
  // =====================================

  const getStoreKey = (store) => {
    return [
      store.name || '',
      Number(store.latitude).toFixed(6),
      Number(store.longitude).toFixed(6)
    ].join('|')
  }

  // =====================================
  // 왼쪽 매장 목록으로 스크롤
  // =====================================

  const scrollToStore = (store) => {
    const key = getStoreKey(store)
    const element = storeListRefs.current[key]

    if (!element) {
      return
    }

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    })
  }

  // =====================================
  // 매장 마커 제거
  // =====================================

  const clearMarkers = () => {
    markerEntriesRef.current.forEach(
      ({ marker, infoWindow }) => {
        marker.setMap(null)
        infoWindow.close()
      }
    )

    markerEntriesRef.current = []
  }

  // =====================================
  // 내 위치 마커 제거
  // =====================================

  const clearUserLocationMarker = () => {
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setMap(null)
      userLocationMarkerRef.current = null
    }
  }

  // =====================================
  // 내 위치 가져오기
  // =====================================

  const getCurrentLocation = ({
    moveMap = true,
    showError = true
  } = {}) => {
    if (!mapRef.current) {
      return
    }

    if (!navigator.geolocation) {
      if (showError) {
        alert(
          '현재 사용 중인 브라우저에서는 위치 정보를 사용할 수 없습니다.'
        )
      }

      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude

        const userPosition =
          new window.naver.maps.LatLng(
            latitude,
            longitude
          )

        // 기존 내 위치 마커 제거
        clearUserLocationMarker()

        // 내 위치 마커 생성
        const userMarker =
          new window.naver.maps.Marker({
            position: userPosition,
            map: mapRef.current,
            title: '현재 위치',

            icon: {
              content: `
                <div class="user-location-marker">
                  <div class="user-location-dot"></div>
                </div>
              `,

              anchor:
                new window.naver.maps.Point(
                  12,
                  12
                )
            }
          })

        userLocationMarkerRef.current =
          userMarker

        // 지도 중심을 현재 위치로 이동
        if (moveMap) {
          mapRef.current.panTo(userPosition)
          mapRef.current.setZoom(16)
        }

        setHasUserLocation(true)
      },

      (error) => {
        console.error(
          '현재 위치를 가져오지 못했습니다.',
          error
        )

        if (!showError) {
          return
        }

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          alert(
            '위치 권한이 거부되었습니다.\n브라우저에서 위치 권한을 허용해주세요.'
          )
        } else if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          alert(
            '현재 위치를 확인할 수 없습니다.'
          )
        } else if (
          error.code ===
          error.TIMEOUT
        ) {
          alert(
            '위치 확인 시간이 초과되었습니다.'
          )
        } else {
          alert(
            '현재 위치를 가져오는 중 문제가 발생했습니다.'
          )
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // =====================================
  // 일반 매장 마커 디자인
  // =====================================

  const getNormalMarkerIcon = (selected = false) => {
    return {
      content: `
        <div class="normal-map-marker ${
          selected ? 'selected' : ''
        }">
          <span>🏪</span>
        </div>
      `,

      anchor: new window.naver.maps.Point(17, 17)
    }
  }

  // =====================================
  // 선택된 매장 마커 강조
  // =====================================

  const selectStoreMarker = (store) => {
    markerEntriesRef.current.forEach(
      ({ store: markerStore, marker }) => {
        if (markerStore.isFlowup) {
          return
        }

        const isSelected =
          markerStore.name === store.name &&
          Math.abs(
            Number(markerStore.latitude) -
              Number(store.latitude)
          ) < 0.000001 &&
          Math.abs(
            Number(markerStore.longitude) -
              Number(store.longitude)
          ) < 0.000001

        marker.setIcon(
          getNormalMarkerIcon(isSelected)
        )
      }
    )
  }

  // =====================================
  // 검색 결과로 매장 마커 생성
  // =====================================

  const createStoreMarkers = (
    normalStores,
    savedStore
  ) => {
    const map = mapRef.current

    if (!map || !window.naver?.maps) {
      return
    }

    clearMarkers()

    // =====================================
    // Flowup 매장
    // =====================================

    if (savedStore) {
      const flowupPosition =
        new window.naver.maps.LatLng(
          savedStore.latitude,
          savedStore.longitude
        )

      const flowupMarker =
        new window.naver.maps.Marker({
          position: flowupPosition,
          map,
          title: savedStore.name,

          icon: {
            content: `
              <div class="flowup-map-marker">
                ⭐
              </div>
            `,

            anchor:
              new window.naver.maps.Point(
                15,
                15
              )
          }
        })

      const flowupInfoWindow =
        new window.naver.maps.InfoWindow({
          content: `
            <div class="map-info-window">
              <strong>
                ⭐ ${savedStore.name}
              </strong>

              <p>
                ${savedStore.address || ''}
              </p>

              <span>
                Flowup 이용 매장
              </span>
            </div>
          `
        })

      window.naver.maps.Event.addListener(
        flowupMarker,
        'click',
        () => {
          const flowupStore = {
            ...savedStore,
            isFlowup: true
          }

          setSelectedStore(flowupStore)
          setSelectedFlowupStore(flowupStore)

          // 왼쪽 목록에서도 Flowup 매장 선택 위치로 이동
          setTimeout(() => {
            scrollToStore(flowupStore)
          }, 0)

          markerEntriesRef.current.forEach(
            ({ store: markerStore, marker }) => {
              if (!markerStore.isFlowup) {
                marker.setIcon(
                  getNormalMarkerIcon(false)
                )
              }
            }
          )

          markerEntriesRef.current.forEach(
            ({ infoWindow }) => {
              infoWindow.close()
            }
          )

          map.panTo(flowupPosition)
          map.setZoom(17)
        }
      )

      markerEntriesRef.current.push({
        store: {
          ...savedStore,
          isFlowup: true
        },
        marker: flowupMarker,
        infoWindow: flowupInfoWindow
      })
    }

    // =====================================
    // 일반 매장
    // =====================================

    normalStores.forEach((store) => {
      const position =
        new window.naver.maps.LatLng(
          store.latitude,
          store.longitude
        )

      const marker =
        new window.naver.maps.Marker({
          position,
          map,
          title: store.name,
          icon: getNormalMarkerIcon(false)
        })

      const infoWindow =
        new window.naver.maps.InfoWindow({
          content: `
            <div class="map-info-window">
              <strong>
                ${store.name}
              </strong>

              <p>
                ${store.address || ''}
              </p>

              ${
                store.category
                  ? `
                    <span class="normal-store-category">
                      ${store.category}
                    </span>
                  `
                  : ''
              }
            </div>
          `
        })

      window.naver.maps.Event.addListener(
        marker,
        'click',
        () => {
          // 지도에서 클릭한 매장을 현재 선택 매장으로 지정
          setSelectedStore(store)
          setSelectedFlowupStore(null)

          // 기존 선택 마커 해제 후 현재 마커 강조
          selectStoreMarker(store)

          // 기존 정보창 모두 닫기
          markerEntriesRef.current.forEach(
            ({ infoWindow: otherInfoWindow }) => {
              otherInfoWindow.close()
            }
          )

          // 현재 매장 정보창 열기
          infoWindow.open(map, marker)

          // 선택한 매장으로 지도 이동
          map.panTo(position)
          map.setZoom(17)

          // 왼쪽 목록도 같은 매장을 보여주도록 자동 스크롤
          setTimeout(() => {
            scrollToStore(store)
          }, 0)
        }
      )

      markerEntriesRef.current.push({
        store,
        marker,
        infoWindow
      })
    })
  }

  // =====================================
  // 일반 매장 검색
  // =====================================

  const searchStores = async (
    keyword,
    showAlert = true,
    moveToFirstResult = true
  ) => {
    if (!keyword.trim()) {
      if (showAlert) {
        alert('검색어를 입력해주세요.')
      }

      return
    }

    try {
      const response = await fetch(
  `/api/local-search?query=${encodeURIComponent(keyword)}`
)

      if (!response.ok) {
        throw new Error(
          `매장 검색 실패: ${response.status}`
        )
      }

      const data = await response.json()
      const savedStore = getSavedStore()

      // 검색 결과가 없는 경우
      if (
        !data.items ||
        data.items.length === 0
      ) {
        const onlyFlowupStore = savedStore
          ? [
              {
                ...savedStore,
                isFlowup: true
              }
            ]
          : []

        setStores(onlyFlowupStore)
        createStoreMarkers([], savedStore)

        if (showAlert) {
          alert('검색 결과가 없습니다.')
        }

        return
      }

      // 일반 매장 데이터 정리
      const normalStores = data.items
        .map((store) => {
          const latitude =
            Number(store.mapy) / 10000000

          const longitude =
            Number(store.mapx) / 10000000

          return {
            name: removeHtml(store.title),

            address:
              store.roadAddress ||
              store.address ||
              '',

            category:
              store.category || '',

            latitude,
            longitude,

            isFlowup: false
          }
        })
        .filter(
          (store) =>
            Number.isFinite(store.latitude) &&
            Number.isFinite(store.longitude)
        )

      // Flowup 등록 매장을 가장 위에 표시
      const result = savedStore
        ? [
            {
              ...savedStore,
              isFlowup: true
            },
            ...normalStores
          ]
        : normalStores

      setStores(result)
      setSelectedStore(null)
      setSelectedFlowupStore(null)

      // 마커 생성
      createStoreMarkers(
        normalStores,
        savedStore
      )

      // 검색 결과가 있을 때만 첫 번째 매장으로 이동
      // 현재 위치에서 시작할 때는 이 값을 false로 사용
      if (
        moveToFirstResult &&
        normalStores.length > 0 &&
        mapRef.current
      ) {
        const firstStore =
          normalStores[0]

        const firstPosition =
          new window.naver.maps.LatLng(
            firstStore.latitude,
            firstStore.longitude
          )

        mapRef.current.panTo(firstPosition)
        mapRef.current.setZoom(16)
      }
    } catch (error) {
      console.error(
        '매장 검색 중 오류:',
        error
      )

      if (showAlert) {
        alert(
          '매장 검색 중 오류가 발생했습니다.'
        )
      }
    }
  }

  // =====================================
  // 왼쪽 목록에서 매장 선택
  // =====================================

  const handleStoreClick = (store) => {
    if (
      !mapRef.current ||
      !window.naver?.maps
    ) {
      return
    }

    const latitude = Number(store.latitude)
    const longitude = Number(store.longitude)

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      console.error(
        '매장 좌표가 올바르지 않습니다.',
        store
      )

      return
    }

    const position =
      new window.naver.maps.LatLng(
        latitude,
        longitude
      )

    setSelectedStore(store)

    // 왼쪽 목록에서도 현재 선택된 매장 위치 유지
    scrollToStore(store)

    // 기존 Flowup 카드 닫기
    setSelectedFlowupStore(null)

    // 일반 매장 마커 선택 상태 반영
    if (!store.isFlowup) {
      selectStoreMarker(store)
    } else {
      // Flowup을 선택했다면 일반 매장 선택 상태 해제
      markerEntriesRef.current.forEach(
        ({ store: markerStore, marker }) => {
          if (!markerStore.isFlowup) {
            marker.setIcon(
              getNormalMarkerIcon(false)
            )
          }
        }
      )
    }

    // 지도 이동
    mapRef.current.panTo(position)
    mapRef.current.setZoom(17)

    // 모든 정보창 닫기
    markerEntriesRef.current.forEach(
      ({ infoWindow }) => {
        infoWindow.close()
      }
    )

    // 선택한 매장과 연결된 마커 찾기
    const entry =
      markerEntriesRef.current.find(
        ({ store: markerStore }) => {
          return (
            markerStore.name === store.name &&
            Math.abs(
              Number(markerStore.latitude) -
                latitude
            ) < 0.000001 &&
            Math.abs(
              Number(markerStore.longitude) -
                longitude
            ) < 0.000001
          )
        }
      )

    if (!entry) {
      console.warn(
        '선택한 매장의 마커를 찾지 못했습니다.',
        store
      )

      return
    }

    // Flowup 매장
    if (store.isFlowup) {
      setSelectedFlowupStore(store)
      return
    }

    // 일반 매장 정보창 열기
    entry.infoWindow.open(
      mapRef.current,
      entry.marker
    )
  }

  // =====================================
  // Flowup 상세 카드 닫기
  // =====================================

  const closeFlowupDetail = () => {
    setSelectedFlowupStore(null)
    setSelectedStore(null)
  }

  // =====================================
  // 검색 실행
  // =====================================

  const handleSearch = () => {
    setSelectedFlowupStore(null)
    setSelectedStore(null)

    searchStores(
      searchKeyword,
      true,
      true
    )
  }

  // =====================================
  // 지도 초기화
  // =====================================

  useEffect(() => {
    const clientId =
      import.meta.env
        .VITE_NAVER_MAP_CLIENT_ID

    if (!clientId) {
      console.error(
        '네이버 지도 Client ID가 없습니다.'
      )

      return
    }

    // 이미 네이버 지도 스크립트가 있으면
    // 다시 추가하지 않음
    const existingScript =
      document.querySelector(
        'script[data-flowup-naver-map]'
      )

    const initializeMap = () => {
      if (
        !mapElement.current ||
        !window.naver?.maps
      ) {
        return
      }

      // 이미 지도가 만들어져 있다면 종료
      if (mapRef.current) {
        return
      }

      // 기본 시작 위치
      // 위치 권한을 받기 전 잠깐 보여지는 위치
      const defaultCenter =
        new window.naver.maps.LatLng(
          37.5665,
          126.9780
        )

      const map =
        new window.naver.maps.Map(
          mapElement.current,
          {
            center: defaultCenter,
            zoom: 15
          }
        )

      mapRef.current = map
      setIsMapReady(true)

      // =====================================
      // 처음부터 현재 위치 가져오기
      // =====================================

      getCurrentLocation({
        moveMap: true,
        showError: false
      })

      // 처음에는 강남역을 검색하지 않음
      // 사용자가 직접 검색하도록 빈 목록으로 시작
      setSearchKeyword('')
      setStores([])

      // 저장된 Flowup 매장이 있다면
      // 현재 위치를 방해하지 않는 범위에서
      // 마커만 표시
      const savedStore = getSavedStore()

      if (savedStore) {
        createStoreMarkers([], savedStore)
      }
    }

    if (existingScript) {
      initializeMap()
    } else {
      const script =
        document.createElement('script')

      script.src =
        `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`

      script.async = true
      script.dataset.flowupNaverMap = 'true'

      script.onload = initializeMap

      script.onerror = () => {
        console.error(
          '네이버 지도 API를 불러오지 못했습니다.'
        )
      }

      document.head.appendChild(script)
    }

    // 컴포넌트 종료 시 정리
    return () => {
      clearMarkers()
      clearUserLocationMarker()

      // 지도 객체 참조 초기화
      mapRef.current = null
      storeListRefs.current = {}
    }
  }, [])

  // =====================================
  // 화면
  // =====================================

  return (
    <div className="map-page">

      {/* 페이지 제목 */}
      <div className="map-header">
        <h1>
          매장 찾기
        </h1>

        <p>
          주변 매장과 위치를 확인할 수
          있습니다.
        </p>
      </div>

      <div className="map-content">

        {/* =================================
            왼쪽 매장 검색 / 목록
        ================================= */}

        <aside className="map-sidebar">

          {/* 검색 */}
          <div className="map-search">

            <input
              type="text"
              value={searchKeyword}
              placeholder="매장명을 검색해주세요."
              onChange={(e) =>
                setSearchKeyword(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter'
                ) {
                  handleSearch()
                }
              }}
            />

            <button
              onClick={handleSearch}
              disabled={!isMapReady}
            >
              🔍
            </button>

          </div>

          {/* 범례 */}
          <div className="map-legend">

            <div>
              <span className="legend-flowup">
                ⭐
              </span>

              Flowup 등록 매장
            </div>

            <div>
              <span className="legend-normal">
                ●
              </span>

              일반 매장
            </div>

          </div>

          {/* 주변 매장 */}
          <div className="store-list-header">

            <strong>
              주변 매장
            </strong>

            <span>
              {stores.length}개
            </span>

          </div>

          {/* 매장 목록 */}
          <div className="store-list">

            {stores.length === 0 ? (

              <div className="empty-store">
                검색 결과가 없습니다.
              </div>

            ) : (

              stores.map(
                (store, index) => (

                  <button
                    key={`${store.name}-${index}`}
                    ref={(element) => {
                      const key = getStoreKey(store)

                      if (element) {
                        storeListRefs.current[key] = element
                      } else {
                        delete storeListRefs.current[key]
                      }
                    }}
                    className={`store-list-item ${
                      store.isFlowup
                        ? 'flowup-store'
                        : ''
                    } ${
                      selectedStore?.name ===
                        store.name &&
                      selectedStore?.latitude ===
                        store.latitude &&
                      selectedStore?.longitude ===
                        store.longitude
                        ? 'selected-store'
                        : ''
                    }`}
                    onClick={() =>
                      handleStoreClick(
                        store
                      )
                    }
                  >

                    <div className="store-list-icon">
                      {store.isFlowup
                        ? '⭐'
                        : '🏪'}
                    </div>

                    <div className="store-list-info">

                      <strong>
                        {store.name}
                      </strong>

                      <p>
                        {store.address}
                      </p>

                      {store.category && (
                        <span>
                          {store.category}
                        </span>
                      )}

                      {store.isFlowup && (
                        <em>
                          Flowup 이용 매장
                        </em>
                      )}

                    </div>

                    {selectedStore?.name === store.name &&
                      selectedStore?.latitude === store.latitude &&
                      selectedStore?.longitude === store.longitude && (
                        <span className="store-selected-check">
                          ✓
                        </span>
                      )}

                  </button>

                )
              )

            )}

          </div>

        </aside>

        {/* =================================
            지도
        ================================= */}

        <div className="map-container">

          {/* NAVER 지도 */}
          <div
            ref={mapElement}
            className="naver-map"
          />

          {/* =================================
              내 위치 버튼
          ================================= */}

          <button
            className={`my-location-button ${
              hasUserLocation
                ? 'active'
                : ''
            }`}
            onClick={() =>
              getCurrentLocation({
                moveMap: true,
                showError: true
              })
            }
            disabled={!isMapReady}
            title="현재 위치로 이동"
          >
            <span>
              📍
            </span>

            <span>
              내 위치
            </span>
          </button>

          {/* =================================
              Flowup 상세 카드
          ================================= */}

          {selectedFlowupStore && (

            <div className="flowup-detail-card">

              {/* 카드 헤더 */}
              <div className="flowup-detail-header">

                <div>

                  <span className="flowup-detail-badge">
                    ⭐ Flowup
                  </span>

                  <h2>
                    {selectedFlowupStore.name}
                  </h2>

                </div>

                <button
                  className="flowup-detail-close"
                  onClick={
                    closeFlowupDetail
                  }
                >
                  ✕
                </button>

              </div>

              {/* 주소 */}
              <div className="flowup-detail-address">

                <span>
                  📍
                </span>

                <p>
                  {selectedFlowupStore.address}
                </p>

              </div>

              {/* 구분선 */}
              <div className="flowup-detail-divider" />

              {/* 통계 */}
              <div className="flowup-detail-stats">

                {/* 오늘 방문객 */}
                <div className="flowup-stat-item">

                  <span className="flowup-stat-label">
                    오늘 방문객
                  </span>

                  <strong>
                    1,284
                    <small>
                      명
                    </small>
                  </strong>

                </div>

                {/* 현재 혼잡도 */}
                <div className="flowup-stat-item">

                  <span className="flowup-stat-label">
                    현재 혼잡도
                  </span>

                  <strong className="normal">
                    ● 보통
                  </strong>

                </div>

                {/* 센서 상태 */}
                <div className="flowup-stat-item">

                  <span className="flowup-stat-label">
                    센서 상태
                  </span>

                  <strong className="sensor-normal">
                    ● 정상
                  </strong>

                </div>

              </div>

              {/* 길찾기 */}
              <button
                className="flowup-detail-button"
                onClick={() => {

                  const address =
                    selectedFlowupStore.address

                  const naverMapUrl =
                    `https://map.naver.com/p/search/${encodeURIComponent(
                      address
                    )}`

                  window.open(
                    naverMapUrl,
                    '_blank',
                    'noopener,noreferrer'
                  )

                }}
              >
                🧭 길찾기
              </button>

            </div>

          )}

          {/* 지도 안내 */}
          <div className="map-guide">
            📍 매장을 클릭하면
            상세 위치를 확인할 수 있습니다.
          </div>

        </div>

      </div>

    </div>
  )
}

export default Map
