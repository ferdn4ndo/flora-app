export type LoginResponse = {
  access_token: string
  access_token_exp: string
  refresh_token: string
  refresh_token_exp: string
}

export type MeResponse = {
  userver: {
    uuid: string
    username: string
    is_admin: boolean
  }
  hiveUser: {
    id: string
    authUuid: string
    username: string
    systemName: string
    updatedAt: string
  }
}

export type EnvironmentRow = {
  id: string
  name: string
  path: string
  description: string | null
  createdAt: string
  updatedAt: string
  role?: string
}

/** Catalog device from Hive `GET .../environments/:id/devices`. */
export type DeviceRow = {
  id: string
  path: string
  environmentId: string
  parentDeviceId: string | null
  deviceType: string
  deviceId: string
  displayName: string | null
  createdAt: string
  updatedAt: string
}

/** Entry from Hive `GET /v1/mqtt/devices?include_offline=true`. */
export type MqttLiveDevice = {
  id: string
  connected: boolean
  lastSeenAt: string
  lastTopic: string
  identity?: { deviceRowId: string }
}
