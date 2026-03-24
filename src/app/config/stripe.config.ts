import Stripe from 'stripe';
import { envVars } from './env.js';

export const stripe = new Stripe(envVars.STRIPE.STRIPE_SECRET_KEY);

export const stripeWebhookSecret = envVars.STRIPE.STRIPE_WEBHOOK_SECRET;
