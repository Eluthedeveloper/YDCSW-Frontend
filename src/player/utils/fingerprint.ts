export function getFingerprint(): string {
  let fp = localStorage.getItem('audio_fingerprint');
  if (!fp) {
    fp = 'fp_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('audio_fingerprint', fp);
  }
  return fp;
}
