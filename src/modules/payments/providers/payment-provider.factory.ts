import { Config } from "../../../config/config"
import type { IPaymentProvider } from "./payment-provider.interface"
import { StripeProvider } from "./stripe.provider"

export function createPaymentProvider(): IPaymentProvider {
  switch (Config.PAYMENT_PROVIDER) {
    case "stripe":
    default:
      return new StripeProvider()
  }
}
