import * as PusherPushNotifications from '@pusher/push-notifications-web';

let beamsClient: any = null;

export const getBeamsClient = () => {
  if (typeof window === 'undefined') return null;
  if (!beamsClient) {
    beamsClient = new PusherPushNotifications.Client({
      instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID || '',
    });
  }
  return beamsClient;
};
