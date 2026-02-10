/**
 * Transforma URLs de imágenes de Wikimedia para que funcionen en React Native.
 * Usa wsrv.nl (proxy de imágenes open-source) para resolver redirecciones
 * y evitar el bloqueo 403 de Wikimedia por falta de User-Agent.
 */
export function imageSource(url) {
  if (!url) return undefined;

  let finalUrl = url.replace(/^http:\/\//, 'https://');

  // Si es una URL de Wikimedia, usar proxy para evitar 403
  if (finalUrl.includes('wikimedia.org') || finalUrl.includes('wikipedia.org')) {
    // Decodificar primero para evitar doble codificación (%20 -> %2520)
    const decoded = decodeURIComponent(finalUrl);
    finalUrl = `https://wsrv.nl/?url=${encodeURIComponent(decoded)}&w=600`;
  }

  return { uri: finalUrl };
}
