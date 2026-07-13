/*
 *  Copyright © 2021 - 2025
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *
 *   Bantu Internet Technologies, Lda.
 *   Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *   geral@bit.ao
 *   www.bit.ao
 */
import type { CrudService } from '@common/hooks/types'
import { API } from '@common/domain/services/api'
import type { ICourses } from '@/modules/central/features/Courses/application/dtos'
const CoursesAPIService: CrudService<ICourses> = {
  index: async (filters) => {
    return await API.get('/api/v1/courses', { params: filters })
  },
  show: async (id, filters) => {
    return await API.get(`/api/v1/courses/${id}`, { params: filters })
  },
  update: async (id, data) => {
    return await API.put(`/api/v1/courses/${id}`, data)
  },
  synchronize: async (data) => {
    return await API.get('/api/v1/courses/synchronize', data)
  },
  // Fluxo interativo com progresso (curso-a-curso)
  syncManifest: async () => {
    return await API.get('/api/v1/courses/sync/manifest')
  },
  syncItem: async (product) => {
    return await API.post('/api/v1/courses/sync/item', product)
  },
  syncFinalize: async (slugs) => {
    return await API.post('/api/v1/courses/sync/finalize', { slugs })
  },
  // Sync de um único curso pelo slug
  syncOne: async (slug) => {
    return await API.post('/api/v1/courses/sync/one', { slug })
  },
}
export const CoursesService: CrudService<ICourses> & {
  syncManifest: () => Promise<any>
  syncItem: (product: any) => Promise<any>
  syncFinalize: (slugs: string[]) => Promise<any>
  syncOne: (slug: string) => Promise<any>
} = CoursesAPIService as any
