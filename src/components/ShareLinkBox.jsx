import { useState } from 'react'

export default function ShareLinkBox({ url, note }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable or denied — the input below is still
      // focusable/selectable so the link can be copied manually.
    }
  }

  return (
    <div className="share-link-box">
      <div className="share-link-row">
        <input
          className="share-link-input"
          value={url}
          readOnly
          onFocus={(e) => e.target.select()}
        />
        <button className="share-copy-button" onClick={handleCopy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      {note && <div className="share-note">{note}</div>}
    </div>
  )
}
