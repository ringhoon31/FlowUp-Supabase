// FlowUp 방문 데이터 공통 정리
// FLOWUP_VISITOR_LOGS에는 센서의 누적 IN/OUT 값이 저장되므로
// 이전 기록과 비교하여 실제 증가량(deltaIn/deltaOut)을 계산한다.
export function normalizeVisitorHistory(result) {
  if (!Array.isArray(result)) return []

  const rows = result
    .map((item, index) => {
      const createdAt = item?.createdAt ?? item?.created_at ?? item?.time
      const date = createdAt ? new Date(createdAt) : null

      return {
        ...item,
        _sourceIndex: index,
        logId: Number(item?.logId ?? item?.log_id ?? 0) || 0,
        deviceId: item?.deviceId ?? item?.device_id ?? '',
        eventType: String(item?.eventType ?? item?.event_type ?? '').toUpperCase(),
        inCount: Number(item?.inCount ?? item?.in_count ?? 0) || 0,
        outCount: Number(item?.outCount ?? item?.out_count ?? 0) || 0,
        peopleNow: Number(item?.peopleNow ?? item?.people_now ?? 0) || 0,
        createdAt,
        date: date && !Number.isNaN(date.getTime()) ? date : null
      }
    })
    .filter((item) => item.date)
    .sort((a, b) => {
      const time = a.date.getTime() - b.date.getTime()
      if (time !== 0) return time
      return a.logId - b.logId
    })

  const previousByDevice = new Map()

  return rows.map((item) => {
    const key = item.deviceId || '__default__'
    const previous = previousByDevice.get(key)

    const deltaIn = previous
      ? item.inCount >= previous.inCount
        ? item.inCount - previous.inCount
        : item.inCount
      : item.inCount

    const deltaOut = previous
      ? item.outCount >= previous.outCount
        ? item.outCount - previous.outCount
        : item.outCount
      : item.outCount

    previousByDevice.set(key, {
      inCount: item.inCount,
      outCount: item.outCount
    })

    return {
      ...item,
      deltaIn: Math.max(0, deltaIn),
      deltaOut: Math.max(0, deltaOut)
    }
  })
}
