import { OAuth2Client } from "google-auth-library";
import appleSignin from "apple-signin-auth";

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID env değişkeni tanımlı değil");
}
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

const googleClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);

/**
 * Google ID Token'ını doğrular ve kullanıcı bilgilerini döner.
 */
export async function verifyGoogleToken(token: string) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: [
        CLIENT_ID,
        // Mobil Client ID'leri gerekirse buraya eklenebilir
      ].filter(Boolean),
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.sub) throw new Error("GEÇERSİZ_PAYLOAD");

    return {
      providerId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (error) {
    console.error("Google verify error:", error);
    return null;
  }
}

/**
 * Apple Identity Token'ını doğrular ve kullanıcı bilgilerini döner.
 */
export async function verifyAppleToken(token: string) {
  try {
    const { sub, email } = await appleSignin.verifyIdToken(token, {
      audience: process.env.APPLE_CLIENT_ID || "",
    });

    return {
      providerId: sub,
      email: email,
      // Apple sadece İLK girişte isim gönderir, bu yüzden isim null olabilir
      name: null, 
    };
  } catch (error) {
    console.error("Apple verify error:", error);
    return null;
  }
}
