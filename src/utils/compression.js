import { bytesToBase64Url, base64UrlToBytes } from './base64url'

// gzip-compresses when the browser supports it (Compression Streams API),
// falling back to plain base64 on older browsers — the decoder handles both.
export async function encodeCompact(obj) {
  const json = JSON.stringify(obj)
  if (typeof CompressionStream === 'undefined') {
    return `r.${bytesToBase64Url(new TextEncoder().encode(json))}`
  }
  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))
  const buf = await new Response(stream).arrayBuffer()
  return `g.${bytesToBase64Url(new Uint8Array(buf))}`
}

export async function decodeCompact(encoded) {
  const dot = encoded.indexOf('.')
  if (dot === -1) throw new Error('Malformed share payload')
  const tag = encoded.slice(0, dot)
  const bytes = base64UrlToBytes(encoded.slice(dot + 1))

  if (tag === 'r') {
    return JSON.parse(new TextDecoder().decode(bytes))
  }
  if (tag === 'g') {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('This browser cannot decompress this link')
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
    const buf = await new Response(stream).arrayBuffer()
    return JSON.parse(new TextDecoder().decode(buf))
  }
  throw new Error('Unknown share payload format')
}
