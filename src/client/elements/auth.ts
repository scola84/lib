declare global {
  interface WindowEventMap {
    'scola-auth': AuthEvent
  }
}

export interface AuthEvent extends CustomEvent {
  detail: {
    callback: ((error?: Error) => void)
  } | null
}
