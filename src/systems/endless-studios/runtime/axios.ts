// axios 0.21 bundles its whole package.json, whose `dist/axios.min.js`
// paths the build's file check reads as missing files; and the preview
// never reaches S3 anyway. This stand-in covers what the copied upload
// code uses: a cancel token and a POST that reports progress, then
// answers 204 as S3 does.
interface Canceled {
  __CANCEL__: true
  message?: string
}

interface CancelToken {
  reason?: Canceled
  promise: Promise<Canceled>
}

interface RequestConfig {
  onUploadProgress?: (event: { loaded: number; total: number }) => void
  cancelToken?: CancelToken
}

function source() {
  let cancel!: (message?: string) => void
  const token: CancelToken = {
    promise: new Promise<Canceled>((resolve) => {
      cancel = (message) => {
        if (token.reason) return
        token.reason = { __CANCEL__: true, message }
        resolve(token.reason)
      }
    }),
  }
  return { token, cancel }
}

const isCancel = (value: unknown) =>
  (value as Canceled | undefined)?.__CANCEL__ === true

function request(status: number, config: RequestConfig = {}) {
  return new Promise<{ status: number; data: unknown }>((resolve, reject) => {
    const total = 100
    let loaded = 0
    const timer = setInterval(() => {
      loaded = Math.min(total, loaded + 20)
      config.onUploadProgress?.({ loaded, total })
      if (loaded === total) {
        clearInterval(timer)
        resolve({ status, data: '' })
      }
    }, 150)
    config.cancelToken?.promise.then((reason) => {
      clearInterval(timer)
      reject(reason)
    })
  })
}

const axios = {
  CancelToken: { source },
  isCancel,
  post: (_url: string, _data?: unknown, config?: RequestConfig) =>
    request(204, config),
  put: (_url: string, _data?: unknown, config?: RequestConfig) =>
    request(200, config),
  get: (_url: string, config?: RequestConfig) => request(200, config),
}

export { isCancel }
export default axios
