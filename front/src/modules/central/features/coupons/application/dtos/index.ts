export interface ICoupon {
  id?: number
  name: string
  code: string
  active: boolean
  amount: number
  percentage: number
  expire_at: string | null
}
