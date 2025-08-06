import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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

/**
 * Utility function to format date with localization
 * @param dateStr - The date string to format
 * @param language - The language code ('th' or 'en')
 * @param showTime - Whether to show time
 * @returns Formatted date string
 */
export function formatDate(dateStr: string, language: string, showTime: boolean = false): string {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(showTime && {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
    return date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateStr;
  }
}

/**
 * Utility function to format date only (without time)
 * @param dateStr - The date string to format
 * @param language - The language code ('th' or 'en')
 * @returns Formatted date string
 */
export function formatDateOnly(dateStr: string, language: string): string {
  return formatDate(dateStr, language, false);
}

/**
 * Utility function to format date with localization and time
 * @param dateStr - The date string to format
 * @param language - The language code ('th' or 'en')
 * @param showTime - Whether to show time
 * @returns Formatted date string
 */
export function formatDateLocalized(dateStr: string, language: string, showTime: boolean = false): string {
  return formatDate(dateStr, language, showTime);
}

/**
 * Utility function to handle image click for preview
 * @param file - The image file to preview
 * @param setPreviewImage - Function to set preview image state
 * @param setImageDialogOpen - Function to set dialog open state
 */
export function handleImageClick(
  file: File,
  setPreviewImage: (preview: { url: string; name: string } | null) => void,
  setImageDialogOpen: (open: boolean) => void
): void {
  const url = URL.createObjectURL(file);
  setPreviewImage({ url, name: file.name });
  setImageDialogOpen(true);
}

/**
 * Utility function to handle file selection
 * @param e - The file input change event
 * @param setFile - Function to set selected file
 * @param setPreview - Function to set preview URL
 */
export function handleFileSelect(
  e: React.ChangeEvent<HTMLInputElement>,
  setFile: (file: File | null) => void,
  setPreview: (url: string | null) => void
): void {
  const file = e.target.files?.[0];
  if (file) {
    setFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
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
