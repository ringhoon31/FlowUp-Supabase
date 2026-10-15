import { useState } from 'react'
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
  saveSelectedStore,
  removeStore
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

    // 기존 localStorage 매장은 유지하며 Supabase 매장 API는 별도로 제공합니다.
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

  const handleDeleteStore = (storeId) => {
    const result = removeStore(storeId)

    setStores(result.stores)
    setSelectedStoreId(result.selectedStoreId)

    if (result.stores.length === 0) {
      localStorage.removeItem('flowupStore')
      localStorage.removeItem('flowupSelectedStoreId')
    }
  }

  const handleStoreSaved = (savedStore) => {
    const nextStores = loadStores()

    setStores(nextStores)

    const savedId = saveSelectedStore(
      savedStore.id,
      nextStores
    )

    setSelectedStoreId(savedId)
    goToPage('dashboard')
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