import { NextResponse } from 'next/server';
import dns from 'node:dns/promises';
import tls from 'node:tls';

interface WebsiteSecurityReport {
  input: string;
  hostname: string;
  resolvedIp: string | null;
  httpsReachable: boolean;
  sslValidDays: number;
  hasCAARecord: boolean;
  hasIPv6: boolean;
  dnssecSignal: boolean;
  securityHeaders: {
    hsts: boolean;
    csp: boolean;
    xFrameOptions: boolean;
  };
  threatSignals: string[];
  score: number;
}

const TIMEOUT_MS = 5000;

function normalizeWebsite(input: string): URL {
  const candidate = input.startsWith('http://') || input.startsWith('https://')
    ? input
    : `https://${input}`;

  return new URL(candidate);
}

function scoreWebsite(report: Omit<WebsiteSecurityReport, 'score'>): number {
  let score = 30;

  if (report.httpsReachable) score += 20;
  if (report.sslValidDays > 15) score += 15;
  if (report.hasCAARecord) score += 10;
  if (report.hasIPv6) score += 5;
  if (report.dnssecSignal) score += 10;

  if (report.securityHeaders.hsts) score += 4;
  if (report.securityHeaders.csp) score += 4;
  if (report.securityHeaders.xFrameOptions) score += 2;

  score -= report.threatSignals.length * 8;

  return Math.max(0, Math.min(100, score));
}

async function fetchCertificateLifetime(hostname: string): Promise<number> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: hostname,
        port: 443,
        servername: hostname,
        rejectUnauthorized: false,
        timeout: TIMEOUT_MS,
      },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();

        if (!cert || !cert.valid_to) {
          resolve(0);
          return;
        }

        const validTo = new Date(cert.valid_to).getTime();
        const days = Math.max(0, Math.round((validTo - Date.now()) / (1000 * 60 * 60 * 24)));
        resolve(days);
      }
    );

    socket.on('error', () => resolve(0));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(0);
    });
  });
}

async function inspectWebsite(input: string): Promise<WebsiteSecurityReport> {
  const url = normalizeWebsite(input);
  const hostname = url.hostname;

  const threatSignals: string[] = [];

  if (hostname.includes('xn--')) {
    threatSignals.push('Contains punycode characters (potential homograph risk).');
  }

  if (/\.(zip|click|top|gq|work)$/.test(hostname)) {
    threatSignals.push('Uses a high-risk top-level domain often abused for phishing.');
  }

  let resolvedIp: string | null = null;
  let httpsReachable = false;
  let hasCAARecord = false;
  let hasIPv6 = false;
  let dnssecSignal = false;

  const [aRecords, aaaaRecords, caaRecords, nsRecords, sslValidDays] = await Promise.allSettled([
    dns.resolve4(hostname),
    dns.resolve6(hostname),
    dns.resolveCaa(hostname),
    dns.resolveNs(hostname),
    fetchCertificateLifetime(hostname),
  ]);

  if (aRecords.status === 'fulfilled' && aRecords.value.length > 0) {
    [resolvedIp] = aRecords.value;
  }

  if (aaaaRecords.status === 'fulfilled' && aaaaRecords.value.length > 0) {
    hasIPv6 = true;
  }

  if (caaRecords.status === 'fulfilled' && caaRecords.value.length > 0) {
    hasCAARecord = true;
  }

  if (nsRecords.status === 'fulfilled' && nsRecords.value.length >= 2) {
    dnssecSignal = true;
  }

  const sslDays = sslValidDays.status === 'fulfilled' ? sslValidDays.value : 0;

  const securityHeaders = {
    hsts: false,
    csp: false,
    xFrameOptions: false,
  };

  try {
    const response = await fetch(`https://${hostname}`, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'user-agent': 'StreamHUB Security Checker',
      },
    });

    httpsReachable = response.ok;

    securityHeaders.hsts = Boolean(response.headers.get('strict-transport-security'));
    securityHeaders.csp = Boolean(response.headers.get('content-security-policy'));
    securityHeaders.xFrameOptions = Boolean(response.headers.get('x-frame-options'));
  } catch {
    threatSignals.push('Website is unreachable over HTTPS or timed out.');
  }

  if (!securityHeaders.csp) {
    threatSignals.push('Missing Content-Security-Policy header.');
  }

  if (sslDays <= 0) {
    threatSignals.push('TLS certificate missing, invalid, or cannot be verified.');
  }

  const baseReport = {
    input,
    hostname,
    resolvedIp,
    httpsReachable,
    sslValidDays: sslDays,
    hasCAARecord,
    hasIPv6,
    dnssecSignal,
    securityHeaders,
    threatSignals,
  };

  return {
    ...baseReport,
    score: scoreWebsite(baseReport),
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { websiteA?: string; websiteB?: string };

    if (!body.websiteA || !body.websiteB) {
      return NextResponse.json({ success: false, error: 'Both website URLs are required.' }, { status: 400 });
    }

    const [websiteA, websiteB] = await Promise.all([
      inspectWebsite(body.websiteA),
      inspectWebsite(body.websiteB),
    ]);

    return NextResponse.json({
      success: true,
      comparedAt: new Date().toISOString(),
      data: {
        websiteA,
        websiteB,
      },
    });
  } catch (error) {
    console.error('Security comparison failed:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to process security comparison. Verify URLs and retry.' },
      { status: 500 }
    );
  }
}
