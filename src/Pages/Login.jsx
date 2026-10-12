import { useState } from 'react'
import '../styles/login.css'

function Login({ onLogin, onBack }) {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()

    // 기존 임시 관리자 계정 유지
    if (id === 'admin' && password === 'flowup1234') {
      setError('')
      onLogin({
        userId: 'admin',
        userName: '관리자'
      })
      return
    }

    setError('아이디 또는 비밀번호가 올바르지 않습니다.')
  }

  return (
    <div className="flow-login-page">
      <header className="flow-login-header">
        <div className="flow-login-brand">
          <span className="flow-login-brand-icon" aria-hidden="true">
            🏪
          </span>
          <span>flowup</span>
        </div>

        <button
          type="button"
          className="flow-login-back"
          onClick={onBack}
        >
          ← 메인으로
        </button>
      </header>

      <main className="flow-login-content">
        <section className="flow-login-card">
          <div className="flow-login-eyebrow">
            FLOWUP ADMIN
          </div>

          <h1>매장 관리자 로그인</h1>
          <p className="flow-login-description">
            계정 정보를 입력해 주세요.
          </p>

          <form onSubmit={handleLogin}>
            <div className="flow-login-field">
              <label htmlFor="flow-login-id">아이디</label>
              <input
                id="flow-login-id"
                type="text"
                placeholder="아이디를 입력해 주세요."
                value={id}
                onChange={(e) => {
                  setId(e.target.value)
                  if (error) setError('')
                }}
                autoComplete="username"
              />
            </div>

            <div className="flow-login-field">
              <label htmlFor="flow-login-password">
                비밀번호
              </label>
              <input
                id="flow-login-password"
                type="password"
                placeholder="비밀번호를 입력해 주세요."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError('')
                }}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="flow-login-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="flow-login-submit"
            >
              로그인 <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="flow-login-test-account">
            테스트 계정&nbsp; admin / flowup1234
          </div>
        </section>
      </main>
    </div>
  )
}

export default Login
