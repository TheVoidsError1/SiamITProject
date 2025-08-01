import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utility function to construct proper image URLs
 * @param imageName - The image name or path from the database
 * @param apiBaseUrl - The API base URL
 * @returns Properly formatted image URL
 */
export function getImageUrl(imageName: string, apiBaseUrl: string): string {
  if (!imageName) return '';
  
  // If imageName starts with /, it's already a path, just combine with API_BASE_URL
  if (imageName.startsWith('/')) {
    return `${apiBaseUrl}${imageName}`;
  }
  
  // If imageName doesn't start with /, assume it's just a filename
  return `${apiBaseUrl}/uploads/announcements/${imageName}`;
}

/**
 * Utility function to handle image loading errors with fallback paths
 * @param e - The error event
 * @param imageName - The image name or path
 * @param apiBaseUrl - The API base URL
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, imageName: string, apiBaseUrl: string): void {
  const target = e.target as HTMLImageElement;
  console.error('Image load error for:', imageName);
  console.error('Current URL:', target.src);
  console.error('API_BASE_URL:', apiBaseUrl);
  
  // Try alternative paths
  const possiblePaths = [
    // If imageName starts with /, use API_BASE_URL + imageName
    imageName.startsWith('/') ? `${apiBaseUrl}${imageName}` : `${apiBaseUrl}/uploads/announcements/${imageName}`,
    // Try other possible paths
    `${apiBaseUrl}/uploads/${imageName}`,
    `${apiBaseUrl}/public/uploads/announcements/${imageName}`,
    `${apiBaseUrl}/public/uploads/${imageName}`,
    // Try relative paths
    imageName.startsWith('/') ? imageName : `/uploads/announcements/${imageName}`,
    `/uploads/${imageName}`,
    `/public/uploads/announcements/${imageName}`,
    `/public/uploads/${imageName}`
  ];
  
  const currentIndex = possiblePaths.findIndex(path => target.src.includes(path));
  const nextIndex = currentIndex + 1;
  
  if (nextIndex < possiblePaths.length) {
    console.log('Trying next path:', possiblePaths[nextIndex]);
    target.src = possiblePaths[nextIndex];
  } else {
    console.log('All paths failed, using placeholder');
    target.src = '/placeholder.svg';
  }
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
