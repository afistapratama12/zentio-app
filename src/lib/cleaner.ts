export function sanitizeAIJson(raw: string): string {
  let cleaned = raw;

  // 1. Buang code fence ```
  cleaned = cleaned.replace(/```(json)?/g, "").trim();

  // 2. Ambil hanya konten antara [ ... ] atau { ... }
  const match = cleaned.match(/(\[.*\]|\{.*\})/s);
  if (match) cleaned = match[0];

  // 3. Hapus underscore di angka
  cleaned = cleaned.replace(/(\d)_(\d)/g, "$1$2");

  // 4. Pastikan key pakai double quote
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

  // 5. Hapus trailing comma sebelum } atau ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  return cleaned;
}