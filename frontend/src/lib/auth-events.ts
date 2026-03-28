export const BLUEMOON_AUTH_CHANGED = "bluemoon-auth-changed";

export function notifyAuthChanged(): void {
  window.dispatchEvent(new Event(BLUEMOON_AUTH_CHANGED));
}
