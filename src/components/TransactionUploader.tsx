import { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Textarea } from './ui/textarea'
import { Progress } from './ui/progress'
import { toast } from 'sonner'
import { openai } from '../lib/openai'
import {
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  X,
  Loader2,
  Check,
} from 'lucide-react'

interface Transaction {
  item: string
  amount: number
  category: string
  date?: string
}

interface TransactionUploaderProps {
  onTransactionsProcessed: (transactions: Transaction[]) => void
}

export function TransactionUploader({
  onTransactionsProcessed,
}: TransactionUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'text/csv']
    if (!validTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, MP4, atau CSV')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 10MB')
      return
    }

    setSelectedFile(file)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Pilih file terlebih dahulu')
      return
    }

    setUploading(true)
    setProgress(10)

    try {
      const isImage = selectedFile.type.startsWith('image/')
      const isCSV = selectedFile.type === 'text/csv'

      let transactions: Transaction[] = []

      if (isCSV) {
        // Parse CSV
        setProgress(30)
        const text = await selectedFile.text()
        const lines = text.split('\n').slice(1) // Skip header

        for (const line of lines) {
          const parts = line.split(',').map((s) => s.trim())
          if (parts.length >= 2) {
            transactions.push({
              item: parts[0],
              amount: parseFloat(parts[1].replace(/[^0-9.-]/g, '')),
              category: parts[2] || 'Lain-lain',
              date: parts[3] || new Date().toISOString(),
            })
          }
        }
        setProgress(100)
      } else if (isImage) {
        // Convert to base64
        setProgress(30)
        const reader = new FileReader()

        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(selectedFile)
        })

        setProgress(50)

        // Call OpenAI Vision API
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `Kamu adalah AI assistant yang expert dalam membaca struk belanja. 
Tugasmu adalah menganalisis gambar struk dan mengekstrak semua transaksi.
Return hasil dalam format JSON array dengan struktur:
[{"item": "nama_item", "amount": jumlah_angka, "category": "kategori"}]

Kategori yang tersedia:
- Makanan
- Minuman  
- Transportasi
- Belanja
- Hiburan
- Kesehatan
- Pendidikan
- Tagihan
- Lain-lain

Pastikan amount dalam format number tanpa mata uang.`,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analisis struk ini dan ekstrak semua transaksi dalam format JSON',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: base64,
                  },
                },
              ],
            },
          ],
          max_tokens: 1000,
          temperature: 0.1,
        })

        setProgress(90)

        const content = response.choices[0]?.message?.content || '[]'

        // Extract JSON from response
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          transactions = JSON.parse(jsonMatch[0])
        }

        setProgress(100)
      }

      if (transactions.length > 0) {
        onTransactionsProcessed(transactions)
        toast.success(`${transactions.length} transaksi berhasil dianalisis!`)

        // Reset form
        setSelectedFile(null)
        setPreviewUrl(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        toast.error('Tidak ada transaksi yang ditemukan')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Terjadi kesalahan saat upload')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      toast.error('Masukkan data transaksi')
      return
    }

    try {
      // Parse manual input
      // Format expected: "Item, Amount, Category" per line
      const lines = manualInput.trim().split('\n')
      const transactions: Transaction[] = []

      for (const line of lines) {
        const parts = line.split(',').map((s) => s.trim())
        if (parts.length >= 2) {
          transactions.push({
            item: parts[0],
            amount: parseFloat(parts[1].replace(/[^0-9.-]/g, '')),
            category: parts[2] || 'Lain-lain',
            date: new Date().toISOString(),
          })
        }
      }

      if (transactions.length > 0) {
        onTransactionsProcessed(transactions)
        toast.success(`${transactions.length} transaksi berhasil ditambahkan!`)
        setManualInput('')
      } else {
        toast.error('Format data tidak valid')
      }
    } catch (error) {
      toast.error('Gagal memproses input manual')
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Transaksi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="manual">Input Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">
                Upload Struk (Foto/Video/CSV)
              </Label>
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,video/mp4,text/csv"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={removeFile}
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="text-sm text-gray-500">
                  Format: JPG, PNG, MP4, CSV (Max 10MB)
                </div>
              </div>
            </div>

            {selectedFile && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">
                  {selectedFile.type.startsWith('image/') && (
                    <ImageIcon className="w-5 h-5 text-emerald-600" />
                  )}
                  {selectedFile.type.startsWith('video/') && (
                    <Video className="w-5 h-5 text-emerald-600" />
                  )}
                  {selectedFile.type === 'text/csv' && (
                    <FileText className="w-5 h-5 text-emerald-600" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  {!uploading && (
                    <Check className="w-5 h-5 text-emerald-600" />
                  )}
                </div>

                {previewUrl && (
                  <div className="rounded-lg overflow-hidden border">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-auto max-h-64 object-contain"
                    />
                  </div>
                )}

                {uploading && (
                  <div className="space-y-2">
                    <Progress value={progress} />
                    <p className="text-sm text-center text-gray-600">
                      Menganalisis dengan AI... {progress}%
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Analisis dengan AI
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-input">
                Input Transaksi Manual
              </Label>
              <Textarea
                id="manual-input"
                placeholder="Contoh format (satu transaksi per baris):&#10;Nasi Goreng, 25000, Makanan&#10;Bensin, 50000, Transportasi&#10;Kopi, 15000, Minuman"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <div className="text-xs text-gray-500">
                Format: Nama Item, Jumlah, Kategori (satu per baris)
              </div>
            </div>

            <Button
              onClick={handleManualSubmit}
              className="w-full"
              disabled={!manualInput.trim()}
            >
              <Check className="w-4 h-4 mr-2" />
              Tambah Transaksi
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
