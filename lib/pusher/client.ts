import PusherClient from "pusher-js";

let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherClient) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY!;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu";
    
    pusherClient = new PusherClient(key, {
      cluster,
      forceTLS: true,
    });

    pusherClient.connection.bind('error', (err: any) => {
      console.error('❌ Pusher Bağlantı Hatası:', err);
    });

    pusherClient.connection.bind('state_change', (states: any) => {
      console.log('📡 Pusher Durumu:', states.current);
    });
  }
  return pusherClient;
}
