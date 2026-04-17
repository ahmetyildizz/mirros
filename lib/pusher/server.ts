import Pusher from "pusher";

export const pusherServer = new Pusher({
  appId:   process.env.PUSHER_APP_ID!,
  key:     process.env.PUSHER_KEY!,
  secret:  process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER ?? "eu",
  useTLS:  true,
});

/** Pusher trigger wrapper — hataları loglar, re-throw etmez (DB zaten güncellendi) */
export async function safeTrigger(
  channel: string,
  event: string,
  data: object
): Promise<void> {
  try {
    await pusherServer.trigger(channel, event, data);
  } catch (err) {
    console.error(`[Pusher] trigger failed channel=${channel} event=${event}`, err);
  }
}
