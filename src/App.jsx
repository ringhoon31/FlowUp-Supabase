import { useEffect, useState } from 'react'
import './App.css'

import Home from './Pages/Home'
import Dashboard from './Pages/Dashboard'
import VisitStats from './Pages/VisitStats'
import DataAnalysis from './Pages/DataAnalysis'
import Settings from './Pages/Settings'
import Map from './Pages/Map'
import Login from './Pages/Login'
import StoreRegister from './Pages/StoreRegister'

import { dashboardData } from './mockData'

import {
  loadStores,
  loadSelectedStoreId,
  saveSelectedStore
} from './storeStorage'

function App() {
  const [visitorCount, setVisitorCount] = useState(
    dashboardData.visitorCount
  )

  const [currentPage, setCurrentPage] = useState(
    'home'
  )

  const [theme, setTheme] = useState(
  localStorage.getItem('flowupTheme') || 'dark'
)

const changeTheme = (nextTheme) => {
  setTheme(nextTheme)
  localStorage.setItem('flowupTheme', nextTheme)
}

  const [isLoggedIn, setIsLoggedIn] = useState(
    false
  )

  const [currentUser, setCurrentUser] = useState(null)

  const [stores, setStores] = useState(
    loadStores
  )

  const [selectedStoreId, setSelectedStoreId] =
    useState(() =>
      loadSelectedStoreId(loadStores())
    )

  const selectedStore =
    stores.find(
      (store) =>
        store.id === selectedStoreId
    ) ?? null

  const apiBase = (import.meta.env.VITE_VISITOR_API_URL || '').replace(/\/$/, '')

  // Supabase is the source of truth. Keep a local copy only for legacy map markers.
  const refreshStores = async (preferredId = '') => {
    const response = await fetch(`${apiBase}/api/stores`, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`매장 목록 조회 실패 (HTTP ${response.status})`)
    }
    const result = await response.json()
    if (!Array.isArray(result)) {
      throw new Error('매장 목록 응답 형식이 올바르지 않습니다.')
    }
    const remoteStores = result.map((store) => ({
      ...store,
      id: String(store.id)
    }))
    localStorage.setItem('flowupStores', JSON.stringify(remoteStores))
    setStores(remoteStores)

    const chosen = preferredId && remoteStores.some((store) => store.id === String(preferredId))
      ? String(preferredId)
      : loadSelectedStoreId(remoteStores)
    setSelectedStoreId(saveSelectedStore(chosen, remoteStores))
    return remoteStores
  }

  // Read stores from DB once an administrator opens the web app.
  useEffect(() => {
    if (!isLoggedIn) return
    refreshStores().catch((error) => {
      console.error('Supabase 매장 목록 불러오기 실패:', error)
      alert('매장 목록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.')
    })
  }, [isLoggedIn])

  const goToPage = (page) => {
    const adminPages = [
      'dashboard',
      'stats',
      'analysis',
      'store',
      'settings'
    ]

    // 로그인한 상태에서 로그인 메뉴를 누르면 대시보드
    if (page === 'login' && isLoggedIn) {
      setCurrentPage('dashboard')

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })

      return
    }

    // 로그인하지 않았다면 관리자 페이지 대신 로그인
    if (
      adminPages.includes(page) &&
      !isLoggedIn
    ) {
      setCurrentPage('login')

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })

      return
    }

    setCurrentPage(page)

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const handleLogin = (user = {}) => {
    const loginUser = {
      userId: user.userId ?? 'admin',
      userName: user.userName ?? '관리자'
    }

    setCurrentUser(loginUser)
    setIsLoggedIn(true)

    localStorage.setItem(
      'flowupUserId',
      String(loginUser.userId)
    )

    localStorage.setItem(
      'flowupUserName',
      loginUser.userName
    )

    // 화면은 캐시에서 즉시 복원하고, 로그인 직후 Supabase 목록으로 갱신합니다.
    const localStores = loadStores()

    setStores(localStores)

    const savedId = loadSelectedStoreId(localStores)
    const selectedId = saveSelectedStore(
      savedId,
      localStores
    )

    setSelectedStoreId(selectedId)

    setCurrentPage('dashboard')

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentUser(null)
    localStorage.removeItem('flowupUserId')
    localStorage.removeItem('flowupUserName')
    setCurrentPage('home')

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const handleSelectStore = (storeId) => {
    const savedId = saveSelectedStore(
      storeId,
      stores
    )

    setSelectedStoreId(savedId)
  }

  const handleDeleteStore = async (storeId, adminPassword) => {
    const response = await fetch(`${apiBase}/api/stores/${encodeURIComponent(storeId)}`, {
      method: 'DELETE',
      headers: { 'X-Flowup-Store-Admin-Password': adminPassword || '' }
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `매장 삭제 실패 (HTTP ${response.status})`)
    }
    // The DB deleted the row. Reload rather than mutating localStorage only.
    try {
      await refreshStores(selectedStoreId === String(storeId) ? '' : selectedStoreId)
    } catch (error) {
      // Keep UI in sync even when the secondary GET fails.
      const nextStores = stores.filter((store) => store.id !== String(storeId))
      localStorage.setItem('flowupStores', JSON.stringify(nextStores))
      setStores(nextStores)
      setSelectedStoreId(saveSelectedStore(loadSelectedStoreId(nextStores), nextStores))
      console.warn('삭제 후 매장 목록 재조회 실패:', error)
    }
  }

  const handleStoreSaved = async (savedStore) => {
    try {
      await refreshStores(savedStore.id)
      goToPage('dashboard')
    } catch (error) {
      console.warn('매장 저장 후 목록 재조회 실패:', error)
      alert('매장 저장은 성공했지만 목록 조회가 실패했습니다. 새로고침해 주세요.')
      // DB write succeeded, still update local view immediately.
      const store = { ...savedStore, id: String(savedStore.id) }
      const nextStores = [...stores.filter((item) => item.id !== store.id), store]
      localStorage.setItem('flowupStores', JSON.stringify(nextStores))
      setStores(nextStores)
      setSelectedStoreId(saveSelectedStore(store.id, nextStores))
      goToPage('dashboard')
    }
  }

return (
  <div className={`app flowup-theme-${theme}`}>
      {/* 홈, 지도, 로그인은 각각 자체 상단바 사용 */}
      {currentPage !== 'home' &&
        currentPage !== 'map' &&
        currentPage !== 'login' && (
          <header className="topbar">
            <div
              className="logo"
              onClick={() =>
                goToPage('home')
              }
            >
              <div className="logo-icon">
                🏪
              </div>

              <div>
                <h2>flowup</h2>
                <p>
                  매장 방문객 분석 시스템
                </p>
              </div>
            </div>

            <nav className="top-menu">
              <div
                className={`top-menu-item ${
                  currentPage === 'map'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  goToPage('map')
                }
              >
                지도
              </div>

              {isLoggedIn && (
                <>
                  <div
                    className={`top-menu-item ${
                      currentPage ===
                      'dashboard'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      goToPage(
                        'dashboard'
                      )
                    }
                  >
                    대시보드
                  </div>

                  <div
                    className={`top-menu-item ${
                      currentPage ===
                      'stats'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      goToPage('stats')
                    }
                  >
                    방문 통계
                  </div>

                  <div
                    className={`top-menu-item ${
                      currentPage ===
                      'analysis'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      goToPage(
                        'analysis'
                      )
                    }
                  >
                    데이터 분석
                  </div>

                  <div
                    className={`top-menu-item ${
                      currentPage ===
                      'store'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      goToPage('store')
                    }
                  >
                    매장 등록
                  </div>

                  <div
                    className={`top-menu-item ${
                      currentPage ===
                      'settings'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      goToPage(
                        'settings'
                      )
                    }
                  >
                    설정
                  </div>
                </>
              )}

              {!isLoggedIn ? (
                <div
                  className="top-menu-item login-menu"
                  onClick={() =>
                    goToPage('login')
                  }
                >
                  관리자 로그인
                </div>
              ) : (
                <div
                  className="top-menu-item logout-menu"
                  onClick={
                    handleLogout
                  }
                >
                  로그아웃
                </div>
              )}
            </nav>
          </header>
        )}

      <main className="main">
        {currentPage === 'home' && (
          <Home
            onFindStore={() =>
              goToPage('map')
            }
            onAdminLogin={() =>
              goToPage('login')
            }
          />
        )}

        {currentPage === 'map' && (
          <Map
            onBack={() =>
              goToPage('home')
            }
          />
        )}

        {currentPage === 'login' &&
          !isLoggedIn && (
            <Login
              onLogin={handleLogin}
              onBack={() =>
                goToPage('home')
              }
            />
          )}

        {currentPage ===
          'dashboard' &&
          isLoggedIn && (
            <Dashboard
              visitorCount={
                visitorCount
              }
              setCurrentPage={
                goToPage
              }
              stores={stores}
              selectedStore={
                selectedStore
              }
              onSelectStore={
                handleSelectStore
              }
              onDeleteStore={
                handleDeleteStore
              }
            />
          )}

        {currentPage ===
          'stats' &&
          isLoggedIn && (
            <VisitStats
              selectedStore={
                selectedStore
              }
            />
          )}

        {currentPage ===
          'analysis' &&
          isLoggedIn && (
            <DataAnalysis
              selectedStore={
                selectedStore
              }
            />
          )}

        {currentPage ===
          'store' &&
          isLoggedIn && (
            <StoreRegister
              stores={stores}
              selectedStore={
                selectedStore
              }
              onSaved={
                handleStoreSaved
              }
            />
          )}

      {currentPage ===
  'settings' &&
  isLoggedIn && (
    <Settings
      selectedStore={
        selectedStore
      }
      theme={theme}
      onChangeTheme={changeTheme}
    />
  )}
      </main>
    </div>
  )
}

export default App