import { supabase } from './supabase'

export interface UploadedFile {
  id: string
  name: string
  type: string // 'csv' | 'image' | 'video'
  size: number
  storage_path: string
  url: string
  uploaded_at: string
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  userId: string,
  sessionId: string
): Promise<UploadedFile> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${sessionId}/${Date.now()}.${fileExt}`
  const filePath = `budget-uploads/${fileName}`

  const { data, error } = await supabase.storage
    .from('budget-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Upload error:', error)
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('budget-files')
    .getPublicUrl(filePath)

  // Determine file type
  let fileType: 'csv' | 'image' | 'video' = 'image'
  if (file.type.includes('csv') || file.name.endsWith('.csv')) {
    fileType = 'csv'
  } else if (file.type.includes('video')) {
    fileType = 'video'
  }

  return {
    id: crypto.randomUUID(),
    name: file.name,
    type: fileType,
    size: file.size,
    storage_path: data.path,
    url: urlData.publicUrl,
    uploaded_at: new Date().toISOString(),
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  userId: string,
  sessionId: string,
  onProgress?: (progress: number, fileName: string) => void
): Promise<UploadedFile[]> {
  const uploadedFiles: UploadedFile[] = []
  const total = files.length

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    if (onProgress) {
      onProgress(((i + 1) / total) * 100, file.name)
    }

    try {
      const uploaded = await uploadFile(file, userId, sessionId)
      uploadedFiles.push(uploaded)
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error)
      // Continue with other files
    }
  }

  return uploadedFiles
}

/**
 * Delete file from storage
 */
export async function deleteFile(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('budget-files')
    .remove([storagePath])

  if (error) {
    console.error('Delete error:', error)
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * Delete multiple files
 */
export async function deleteMultipleFiles(storagePaths: string[]): Promise<void> {
  const { error } = await supabase.storage
    .from('budget-files')
    .remove(storagePaths)

  if (error) {
    console.error('Delete error:', error)
    throw new Error(`Failed to delete files: ${error.message}`)
  }
}

/**
 * Parse CSV file
 */
export async function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length === 0) {
          reject(new Error('Empty CSV file'))
          return
        }

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim())
        
        // Parse data rows
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim())
          const row: any = {}
          
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })
          
          return row
        })

        resolve(data)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read CSV file'))
    }

    reader.readAsText(file)
  })
}

/**
 * Get file type category
 */
export function getFileTypeCategory(file: File): 'csv' | 'image' | 'video' | 'unknown' {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()

  if (type.includes('csv') || name.endsWith('.csv')) {
    return 'csv'
  }
  if (type.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/.test(name)) {
    return 'image'
  }
  if (type.includes('video') || /\.(mp4|mov|avi|webm)$/.test(name)) {
    return 'video'
  }

  return 'unknown'
}

/**
 * Validate file
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Max 50MB per file
  const MAX_FILE_SIZE = 50 * 1024 * 1024
  
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File "${file.name}" is too large. Maximum size is 50MB.`
    }
  }

  const category = getFileTypeCategory(file)
  if (category === 'unknown') {
    return {
      valid: false,
      error: `File "${file.name}" has unsupported format. Please upload CSV, image, or video files.`
    }
  }

  return { valid: true }
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
