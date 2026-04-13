import { NextRequest, NextResponse } from 'next/server';
import dns from 'node:dns/promises';
import tls from 'node:tls';

interface SiteAnalysis {
  input: string;
  hostname: string;
  normalizedUrl: string;
  reachable: boolean;
  metrics: {
    overallScore: number;
    dnsHealth: number;
    tlsStrength: number;
    headerProtection: number;
    threatExposure: number;
  };
  details: {
    ipAddresses: string[];
    mxRecords: number;
    certificateIssuer?: string;
    certificateValidTo?: string;
    certificateDaysRemaining?: number;
    tlsProtocol?: string;
    headersFound: string[];
    missingHeaders: string[];
    threats: string[];
  };
}

const SECURITY_HEADERS = [
  'strict-transport-security',
  'content-security-policy',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
];

const TIMEOUT_MS = 7000;

function normalizeInput(input: string) {
  const trimmed = input.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);
  return {
    hostname: parsed.hostname,
    normalizedUrl: parsed.origin,
  };
}

async function getTlsDetails(hostname: string) {
  return new Promise<{
    protocol?: string;
    issuer?: string;
    validTo?: string;
    daysRemaining?: number;
  }>((resolve) => {
    const socket = tls.connect(
      {
        host: hostname,
        port: 443,
        servername: hostname,
        rejectUnauthorized: false,
      },
      () => {
        const cert = socket.getPeerCertificate();
        const validTo = cert?.valid_to;
        const daysRemaining = validTo
          ? Math.floor((new Date(validTo).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : undefined;

        resolve({
          protocol: socket.getProtocol() ?? undefined,
          issuer: Array.isArray(cert?.issuer?.O) ? cert?.issuer?.O.join(", ") : cert?.issuer?.O,
          validTo,
          daysRemaining,
        });
        socket.end();
      }
    );

    socket.setTimeout(TIMEOUT_MS, () => {
      resolve({});
      socket.destroy();
    });

    socket.on('error', () => {
      resolve({});
      socket.destroy();
    });
  });
}

async function analyzeSite(input: string): Promise<SiteAnalysis> {
  const { hostname, normalizedUrl } = normalizeInput(input);

  const threats: string[] = [];
  let ipAddresses: string[] = [];
  let mxRecords = 0;

  try {
    ipAddresses = await dns.resolve4(hostname);
    if (ipAddresses.length === 0) {
      threats.push('No IPv4 DNS records found');
    }
  } catch {
    threats.push('DNS lookup failed');
  }

  try {
    const mx = await dns.resolveMx(hostname);
    mxRecords = mx.length;
  } catch {
    threats.push('MX records are missing or inaccessible');
  }

  const tlsDetails = await getTlsDetails(hostname);

  if (!tlsDetails.protocol) {
    threats.push('TLS handshake failed');
  }

  if ((tlsDetails.daysRemaining ?? 365) < 14) {
    threats.push('TLS certificate is expiring soon');
  }

  let headersFound: string[] = [];
  let missingHeaders: string[] = [];
  let reachable = false;

  try {
    const response = await fetch(normalizedUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    reachable = response.ok;
    headersFound = SECURITY_HEADERS.filter((header) => response.headers.has(header));
    missingHeaders = SECURITY_HEADERS.filter((header) => !response.headers.has(header));

    if (!response.url.startsWith('https://')) {
      threats.push('Site does not enforce HTTPS redirect');
    }
  } catch {
    threats.push('Website is unreachable over HTTPS');
    missingHeaders = [...SECURITY_HEADERS];
  }

  if (missingHeaders.length > 0) {
    threats.push(`${missingHeaders.length} recommended security headers are missing`);
  }

  const dnsHealth = Math.min(100, Math.round((ipAddresses.length > 0 ? 65 : 15) + Math.min(mxRecords, 5) * 7));

  const tlsStrength = Math.max(
    0,
    Math.min(
      100,
      (tlsDetails.protocol?.includes('1.3') ? 65 : tlsDetails.protocol?.includes('1.2') ? 45 : 20) +
        Math.min(Math.max((tlsDetails.daysRemaining ?? 0) / 2, 0), 35)
    )
  );

  const headerProtection = Math.round((headersFound.length / SECURITY_HEADERS.length) * 100);
  const threatExposure = Math.max(0, 100 - threats.length * 12);

  const overallScore = Math.round(
    dnsHealth * 0.2 + tlsStrength * 0.3 + headerProtection * 0.3 + threatExposure * 0.2
  );

  return {
    input,
    hostname,
    normalizedUrl,
    reachable,
    metrics: {
      overallScore,
      dnsHealth,
      tlsStrength,
      headerProtection,
      threatExposure,
    },
    details: {
      ipAddresses,
      mxRecords,
      certificateIssuer: tlsDetails.issuer,
      certificateValidTo: tlsDetails.validTo,
      certificateDaysRemaining: tlsDetails.daysRemaining,
      tlsProtocol: tlsDetails.protocol,
      headersFound,
      missingHeaders,
      threats,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const siteA = body?.siteA as string;
    const siteB = body?.siteB as string;

    if (!siteA || !siteB) {
      return NextResponse.json({ success: false, error: 'Both websites are required.' }, { status: 400 });
    }

    const [analysisA, analysisB] = await Promise.all([analyzeSite(siteA), analyzeSite(siteB)]);

    return NextResponse.json({
      success: true,
      data: {
        siteA: analysisA,
        siteB: analysisB,
        winner:
          analysisA.metrics.overallScore === analysisB.metrics.overallScore
            ? 'tie'
            : analysisA.metrics.overallScore > analysisB.metrics.overallScore
              ? 'siteA'
              : 'siteB',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
