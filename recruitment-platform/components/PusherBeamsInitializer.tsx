'use client';

import { useEffect } from 'react';
import { getBeamsClient } from '@/lib/pusher-beams-client';

interface PusherBeamsInitializerProps {
  userId: string;
}

export default function PusherBeamsInitializer({ userId }: PusherBeamsInitializerProps) {
  useEffect(() => {
    if (!userId) return;

    const beamsClient = getBeamsClient();
    if (!beamsClient) return;

    beamsClient.start()
      .then(() => beamsClient.addDeviceInterest(userId))
      .then(() => console.log('Successfully registered and subscribed to Beams interest: ' + userId))
      .catch((err: any) => console.error('Pusher Beams initialization error:', err));
  }, [userId]);

  return null;
}
