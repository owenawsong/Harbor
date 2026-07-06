import '../styles/globals.css'

const root = document.getElementById('root')

function render(status: 'idle' | 'requesting' | 'granted' | 'denied', detail = '') {
  if (!root) return

  const statusCopy = {
    idle: 'Chrome needs to grant microphone access from a full extension page before the side panel can use voice input.',
    requesting: 'Requesting microphone access...',
    granted: 'Microphone access is enabled. You can close this tab and use voice input in Harbor.',
    denied: detail || 'Microphone access was blocked. Allow it in Chrome settings, then try again.',
  }[status]

  root.innerHTML = `
    <main style="
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: rgb(11 12 18);
      color: white;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 24px;
    ">
      <section style="
        width: min(520px, 100%);
        border: 1px solid rgb(255 255 255 / 0.12);
        background: rgb(255 255 255 / 0.06);
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 24px 80px rgb(0 0 0 / 0.35);
      ">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
          <img src="/icons/logo.png" alt="" style="width:28px;height:28px;border-radius:6px;" />
          <h1 style="font-size:20px;line-height:1.2;margin:0;">Enable Harbor Voice Input</h1>
        </div>
        <p style="font-size:14px;line-height:1.7;color:rgb(255 255 255 / 0.72);margin:0 0 18px;">
          ${statusCopy}
        </p>
        <button id="grant" style="
          appearance: none;
          border: 1px solid rgb(255 255 255 / 0.16);
          background: rgb(79 95 232);
          color: white;
          border-radius: 9px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
        ">
          ${status === 'requesting' ? 'Requesting...' : 'Enable microphone'}
        </button>
      </section>
    </main>
  `

  const button = document.getElementById('grant') as HTMLButtonElement | null
  if (button) {
    button.disabled = status === 'requesting' || status === 'granted'
    button.addEventListener('click', requestMicPermission)
  }
}

async function requestMicPermission() {
  render('requesting')
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((track) => track.stop())
    render('granted')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    render('denied', `Microphone access failed: ${message}`)
  }
}

render('idle')
