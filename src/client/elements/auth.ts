declare global {
  interface WindowEventMap {
    'scola-auth': AuthEvent
  }
}

export interface AuthEvent extends CustomEvent {
  detail: null | ((error?: Error) => void)
}
