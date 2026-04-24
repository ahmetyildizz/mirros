import { Resend } from "resend";
import { db } from "@/lib/db";

const resend = new Resend(process.env.RESEND_API_KEY);

const ALERT_EMAIL = "ahmet_yildiz@hotmail.com";
const PUSHER_LIMIT = 100;
const THRESHOLD = 0.8; // %80 dolulukta uyar

/**
 * Mevcut eş zamanlı oyuncu sayısını kontrol eder ve eşik aşılmışsa mail atar.
 */
export async function checkCapacityAndAlert() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[CapacityGuard] RESEND_API_KEY bulunamadı, uyarı maili gönderilemiyor.");
    return;
  }

  try {
    // Aktif odalardaki toplam katılımcı sayısını bul
    const activeParticipants = await db.roomParticipant.count({
      where: {
        room: {
          status: { in: ["WAITING", "ACTIVE"] }
        }
      }
    });

    if (activeParticipants >= PUSHER_LIMIT * THRESHOLD) {
      console.warn(`[CapacityGuard] Kritik eşik aşıldı: ${activeParticipants}/${PUSHER_LIMIT}`);
      
      await resend.emails.send({
        from: "Mirros System <alerts@mirros.app>",
        to: ALERT_EMAIL,
        subject: "⚠️ Mirros Kapasite Uyarısı: Limitlere Yaklaşıldı!",
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #e11d48;">🚨 Kapasite Uyarısı!</h2>
            <p>Merhaba Ahmet Bey,</p>
            <p>Mirros uygulamasında şu an <b>${activeParticipants}</b> eş zamanlı oyuncu bulunuyor. Bu sayı, mevcut Pusher limitinin (100) %80'ine ulaştı.</p>
            
            <div style="background: #fdf2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong>Risk:</strong> Limit dolduğunda yeni oyuncular odaya katılamayacak ve gerçek zamanlı özellikler çalışmayacaktır.
            </div>

            <h3>✅ Ne Yapmalısınız? (Upgrade Talimatı)</h3>
            <ol>
              <li>Pusher paneline giriş yapın: <a href="https://dashboard.pusher.com/">dashboard.pusher.com</a></li>
              <li><b>"mirros"</b> isimli projenizi seçin.</li>
              <li>Sol menüden <b>"Billing"</b> veya <b>"Plan Management"</b> kısmına girin.</li>
              <li>"Free" planın bir üstü olan <b>"Pro"</b> plana geçiş yapın.</li>
            </ol>

            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Bu mail, sistem tarafından otomatik olarak kapasite güvenliğini sağlamak amacıyla gönderilmiştir.
            </p>
          </div>
        `
      });

      console.log("[CapacityGuard] Uyarı maili başarıyla gönderildi.");
    }
  } catch (error) {
    console.error("[CapacityGuard] Kontrol hatası:", error);
  }
}
