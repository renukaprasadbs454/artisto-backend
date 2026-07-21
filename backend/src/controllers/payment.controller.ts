import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { prisma } from '../utils/prisma';
import { z } from 'zod';

// For demo purposes, if missing env vars, we might not crash immediately
// but will throw an error when trying to create order.
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

export const createOrderSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).default('INR'),
  paymentType: z.enum(['SUBSCRIPTION', 'ORDER_ESCROW']),
  relatedId: z.string().optional(),
}).strict();

export const verifyOrderSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  paymentId: z.string(),
  plan: z.string().optional(), // PRO, AGENCY
}).strict();

/**
 * POST /payments/create-order
 * Create a Razorpay order.
 */
export async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { amount, currency, paymentType, relatedId } = req.body;

    // Razorpay works in smallest currency subunit (paise for INR)
    const amountInSmallestUnit = Math.round(amount * 100);

    const options = {
      amount: amountInSmallestUnit,
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create(options);
    } catch (err) {
      console.error('Razorpay Error:', err);
      res.status(500).json({ error: { code: 'PAYMENT_ERROR', message: 'Failed to create payment order' } });
      return;
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: amountInSmallestUnit,
        currency,
        status: 'CREATED',
        razorpayOrderId: razorpayOrder.id,
      },
    });

    res.status(200).json({
      data: {
        paymentId: payment.id,
        razorpayOrder,
        key: process.env.RAZORPAY_KEY_ID, // Send key to frontend for checkout initialization
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments/verify
 * Verify razorpay payment signature.
 */
export async function verifyOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId, plan } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';
    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'FAILED' },
      });
      res.status(400).json({ error: { code: 'PAYMENT_FAILED', message: 'Invalid payment signature' } });
      return;
    }

    // Payment is valid
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { 
        status: 'CAPTURED',
        razorpayPaymentId: razorpay_payment_id
      },
    });

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await prisma.subscription.create({
      data: {
        userId,
        status: 'ACTIVE',
        currentPeriodEnd: expiresAt,
      },
    });

    res.status(200).json({ data: { success: true, payment } });
  } catch (err) {
    next(err);
  }
}
