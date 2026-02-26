export interface CreateCheckoutParams {
  amount: number // in smallest currency unit (paise/cents)
  currency: string
  courseId: string
  userId: string
  courseTitle: string
  successUrl: string
  cancelUrl: string
  metadata: Record<string, string>
}

export interface CheckoutResult {
  providerSessionId: string
  checkoutUrl: string
}

export type WebhookEventType = "payment.success" | "payment.failed" | "payment.refunded"

export interface WebhookEvent {
  type: WebhookEventType
  providerSessionId: string
  providerPaymentId: string | null
  amountPaid: number | null // actual amount charged by provider
  metadata: Record<string, string>
}

export interface IPaymentProvider {
  readonly name: string
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>
  verifyWebhook(rawBody: Buffer, signature: string): WebhookEvent
}
