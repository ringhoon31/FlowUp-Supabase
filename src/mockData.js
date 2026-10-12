// Flowup 테스트용 가상 데이터

export const dashboardData = {
  visitorCount: 32,

  congestion: {
    status: '보통',
    description: '여유롭게 이용 가능합니다.'
  },

  sensor: {
    status: '정상',
    description: '모든 센서가 정상 작동 중입니다.'
  },

  temperature: {
    value: '24.5°C',
    description: '쾌적한 온도입니다.'
  },

  hourlyVisitors: [
    { time: '09시', count: 12 },
    { time: '11시', count: 25 },
    { time: '13시', count: 32 },
    { time: '15시', count: 22 },
    { time: '17시', count: 64 },
    { time: '19시', count: 30 },
    { time: '21시', count: 45 }
  ],

  weeklyVisitors: [
    { day: '월', count: 70 },
    { day: '화', count: 42 },
    { day: '수', count: 45 },
    { day: '목', count: 40 },
    { day: '금', count: 58 },
    { day: '토', count: 72 },
    { day: '일', count: 65 }
  ],

  congestionAnalysis: {
    busy: {
      time: '18:00 ~ 20:00',
      average: 87
    },

    quiet: {
      time: '13:00 ~ 15:00',
      average: 22
    }
  },

  visitorRatio: {
    entry: 65,
    exit: 35
  },

  extraInfo: {
    weather: {
      status: '맑음',
      temperature: '28°C / 18°C'
    },

    notification: '현재 특이사항이 없습니다.'
  }
}


// 방문 통계 테스트용 데이터
export const statsData = {
  periods: {
    오늘: {
      total: '324명',
      average: '46명',
      max: '87명',
      maxTime: '19:00 기준',
      increase: '▲ 12% 증가'
    },

    '이번 주': {
      total: '1,842명',
      average: '263명',
      max: '102명',
      maxTime: '19:00 기준',
      increase: '▲ 8% 증가'
    },

    '이번 달': {
      total: '7,528명',
      average: '251명',
      max: '118명',
      maxTime: '18:00 기준',
      increase: '▲ 15% 증가'
    }
  },

  hourlyVisitors: dashboardData.hourlyVisitors,

  congestionAnalysis: dashboardData.congestionAnalysis,

  weeklyVisitors: dashboardData.weeklyVisitors
}

export const analysisData = {
  summary: {
    averageVisitors: '46명',
    busiestTime: dashboardData.congestionAnalysis.busy.time,
    quietestTime: dashboardData.congestionAnalysis.quiet.time
  },

  hourlyVisitors: [
    { time: '09시', count: 25 },
    { time: '11시', count: 35 },
    { time: '13시', count: 22 },
    { time: '15시', count: 40 },
    { time: '17시', count: 65 },
    { time: '19시', count: 87 },
    { time: '21시', count: 58 }
  ],

  weeklyVisitors: dashboardData.weeklyVisitors,

  results: [
    {
      icon: '🔥',
      title: '저녁 시간대에 방문객 집중',
      description:
        '18시부터 20시 사이에 방문객이 가장 많이 발생하는 것으로 나타났습니다.'
    },

    {
      icon: '📅',
      title: '주말 방문객 증가',
      description:
        '평일보다 토요일과 일요일의 평균 방문객이 높은 것으로 나타났습니다.'
    },

    {
      icon: '🌿',
      title: '오후 시간대 비교적 한산',
      description:
        '13시부터 15시 사이에는 상대적으로 방문객이 적은 것으로 나타났습니다.'
    }
  ]
}

export const seoulRealtime = {
  areaName: '강남역',
  congestionLevel: '보통',
  congestionMessage: '사람이 몰리고 있으나 혼잡하지 않습니다.',
  populationMin: 8000,
  populationMax: 8500,
  updatedAt: '09:40'
}



