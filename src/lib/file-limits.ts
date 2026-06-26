"use client"

const MAX_FREE_SIZE = 500 * 1024 * 1024
const MAX_PREMIUM_SIZE = 4 * 1024 * 1024 * 1024

export function getMaxFileSize(isPremium: boolean): number {
  return isPremium ? MAX_PREMIUM_SIZE : MAX_FREE_SIZE
}

export function getMaxFileSizeMB(isPremium: boolean): number {
  return isPremium ? 4096 : 500
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function validateFileSize(file: File, isPremium: boolean): { valid: boolean; error?: string } {
  const maxSize = getMaxFileSize(isPremium)
  if (file.size > maxSize) {
    const maxMB = getMaxFileSizeMB(isPremium)
    return {
      valid: false,
      error: `File "${file.name}" is ${formatFileSize(file.size)}. Maximum allowed is ${maxMB} MB${isPremium ? "" : ". Upgrade to Premium for 4 GB limit"}.`,
    }
  }
  return { valid: true }
}

export function validateAllFiles(files: File[], isPremium: boolean): { valid: boolean; error?: string } {
  for (const file of files) {
    const result = validateFileSize(file, isPremium)
    if (!result.valid) return result
  }
  return { valid: true }
}
