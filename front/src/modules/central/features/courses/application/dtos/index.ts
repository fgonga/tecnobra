export interface ICourse {
  id: number;
  name: string;
  course_card_image_url?: string | null;
  description?: string | null;
  product_id?: string | null;
  slug: string;
  thinkific_id: string;
  thinkific_type: string; // ex: 'course' | 'bundle'
  price: number;
  levels?: { title: string; description: string }[] | null;
  cefr_levels?: string[] | string | null; // níveis CEFR do teste onde o curso é recomendado
  days_until_expiry: number;

  // Campos de controle opcionais (frontend)
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}
