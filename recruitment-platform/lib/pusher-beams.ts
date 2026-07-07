import PushNotifications from '@pusher/push-notifications-server';

const beamsClient = new PushNotifications({
  instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID || '',
  secretKey: process.env.PUSHER_BEAMS_SECRET_KEY || '',
});

export default beamsClient;

export async function sendPushNotification(userId: string, title: string, body: string, deepLink?: string) {
  try {
    await beamsClient.publishToInterests([userId], {
      web: {
        notification: {
          title,
          body,
          deep_link: deepLink || undefined,
        },
      },
    });
    console.log(`Push notification sent successfully to user ${userId}`);
  } catch (error) {
    console.error('Failed to send push notification via Pusher Beams:', error);
  }
}
