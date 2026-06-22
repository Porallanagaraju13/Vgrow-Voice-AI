import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin

  const jsPayload = `
(function() {
  if (document.getElementById('voice-agent-saas-iframe-container')) return;

  const scriptTag = document.currentScript;
  const agentId = scriptTag ? scriptTag.getAttribute('data-agent-id') : null;

  if (!agentId) {
    console.error('VoiceAgent.SaaS: Missing data-agent-id attribute in script tag.');
    return;
  }

  // Create iframe wrapper container
  const container = document.createElement('div');
  container.id = 'voice-agent-saas-iframe-container';
  container.style.position = 'fixed';
  container.style.bottom = '16px';
  container.style.right = '16px';
  container.style.width = '420px';
  container.style.height = '650px';
  container.style.zIndex = '999999';
  container.style.pointerEvents = 'none';
  container.style.border = 'none';

  // Create Iframe
  const iframe = document.createElement('iframe');
  iframe.src = '${origin}/widget?agentId=' + agentId;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.background = 'transparent';
  iframe.style.pointerEvents = 'auto';
  iframe.setAttribute('allow', 'microphone');

  container.appendChild(iframe);
  document.body.appendChild(container);
})();
`

  return new NextResponse(jsPayload, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}