// types/checkout.ts
export interface IStudent {
  name: string
  email: string
  phone: string
}
type IPaymentType = 'express' | 'qr'

export interface Checkout {
  paid_at?:string|null,
  students: IStudent[],
  paymentType: IPaymentType
  agree: boolean,
  price:number,
  quantity: number,
  bonus: number,
  subtotal: number,
  realValue: number,
  discount: number,
  totalPay: number,
  phone: string,
  promotion_active: boolean,
  promotion_quantity: number,
  promotion_quantity_max:number,
  paymentCode: string | null,
  orderCode: string | null,
  coupon_code: string | null
  coupon:any
}

type UserType = 'admin' | 'manager' | 'consulter'

interface User {
  id: string
  name: string
  type: UserType
}
