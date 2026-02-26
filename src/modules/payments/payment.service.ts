import { randomUUID } from "crypto"
import type { Redis } from "ioredis"
import { DataSource, Repository } from "typeorm"
import { Payment } from "../../entities/Payment.entity"
import { Course } from "../../entities/Course.entity"
import { UserCourseProgress } from "../../entities/UserCourseProgress.entity"
import { PaymentStatus } from "../../enums/payment-status.enum"
import { NotFoundError, ConflictError, ValidationError } from "../../shared/errors"
import { Config } from "../../config/config"
import type { IPaymentProvider } from "./providers/payment-provider.interface"
import type { NotificationService } from "../notifications/notification.service"
import { NotificationType } from "../../enums/index"
import logger from "../../config/logger"

const IDEMPOTENCY_TTL = 86400 // 24 hours
const PRICE_QUOTE_TTL = 600 // 10 minutes

interface PriceQuotePayload {
  courseId: string
  price: number
  currency: string
  token: string // opaque UUID returned to client
}

export class PaymentService {
  constructor(
    private readonly paymentRepo: Repository<Payment>,
    private readonly courseRepo: Repository<Course>,
    private readonly courseProgressRepo: Repository<UserCourseProgress>,
    private readonly provider: IPaymentProvider,
    private readonly dataSource: DataSource,
    private readonly redis: Redis,
    private readonly notificationService: NotificationService,
  ) {}

  // ─── GET /payments/courses/:courseId/quote ────────────────────────────────────
  // Generates a short-lived price quote token tied to userId + courseId.
  // Key is DETERMINISTIC — only one active quote per user per course at a time.
  // Calling /quote again silently invalidates the previous token.

  async createPriceQuote(
    courseId: string,
    userId: string,
  ): Promise<{ priceToken: string; price: number; currency: string; expiresIn: number }> {
    const course = await this.courseRepo.findOne({ where: { id: courseId, isPublished: true } })
    if (!course) throw new NotFoundError("Course not found")

    if (!course.isPremium) {
      throw new ValidationError("This course is free — use the enroll endpoint directly")
    }

    if (course.price <= 0) {
      throw new ValidationError("Course price is not configured")
    }

    const alreadyEnrolled = await this.courseProgressRepo.findOne({ where: { userId, courseId } })
    if (alreadyEnrolled) throw new ConflictError("Already enrolled in this course")

    // Deterministic key — one slot per user per course.
    // SET overwrites any previous quote, so flooding /quote just replaces the old token.
    const quoteKey = `price_quote:${userId}:${courseId}`
    const token = randomUUID()

    const payload: PriceQuotePayload = {
      courseId,
      price: course.price,
      currency: Config.PAYMENT_CURRENCY,
      token,
    }

    await this.redis.set(quoteKey, JSON.stringify(payload), "EX", PRICE_QUOTE_TTL)

    return {
      priceToken: token,
      price: course.price,
      currency: Config.PAYMENT_CURRENCY,
      expiresIn: PRICE_QUOTE_TTL,
    }
  }

  // ─── POST /payments/courses/:courseId/checkout ────────────────────────────────

