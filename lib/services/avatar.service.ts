/**
 * Mirros — AI Avatar Service
 * DICEBEAR API kullanarak kullanıcı adı veya vibe'a göre özel avatarlar üretir.
 */
export const getAiAvatarUrl = (seed: string, type: 'lorelei' | 'bottts' | 'avataaars' | 'pixel-art' = 'lorelei') => {
  // lorelei: şık ve modern (premium hissiyat için ideal)
  // bottts: teknolojik
  // avataaars: sosyal
  return `https://api.dicebear.com/7.x/${type}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
};

/**
 * Kullanıcının "vibe"ına göre profil fotoğrafını günceller.
 */
export async function updateAiAvatar(userId: string, seed: string) {
  const avatarUrl = getAiAvatarUrl(seed);
  // Burada DB güncellemesi yapılabilir
  return avatarUrl;
}
