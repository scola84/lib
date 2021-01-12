declare global {
  interface WindowEventMap {
    'scola-auth': AuthEvent
  }
}

export interface AuthEvent extends CustomEvent {
  detail: ((error?: Error) => void) | null
}
