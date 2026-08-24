import { PrismaClient } from '@prisma/client';

export interface SendNotificationParams {
  orderId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  customerName: string;
  trackingNumber: string;
  eventType: 'ORDER_CREATED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'RESCHEDULED';
  failureReason?: string;
  rescheduleUrl?: string;
}

export interface NotificationPayload {
  emailSubject: string;
  emailBody: string;
  smsBody: string;
}

export function generateNotificationContent(params: SendNotificationParams): NotificationPayload {
  const { customerName, trackingNumber, eventType, failureReason, rescheduleUrl } = params;

  switch (eventType) {
    case 'ORDER_CREATED':
      return {
        emailSubject: `📦 Shipment Confirmed: ${trackingNumber}`,
        emailBody: `Hello ${customerName},\n\nYour shipment with tracking number ${trackingNumber} has been confirmed and is waiting for pickup dispatch.\n\nTrack real-time updates here.`,
        smsBody: `LogiTrack: Shipment ${trackingNumber} confirmed. Track live at logitrack.app/track/${trackingNumber}`,
      };

    case 'PICKED_UP':
      return {
        emailSubject: `🚚 Package Picked Up: ${trackingNumber}`,
        emailBody: `Hello ${customerName},\n\nYour package (${trackingNumber}) has been picked up by our delivery partner and is moving towards the regional logistics hub.`,
        smsBody: `LogiTrack: Package ${trackingNumber} picked up and in transit.`,
      };

    case 'OUT_FOR_DELIVERY':
      return {
        emailSubject: `🛵 Out for Delivery Today: ${trackingNumber}`,
        emailBody: `Hello ${customerName},\n\nGreat news! Your package (${trackingNumber}) is out for delivery with our courier agent today. Please ensure someone is available at the delivery address.`,
        smsBody: `LogiTrack: Package ${trackingNumber} is OUT FOR DELIVERY today. Please keep your phone reachable.`,
      };

    case 'DELIVERED':
      return {
        emailSubject: `🎉 Delivered Successfully: ${trackingNumber}`,
        emailBody: `Hello ${customerName},\n\nYour shipment ${trackingNumber} has been successfully delivered. Thank you for choosing LogiTrack!`,
        smsBody: `LogiTrack: Package ${trackingNumber} has been delivered successfully. Thank you!`,
      };

    case 'FAILED':
      return {
        emailSubject: `⚠️ Delivery Attempt Notice: Action Required for ${trackingNumber}`,
        emailBody: `Hello ${customerName},\n\nWe attempted to deliver your package (${trackingNumber}), but were unable to complete the delivery.\n\nReason: ${
          failureReason || 'Customer unavailable at delivery location'
        }\n\nPlease click the link below to select your preferred reschedule date and delivery window:\n👉 ${rescheduleUrl || `http://localhost:3000/reschedule/${trackingNumber}`}\n\nOur agent will be automatically reassigned for your chosen time slot.`,
        smsBody: `LogiTrack: Delivery attempt failed for ${trackingNumber} (${failureReason || 'Customer Unavailable'}). Pick a new delivery date now: ${rescheduleUrl || `http://localhost:3000/reschedule/${trackingNumber}`}`,
      };

    case 'RESCHEDULED':
      return {
        emailSubject: `📅 Delivery Rescheduled: ${trackingNumber}`,
        emailBody: `Hello ${customerName},\n\nYour delivery (${trackingNumber}) has been rescheduled according to your preferred time slot. Our nearest agent has been assigned for the upcoming attempt.`,
        smsBody: `LogiTrack: Delivery for ${trackingNumber} successfully rescheduled. We will notify you when out for delivery.`,
      };

    default:
      return {
        emailSubject: `LogiTrack Update: ${trackingNumber}`,
        emailBody: `Hello ${customerName},\n\nStatus update for ${trackingNumber}.`,
        smsBody: `LogiTrack status update for ${trackingNumber}.`,
      };
  }
}

/**
 * Triggers automated notifications across channels (Email & SMS) and logs them immutably to the database.
 */
export async function triggerOrderNotification(
  prisma: PrismaClient,
  params: SendNotificationParams
): Promise<{ emailSent: boolean; smsSent: boolean }> {
  const content = generateNotificationContent(params);
  let emailSent = false;
  let smsSent = false;

  try {
    // 1. Email Notification
    if (params.recipientEmail) {
      await prisma.notificationLog.create({
        data: {
          orderId: params.orderId,
          channel: 'EMAIL',
          recipient: params.recipientEmail,
          title: content.emailSubject,
          message: content.emailBody,
          status: 'SENT',
        },
      });
      emailSent = true;
    }

    // 2. SMS Notification
    if (params.recipientPhone) {
      await prisma.notificationLog.create({
        data: {
          orderId: params.orderId,
          channel: 'SMS',
          recipient: params.recipientPhone,
          title: 'SMS Status Alert',
          message: content.smsBody,
          status: 'SENT',
        },
      });
      smsSent = true;
    }
  } catch (err) {
    console.error('Error logging notification to database:', err);
  }

  return { emailSent, smsSent };
}
