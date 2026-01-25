const API_URL = import.meta.env.PROD
  ? '/api/analytics/track'
  : 'https://primusgpt-ai.vercel.app/api/analytics/track';

function getVisitorId(): string {
  let visitorId = localStorage.getItem('primusgpt_visitor_id');
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('primusgpt_visitor_id', visitorId);
  }
  return visitorId;
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('primusgpt_session_id');
  if (!sessionId) {
    sessionId = `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('primusgpt_session_id', sessionId);
  }
  return sessionId;
}

export async function trackPageView(path: string): Promise<void> {
  // Don't track analytics page itself
  if (path === '/analytics') return;

  try {
    const payload = {
      event_type: 'pageview',
      page_path: path,
      referrer: document.referrer || 'direct',
      user_agent: navigator.userAgent,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
    };

    // Use sendBeacon for better reliability, fallback to fetch
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const sent = navigator.sendBeacon?.(API_URL, blob);

    if (!sent) {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
  } catch (error) {
    // Silently fail - don't break the app for analytics
    console.debug('Analytics tracking error:', error);
  }
}

export async function trackEvent(eventType: string, data?: Record<string, unknown>): Promise<void> {
  try {
    const payload = {
      event_type: eventType,
      page_path: window.location.pathname,
      referrer: document.referrer || 'direct',
      user_agent: navigator.userAgent,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      ...data,
    };

    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.debug('Analytics event error:', error);
  }
}
