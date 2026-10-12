const STORE_LIST_KEY = 'flowupStores'
const LEGACY_STORE_KEY = 'flowupStore'
const SELECTED_STORE_KEY = 'flowupSelectedStoreId'

function readJson(key) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch (error) {
    console.error(`${key}을(를) 읽을 수 없습니다.`, error)
    return null
  }
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }

  return `store-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function normalizeStore(store) {
  return {
    ...store,
    id: String(
      store.id ??
        `legacy-${store.name}-${store.address ?? ''}`
    )
  }
}

/**
 * flowupStores가 아직 없다면 기존 flowupStore 한 개를 이전한다.
 * flowupStores가 빈 배열로 존재하면 삭제된 상태이므로
 * flowupStore를 다시 가져오지 않는다.
 */
export function loadStores() {
  const storedList = readJson(STORE_LIST_KEY)

  if (Array.isArray(storedList)) {
    return storedList
      .filter(
        (store) =>
          store &&
          typeof store === 'object' &&
          store.name
      )
      .map(normalizeStore)
  }

  const oldStore = readJson(LEGACY_STORE_KEY)

  const migratedStores =
    oldStore &&
    typeof oldStore === 'object' &&
    oldStore.name
      ? [normalizeStore(oldStore)]
      : []

  localStorage.setItem(
    STORE_LIST_KEY,
    JSON.stringify(migratedStores)
  )

  return migratedStores
}

export function loadSelectedStoreId(stores = loadStores()) {
  const savedId =
    localStorage.getItem(SELECTED_STORE_KEY)

  if (
    savedId &&
    stores.some(
      (store) => store.id === savedId
    )
  ) {
    return savedId
  }

  return stores[0]?.id ?? ''
}

/**
 * 이전 MapView.jsx가 flowupStore를 사용하므로
 * 선택한 매장을 그 키에도 복사한다.
 */
export function saveSelectedStore(
  storeId,
  stores = loadStores()
) {
  const selected = stores.find(
    (store) => store.id === String(storeId)
  )

  if (!selected) {
    localStorage.removeItem(SELECTED_STORE_KEY)
    localStorage.removeItem(LEGACY_STORE_KEY)
    return ''
  }

  localStorage.setItem(
    SELECTED_STORE_KEY,
    selected.id
  )

  localStorage.setItem(
    LEGACY_STORE_KEY,
    JSON.stringify(selected)
  )

  return selected.id
}

export function saveStore(storeInfo, editingId = '') {
  const stores = loadStores()

  const store = {
    id: editingId || createId(),
    name: storeInfo.name.trim(),
    address: storeInfo.address.trim(),
    latitude: Number(storeInfo.latitude),
    longitude: Number(storeInfo.longitude)
  }

  const existingIndex = stores.findIndex(
    (item) => item.id === store.id
  )

  const nextStores = [...stores]

  if (existingIndex >= 0) {
    nextStores[existingIndex] = store
  } else {
    nextStores.push(store)
  }

  localStorage.setItem(
    STORE_LIST_KEY,
    JSON.stringify(nextStores)
  )

  saveSelectedStore(store.id, nextStores)

  return {
    store,
    stores: nextStores
  }
}

export function removeStore(storeId) {
  const nextStores = loadStores().filter(
    (store) =>
      store.id !== String(storeId)
  )

  localStorage.setItem(
    STORE_LIST_KEY,
    JSON.stringify(nextStores)
  )

  const previousSelectedId =
    localStorage.getItem(SELECTED_STORE_KEY)

  const nextSelectedId =
    nextStores.some(
      (store) =>
        store.id === previousSelectedId
    )
      ? previousSelectedId
      : nextStores[0]?.id ?? ''

  saveSelectedStore(
    nextSelectedId,
    nextStores
  )

  return {
    stores: nextStores,
    selectedStoreId: nextSelectedId
  }
}