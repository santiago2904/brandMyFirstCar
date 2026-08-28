'use server'

import { createServerClient } from '@/lib/supabase/server'

const MAX_SIZE_BYTES = 2 * 1024 * 1024

export async function uploadSponsorLogo(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const file = formData.get('logo') as File | null
  if (!file || file.size === 0) return { error: 'no_file' }
  if (file.size > MAX_SIZE_BYTES) return { error: 'file_too_large' }
  if (!file.type.startsWith('image/')) return { error: 'invalid_type' }

  const supabase = createServerClient()
  const ext = file.name.split('.').pop() || 'png'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('sponsor-logos')
    .upload(path, file, { contentType: file.type })

  if (error) return { error: 'upload_failed' }

  const { data } = supabase.storage.from('sponsor-logos').getPublicUrl(path)
  return { url: data.publicUrl }
}
