import { API } from '@common/domain/services/api'

export interface PlaygroundResource {
  methods: string[]
  destructive: string[]
}
export interface PlaygroundSystem {
  label: string
  configured: boolean
  mock: boolean
  resources: Record<string, PlaygroundResource>
}
export interface PlaygroundStatus {
  vendus: { mode: string; baseUrl: string; registerId: number | null }
  systems: Record<string, PlaygroundSystem>
}

export interface RunPayload {
  system: string
  resource: string
  action: string
  args: unknown[]
}

export default {
  status: () => API.get<PlaygroundStatus>('/api/v1/playground/status'),
  run: (payload: RunPayload) => API.post('/api/v1/playground/run', payload),
}
