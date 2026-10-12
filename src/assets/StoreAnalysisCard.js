import React, { useState } from 'react';

export default function StoreAnalysisCard() {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      // .NET 8 백엔드 API 호출 (로컬 포트 5000 또는 5001/5100 등 본인 포트에 맞게 변경)
      const response = await fetch('http://localhost:5000/api/CommercialAnalysis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: "서울특별시 강남구 테헤란로 123",
          sensorFootTraffic: 1420,
          sensorNoiseLevel: 65.4,
          nearbyStoreCount: 28,
          mainAgeGroup: "20대~30대 직장인"
        })
      });

      if (!response.ok) {
        throw new Error("서버 응답 오류");
      }

      const data = await response.json();
      setAnalysisData(data);
    } catch (error) {
      console.error("상권 분석 실패:", error);
      alert("분석 요청 중 오류가 발생했습니다. 백엔드 서버 및 API 키를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '20px auto', border: '1px solid #e0e0e0', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backgroundColor: '#fff' }}>
      <h2 style={{ marginTop: 0 }}>📊 AI 상권 분석 리포트</h2>
      
      <button 
        onClick={handleRunAnalysis} 
        disabled={loading}
        style={{ padding: '12px 24px', backgroundColor: loading ? '#ccc' : '#007bff', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold' }}
      >
        {loading ? "Gemini 분석 진행 중..." : "현재 위치 AI 분석 실행"}
      </button>

      {analysisData && (
        <div style={{ marginTop: '24px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#2b8a3e' }}>
              {analysisData.score}점
            </div>
            <span style={{ padding: '6px 16px', background: '#e6fcf5', color: '#0ca678', borderRadius: '20px', fontWeight: 'bold', fontSize: '18px' }}>
              {analysisData.grade} 등급
            </span>
          </div>

          <h4>📌 핵심 요약</h4>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
            {analysisData.summary?.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: '20px', margin: '20px 0', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#2b8a3e' }}>🟢 추천 업종</strong>
              <div style={{ marginTop: '8px' }}>
                {analysisData.recommendedTypes?.map((type, idx) => (
                  <span key={idx} style={{ display: 'inline-block', marginRight: '6px', marginBottom: '6px', padding: '4px 8px', background: '#e7f5ff', color: '#1c7ed6', borderRadius: '4px', fontSize: '14px' }}>#{type}</span>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#e03131' }}>🔴 비추천 업종</strong>
              <div style={{ marginTop: '8px' }}>
                {analysisData.notRecommendedTypes?.map((type, idx) => (
                  <span key={idx} style={{ display: 'inline-block', marginRight: '6px', marginBottom: '6px', padding: '4px 8px', background: '#ffe3e3', color: '#e03131', borderRadius: '4px', fontSize: '14px' }}>#{type}</span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '16px' }}>
            <p><strong>💪 주요 강점:</strong> {analysisData.strengths?.join(', ')}</p>
            <p style={{ color: '#d9480f', marginBottom: 0 }}><strong>⚠️ 주의 요인:</strong> {analysisData.risks?.join(', ')}</p>
          </div>
        </div>
      )}
    </div>
  );
}