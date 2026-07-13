export interface CalculatorInput {
  quantity: number;
  price: number;
  promotion_quantity?: number;
  promotion_quantity_max?: number;
  coupon?: {
    amount?: number | string;
    percentage?: number | string;
  } | null;
  card?: {
    percentage: number;
  } | null;
}

export interface CalculatorOut {
  bonus: number;
  subtotal: number;
  realValue: number;
  discountPromo: number;
  discountCoupon: number;
  discountCard: number;
  totalPay: number;
  expectedStudents: number;
}

export class CheckoutCalculator {
  static calculate(input: CalculatorInput): CalculatorOut {
    console.log(input)
    const quantity = Number(input.quantity) || 0;
    const price = Number(input.price) || 0;
    const cardPct = Number(input.card?.percentage ?? 0) || 0;
    const promoQty = Number(input.promotion_quantity) || 0;
    const promoMax = Number(input.promotion_quantity_max) || 0;
    const coupon = input.coupon || null;
    const bonus = this.#bonus(quantity, promoQty, promoMax);
    const subtotal = this.#subtotal(quantity, price);
    const realValue = this.#realValue(quantity, price, bonus);
    const discountPromo = this.#discount(realValue, subtotal);
    const discountCoupon = this.#couponDiscount(subtotal, coupon);
    const baseAfterCoupon = subtotal - discountCoupon;
    const discountCard = cardPct > 0 ? (baseAfterCoupon * cardPct) / 100 : 0;
    const totalPay = subtotal - discountCoupon - discountCard;
    const expectedStudents = quantity + bonus;
    return {
      bonus,
      subtotal,
      realValue,
      discountPromo,
      discountCoupon,
      discountCard,
      totalPay,
      expectedStudents,
    };
  }

  /* ---------------------- privados ---------------------- */
  static #bonus(q: number, promoQ: number, promoMax: number) {
    return promoQ > 0 ? Math.min(Math.floor(q / promoQ), promoMax) : 0;
  }

  static #subtotal(q: number, price: number) {
    return q * price;
  }

  static #realValue(q: number, price: number, bonus: number) {
    return (q + bonus) * price;
  }

  static #discount(real: number, sub: number) {
    return real - sub;
  }

  static #couponDiscount(sub: number, coupon: CalculatorInput["coupon"]) {
    if (!coupon) return 0;

    const amount = Number(coupon.amount) || 0;
    const percentage = Number(coupon.percentage) || 0;

    if (percentage > 0) return (sub * percentage) / 100;
    if (amount > 0) return Math.min(amount, sub);
    return 0;
  }
}
