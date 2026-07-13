export interface CheckoutInput {
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

export interface CheckoutResult {
  bonus: number;
  subtotal: number;
  realValue: number;
  discountPromo: number;
  discountCoupon: number;
  discountCard: number;
  totalPay: number;
}

export class CheckoutCalculator {
  static calculate(localCheckout: CheckoutInput): CheckoutResult {
    const quantity = Number(localCheckout.quantity) || 0;
    const price = Number(localCheckout.price) || 0;
    const promoQty = Number(localCheckout.promotion_quantity) || 0;
    const promoMax = Number(localCheckout.promotion_quantity_max) || 0;
    const coupon = localCheckout.coupon || null;
    const cardPct = Number(localCheckout.card?.percentage ?? 0) || 0;
    const bonus = this.#bonus(quantity, promoQty, promoMax);
    const subtotal = this.#subtotal(quantity, price);
    const realValue = this.#realValue(quantity, price, bonus);
    const discountPromo = this.#discount(realValue, subtotal);
    const discountCoupon = this.#couponDiscount(subtotal, coupon);
    const baseAfterCoupon = subtotal - discountCoupon;
    const discountCard = cardPct > 0 ? (baseAfterCoupon * cardPct) / 100 : 0;
    const totalPay = subtotal - discountCoupon - discountCard;
    return {
      bonus,
      subtotal,
      realValue,
      discountPromo,
      discountCoupon,
      discountCard,
      totalPay,
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

  static #couponDiscount(sub: number, coupon: CheckoutInput["coupon"]) {
    if (!coupon) return 0;

    const amount = Number(coupon.amount) || 0;
    const percentage = Number(coupon.percentage) || 0;

    if (percentage > 0) return (sub * percentage) / 100;
    if (amount > 0) return Math.min(amount, sub);
    return 0;
  }
}
