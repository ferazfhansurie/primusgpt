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
    // Track session start time
    sessionStorage.setItem('primusgpt_session_start', Date.now().toString());
  }
  return sessionId;
}

function getSessionDuration(): number {
  const startTime = sessionStorage.getItem('primusgpt_session_start');
  if (startTime) {
    return Math.floor((Date.now() - parseInt(startTime)) / 1000); // seconds
  }
  return 0;
}

function getDeviceType(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Other';
}

function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Other';
}

function getConnectionType(): string {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (connection) {
    return connection.effectiveType || connection.type || 'unknown';
  }
  return 'unknown';
}

function isReturningVisitor(): boolean {
  const visitCount = localStorage.getItem('primusgpt_visit_count');
  const count = parseInt(visitCount || '0') + 1;
  localStorage.setItem('primusgpt_visit_count', count.toString());
  return count > 1;
}

function getUtmParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utmParams: Record<string, string> = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
    const value = params.get(param);
    if (value) utmParams[param] = value;
  });
  return utmParams;
}

// Detect in-app browsers from User Agent
function detectInAppSource(): string | null {
  const ua = navigator.userAgent;
  
  // Instagram in-app browser
  if (ua.includes('Instagram')) return 'instagram';
  
  // Facebook in-app browser (FBAN = Facebook App Native, FBAV = Facebook App Version)
  if (ua.includes('FBAN') || ua.includes('FBAV') || ua.includes('FB_IAB')) return 'facebook';
  
  // TikTok in-app browser
  if (ua.includes('TikTok') || ua.includes('BytedanceWebview') || ua.includes('ByteLocale')) return 'tiktok';
  
  // Twitter/X in-app browser
  if (ua.includes('Twitter')) return 'twitter';
  
  // LinkedIn in-app browser
  if (ua.includes('LinkedInApp')) return 'linkedin';
  
  // Snapchat in-app browser
  if (ua.includes('Snapchat')) return 'snapchat';
  
  // Pinterest in-app browser
  if (ua.includes('Pinterest')) return 'pinterest';
  
  // Telegram in-app browser (less reliable)
  if (ua.includes('Telegram')) return 'telegram';
  
  // WhatsApp doesn't always identify itself, but sometimes...
  if (ua.includes('WhatsApp')) return 'whatsapp';
  
  // Line app
  if (ua.includes('Line/')) return 'line';
  
  // WeChat
  if (ua.includes('MicroMessenger')) return 'wechat';
  
  return null;
}

export async function trackPageView(path: string): Promise<void> {
  // Don't track analytics page itself
  if (path === '/analytics') return;

  try {
    const utmParams = getUtmParams();
    
    // Auto-detect source from in-app browser if no UTM source
    if (!utmParams.utm_source) {
      const inAppSource = detectInAppSource();
      if (inAppSource) {
        utmParams.utm_source = inAppSource;
        utmParams.utm_medium = 'in-app';
      }
    }

    const payload = {
      event_type: 'pageview',
      page_path: path,
      page_title: document.title,
      referrer: document.referrer || 'direct',
      user_agent: navigator.userAgent,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      language: navigator.language,
      languages: navigator.languages?.join(',') || navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      session_duration: getSessionDuration(),
      device_type: getDeviceType(),
      browser: getBrowser(),
      os: getOS(),
      connection_type: getConnectionType(),
      is_returning: isReturningVisitor(),
      color_depth: window.screen.colorDepth,
      pixel_ratio: window.devicePixelRatio,
      touch_support: 'ontouchstart' in window,
      ...utmParams,
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
      page_title: document.title,
      referrer: document.referrer || 'direct',
      user_agent: navigator.userAgent,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      session_duration: getSessionDuration(),
      device_type: getDeviceType(),
      browser: getBrowser(),
      os: getOS(),
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

// Track when user leaves the page (for session duration)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    const payload = {
      event_type: 'session_end',
      page_path: window.location.pathname,
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      session_duration: getSessionDuration(),
    };

    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon?.(API_URL, blob);
  });
}
