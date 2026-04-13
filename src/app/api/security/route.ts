import { NextResponse } from 'next/server';
import dns from 'node:dns/promises';

type HeaderName =
  | 'strict-transport-security'
  | 'content-security-policy'
  | 'x-frame-options'
  | 'x-content-type-options'
  | 'referrer-policy'
  | 'permissions-policy';

interface ScanResult {
  target: string;
  hostname: string;
  scannedAt: string;
  dns: {
    aRecords: string[];
    mxRecords: string[];
    nsRecords: string[];
    dnssecSignals: string[];
  };
  securityHeaders: Record<HeaderName, boolean>;
  tls: {
    httpsReachable: boolean;
    finalUrl: string;
  };
  threatSignals: string[];
  score: number;
}

const HEADER_KEYS: HeaderName[] = [
  'strict-transport-security',
  'content-security-policy',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
];

function normalizeTarget(input: string): { hostname: string; target: string } {
  const trimmed = input.trim();
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(candidate);

  if (!parsed.hostname || parsed.hostname.includes(' ')) {
    throw new Error('Invalid website URL or hostname.');
  }

  return {
    hostname: parsed.hostname.toLowerCase(),
    target: parsed.toString(),
  };
}

function calculateScore(result: Omit<ScanResult, 'score'>): number {
  let score = 40;

  const headerCount = Object.values(result.securityHeaders).filter(Boolean).length;
  score += headerCount * 8;

  if (result.tls.httpsReachable) {
    score += 10;
  }

  if (result.dns.mxRecords.length > 0) {
    score += 3;
  }

  if (result.dns.dnssecSignals.length > 0) {
    score += 5;
  }

  score -= result.threatSignals.length * 9;

  return Math.max(1, Math.min(100, score));
}

async function getHeaders(hostname: string) {
  try {
    const res = await fetch(`https://${hostname}`, {
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'user-agent': 'StreamHub Security Scanner/1.0',
      },
    });

    const securityHeaders = HEADER_KEYS.reduce(
      (acc, key) => ({ ...acc, [key]: Boolean(res.headers.get(key)) }),
      {} as Record<HeaderName, boolean>
    );

    return {
      securityHeaders,
      httpsReachable: res.ok || res.status < 500,
      finalUrl: res.url,
    };
  } catch {
    return {
      securityHeaders: HEADER_KEYS.reduce(
        (acc, key) => ({ ...acc, [key]: false }),
        {} as Record<HeaderName, boolean>
      ),
      httpsReachable: false,
      finalUrl: `https://${hostname}`,
    };
  }
}

async function scanTarget(input: string): Promise<ScanResult> {
  const { hostname, target } = normalizeTarget(input);

  const [aRecords, mxRecords, nsRecords, txtRecords, headerData] = await Promise.all([
    dns.resolve4(hostname).catch(() => [] as string[]),
    dns.resolveMx(hostname).catch(() => [] as Array<{ exchange: string; priority: number }>),
    dns.resolveNs(hostname).catch(() => [] as string[]),
    dns.resolveTxt(hostname).catch(() => [] as string[][]),
    getHeaders(hostname),
  ]);

  const flattenedTxt = txtRecords.flat().map((entry) => entry.toLowerCase());
  const dnssecSignals = flattenedTxt.filter(
    (entry) => entry.includes('v=dmarc1') || entry.includes('v=spf1')
  );

  const threatSignals: string[] = [];

  if (aRecords.length === 0) {
    threatSignals.push('No A records found: DNS availability risk.');
  }

  if (!headerData.httpsReachable) {
    threatSignals.push('HTTPS endpoint did not respond successfully.');
  }

  if (!headerData.securityHeaders['content-security-policy']) {
    threatSignals.push('Missing Content-Security-Policy header.');
  }

  if (!headerData.securityHeaders['strict-transport-security']) {
    threatSignals.push('Missing HSTS header.');
  }

  if (nsRecords.length < 2) {
    threatSignals.push('Low nameserver redundancy.');
  }

  const baseResult: Omit<ScanResult, 'score'> = {
    target,
    hostname,
    scannedAt: new Date().toISOString(),
    dns: {
      aRecords,
      mxRecords: mxRecords.map((record) => record.exchange),
      nsRecords,
      dnssecSignals,
    },
    securityHeaders: headerData.securityHeaders,
    tls: {
      httpsReachable: headerData.httpsReachable,
      finalUrl: headerData.finalUrl,
    },
    threatSignals,
  };

  return {
    ...baseResult,
    score: calculateScore(baseResult),
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { primary?: string; secondary?: string };

    if (!body.primary || !body.secondary) {
      return NextResponse.json(
        { success: false, error: 'Both websites are required for comparison.' },
        { status: 400 }
      );
    }

    const [primary, secondary] = await Promise.all([
      scanTarget(body.primary),
      scanTarget(body.secondary),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        primary,
        secondary,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected scan failure.';

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