  async createCheckout(
    courseId: string,
    userId: string,
    idempotencyKey: string,
    priceToken: string,
  ): Promise<{ checkoutUrl: string; sessionId: string }> {
    // 1. Idempotency check — return cached response within 24h window
    const idempKey = `idempotency:${userId}:${idempotencyKey}`
    const cached = await this.redis.get(idempKey)
    if (cached) return JSON.parse(cached)

    // 2. Atomic GETDEL on deterministic key.
    //    - If two concurrent requests race, only the first succeeds.
    //    - If quote has expired or was already used, quoteRaw is null.
    const quoteKey = `price_quote:${userId}:${courseId}`
    const quoteRaw = await this.redis.getdel(quoteKey)

    if (!quoteRaw) {
      throw new ValidationError(
        "Price quote has expired or is invalid. Please refresh and try again.",
      )
    }

    const quote = JSON.parse(quoteRaw) as PriceQuotePayload

    // 3. Verify the opaque token matches — prevents a user from using another
    //    user's quote by guessing the deterministic key structure.
    if (quote.token !== priceToken) {
      throw new ValidationError("Price is not valid")
    }

    // 4. Confirm courseId in token matches URL param
    if (quote.courseId !== courseId) {
      throw new ValidationError("Price is not valid")
    }

    // 5. Cross-validate token price against current DB price.
    //    Catches price changes between quote generation and checkout.
    const course = await this.courseRepo.findOne({ where: { id: courseId, isPublished: true } })
    if (!course) throw new NotFoundError("Course not found")

    if (quote.price !== course.price) {
      throw new ValidationError("Price has changed. Please refresh and try again.")
    }

    // 6. Check already enrolled
    const enrolled = await this.courseProgressRepo.findOne({ where: { userId, courseId } })
    if (enrolled) throw new ConflictError("Already enrolled in this course")

    // 7. Create Stripe checkout — price comes from Redis quote, NEVER from client
    const checkoutResult = await this.provider.createCheckout({
      amount: quote.price,
      currency: quote.currency,
      courseId,
      userId,
      courseTitle: course.title,
      successUrl: Config.STRIPE_SUCCESS_URL,
      cancelUrl: Config.STRIPE_CANCEL_URL,
      metadata: { userId, courseId },
    })

    // 8. Persist Payment record
    const receipt = `pay_${userId}_${courseId}_${idempotencyKey}`
    await this.paymentRepo.save(
      this.paymentRepo.create({
        userId,
        courseId,
        amount: quote.price,
        currency: quote.currency,
        status: PaymentStatus.PENDING,
        provider: this.provider.name,
        providerSessionId: checkoutResult.providerSessionId,
        receipt,
      }),
    )

    // 9. Cache response with 24h idempotency TTL
    const response = {
      checkoutUrl: checkoutResult.checkoutUrl,
      sessionId: checkoutResult.providerSessionId,
    }
    await this.redis.set(idempKey, JSON.stringify(response), "EX", IDEMPOTENCY_TTL)

    return response
  }

  // ─── POST /payments/webhook ───────────────────────────────────────────────────

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const event = this.provider.verifyWebhook(rawBody, signature)

    if (event.type === "payment.success" && event.providerSessionId) {
      const payment = await this.paymentRepo.findOne({
        where: { providerSessionId: event.providerSessionId },
      })

      // Idempotent — ignore if not found or already processed
      if (!payment || payment.status === PaymentStatus.PAID) return

      // Price integrity check — amount Stripe actually charged must match our DB record.
      // Protects against tampered or mis-routed webhook events.
      if (event.amountPaid !== null && event.amountPaid !== payment.amount) {
        logger.error("Payment amount mismatch — webhook ignored", {
          providerSessionId: event.providerSessionId,
          expectedAmount: payment.amount,
          receivedAmount: event.amountPaid,
          paymentId: payment.id,
          userId: payment.userId,
          courseId: payment.courseId,
        })
        return
      }

      await this.dataSource.transaction(async (manager) => {
        // Mark payment paid
        payment.status = PaymentStatus.PAID
        payment.providerPaymentId = event.providerPaymentId
        await manager.save(Payment, payment)

        // Enroll user — idempotent (skip if already enrolled)
        const alreadyEnrolled = await manager.findOne(UserCourseProgress, {
          where: { userId: payment.userId, courseId: payment.courseId },
        })
        if (!alreadyEnrolled) {
          const progress = manager.create(UserCourseProgress, {
            userId: payment.userId,
            courseId: payment.courseId,
            completedLessons: 0,
            progressPercent: 0,
          })
          await manager.save(UserCourseProgress, progress)
        }
      })

      // Notify user — outside transaction (non-critical)
      await this.notificationService
        .sendToUser(payment.userId, {
          type: NotificationType.SYSTEM,
          title: "Enrollment Confirmed",
          body: "You have successfully enrolled in the course. Happy learning!",
          data: { courseId: payment.courseId },
        })
        .catch(() => null)
    }

    if (event.type === "payment.refunded" && event.providerPaymentId) {
      await this.paymentRepo.update(
        { providerPaymentId: event.providerPaymentId },
        { status: PaymentStatus.REFUNDED },
      )
    }
  }

  // ─── GET /payments/history ────────────────────────────────────────────────────

  async getHistory(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ payments: Payment[]; total: number; page: number; limit: number }> {
    const [payments, total] = await this.paymentRepo.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    })
    return { payments, total, page, limit }
  }
}
