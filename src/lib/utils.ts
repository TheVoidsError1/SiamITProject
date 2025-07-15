import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function fetchWithAuth(input: RequestInfo, init?: RequestInit, _logoutFn?: () => void, toastFn?: () => void) {
  const token = localStorage.getItem("token");
  const headers = {
    ...(init?.headers || {}),
    Authorization: token ? `Bearer ${token}` : undefined,
  };
  const response = await fetch(input, { ...init, headers });
  if (response.status === 401) {
    if (toastFn) toastFn();
    return null;
  }
  return response;
}
