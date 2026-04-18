import Pusher from "pusher";

export const pusherServer = new Pusher({
  appId:   process.env.PUSHER_APP_ID!,
  key:     process.env.PUSHER_KEY!,
  secret:  process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER ?? "eu",
  useTLS:  true,
});

/** Pusher trigger wrapper — 3 deneme, üstel bekleme, re-throw etmez */
export async function safeTrigger(
  channel: string,
  event: string,
  data: object,
  retries = 3
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pusherServer.trigger(channel, event, data);
      return;
    } catch (err) {
      console.error(`[Pusher] trigger failed attempt=${attempt}/${retries} channel=${channel} event=${event}`, err);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 200 * attempt));
      }
    }
  }
}
