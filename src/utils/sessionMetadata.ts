export interface LoginSessionMetadata {
  device: string;
  location: string;
  loginTime: string;
}

/**
 * Parses navigator.userAgent cleanly into a human-readable Device/OS • Browser label
 * such as "iPhone (iOS) • Safari", "Android Mobile • Chrome", "iPad / Tablet • Safari",
 * "Mac OS • Chrome", or "Windows PC • Chrome".
 */
export const detectDeviceAndOs = (): string => {
  if (typeof navigator === 'undefined') {
    return 'Unknown Device • Browser';
  }

  const ua = navigator.userAgent || '';
  const maxTouchPoints = typeof navigator.maxTouchPoints === 'number' ? navigator.maxTouchPoints : 0;

  // 1. Device & Operating System
  let deviceOs = 'Desktop / Web Client';
  if (/iPhone/i.test(ua)) {
    deviceOs = 'iPhone (iOS)';
  } else if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && maxTouchPoints > 1)) {
    deviceOs = 'iPad / Tablet';
  } else if (/Android/i.test(ua)) {
    deviceOs = /Mobile/i.test(ua) ? 'Android Mobile' : 'Android Tablet';
  } else if (/CrOS/i.test(ua)) {
    deviceOs = 'Chromebook (ChromeOS)';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceOs = 'Mac OS';
  } else if (/Windows/i.test(ua)) {
    deviceOs = 'Windows PC';
  } else if (/Linux/i.test(ua)) {
    deviceOs = 'Linux Desktop';
  }

  // 2. Browser Detection (specific tokens before generic Chrome/Safari)
  let browser = 'Browser';
  if (/EdgA|EdgiOS|Edg\//i.test(ua)) {
    browser = 'Edge';
  } else if (/OPR\/|Opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/SamsungBrowser/i.test(ua)) {
    browser = 'Samsung Internet';
  } else if (/Firefox|FxiOS/i.test(ua)) {
    browser = 'Firefox';
  } else if (/CriOS|Chrome\//i.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari\//i.test(ua)) {
    browser = 'Safari';
  }

  return `${deviceOs} • ${browser}`;
};

/**
 * Formats an exact timestamp showing both local readable time and UTC timestamp.
 */
export const formatLoginTimestamp = (date: Date = new Date()): string => {
  const localStr = date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });
  const utcStr = `${date.toISOString().replace('T', ' ').slice(0, 19)} UTC`;
  return `${localStr} (${utcStr})`;
};

/**
 * Fetches visitor's approximate City, Country from https://ipapi.co/json/ with a strict
 * 2-second timeout, falling back to Intl.DateTimeFormat().resolvedOptions().timeZone.
 */
export const detectApproxLocation = async (): Promise<string> => {
  const getTimezoneFallback = (): string => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  };

  if (typeof fetch === 'undefined') {
    return getTimezoneFallback();
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const res = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!res.ok) {
      return getTimezoneFallback();
    }

    const data = (await res.json()) as {
      city?: string;
      country_name?: string;
      country?: string;
    };

    const city = typeof data?.city === 'string' ? data.city.trim() : '';
    const countryName =
      typeof data?.country_name === 'string' && data.country_name.trim()
        ? data.country_name.trim()
        : typeof data?.country === 'string'
        ? data.country.trim()
        : '';

    if (city && countryName) {
      return city.toLowerCase() === countryName.toLowerCase()
        ? countryName
        : `${city}, ${countryName}`;
    }
    if (countryName) {
      return countryName;
    }
    if (city) {
      return city;
    }

    return getTimezoneFallback();
  } catch {
    return getTimezoneFallback();
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Collects real device/OS, IP-based city/country (with timezone fallback), and timestamp.
 */
export const collectLoginSessionMetadata = async (): Promise<LoginSessionMetadata> => {
  const device = detectDeviceAndOs();
  const loginTime = formatLoginTimestamp();
  const location = await detectApproxLocation();

  return { device, location, loginTime };
};
