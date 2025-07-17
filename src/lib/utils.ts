import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function fetchWithAuth(input: RequestInfo, init?: RequestInit, logoutFn?: () => void, sessionExpiredFn?: () => void) {
  const token = localStorage.getItem("token");
  const headers = {
    ...(init?.headers || {}),
    Authorization: token ? `Bearer ${token}` : undefined,
  };
  const response = await fetch(input, { ...init, headers });
  if (response.status === 401) {
    if (sessionExpiredFn) {
      sessionExpiredFn();
    } else if (logoutFn) {
      logoutFn();
    }
    return null;
  }
  return response;
}
