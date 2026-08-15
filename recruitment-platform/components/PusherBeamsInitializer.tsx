'use client';

import { useEffect } from 'react';
import { getBeamsClient } from '@/lib/pusher-beams-client';

interface PusherBeamsInitializerProps {
  userId: string;
}

export default function PusherBeamsInitializer({ userId }: PusherBeamsInitializerProps) {
  useEffect(() => {
    if (!userId) return;

    // Check if Notification API is supported by the browser
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('Push notifications are not supported in this browser.');
      return;
    }

    // If notifications are blocked/denied, do not attempt to register or request permission
    // to prevent throwing NotAllowedError / permission denied errors in the console
    if (Notification.permission === 'denied') {
      console.log('Push notifications are blocked by the user. Skipping Pusher Beams registration.');
      return;
    }

    // Check if browser is supported by Pusher Beams SDK to avoid warnings and errors
    const winNav = window.navigator;
    const vendorName = winNav.vendor;
    const isChromium = (window as any).chrome !== null && typeof (window as any).chrome !== 'undefined';
    const isOpera = winNav.userAgent.indexOf('OPR') > -1;
    const isEdge = winNav.userAgent.indexOf('Edg') > -1;
    const isFirefox = winNav.userAgent.indexOf('Firefox') > -1;
    const isChrome = isChromium && vendorName === 'Google Inc.' && !isEdge && !isOpera;
    const isSupported = isChrome || isOpera || isFirefox || isEdge;

    if (!isSupported) {
      console.log('Pusher Beams registration skipped: Browser not supported by Pusher Web SDK.');
      return;
    }

    const beamsClient = getBeamsClient();
    if (!beamsClient) return;

    beamsClient.start()
      .then((client: any) => {
        if (client && client._deviceId) {
          return client.addDeviceInterest(userId)
            .then(() => console.log('Successfully registered and subscribed to Beams interest: ' + userId));
        } else {
          console.log('Pusher Beams registration skipped: SDK did not generate a device ID.');
        }
      })
      .catch((err: any) => {
        // Handle user rejection/permission denial gracefully
        if (err.name === 'NotAllowedError' || err.message?.includes('permission')) {
          // Silent skip
        } else {
          console.error('Pusher Beams initialization error:', err);
        }
      });
  }, [userId]);

  return null;
}
