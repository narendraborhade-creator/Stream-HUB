import { NextRequest, NextResponse } from 'next/server';
import dns from 'node:dns/promises';

interface SecurityReport {
  target: string;
  normalizedDomain: string;
  metrics: {
    dnsScore: number;
    tlsScore: number;
    headersScore: number;
    reputationScore: number;
    overallScore: number;
  };
  checks: {
    resolvesA: boolean;
    resolvesAAAA: boolean;
    hasMx: boolean;
    dnssecHint: boolean;
    supportsHttps: boolean;
    hasHsts: boolean;
    hasCsp: boolean;
    hasXFrameOptions: boolean;
  };
  insights: string[];
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const normalizeDomain = (input: string) => {
  const value = input.trim();
  if (!value) return '';

  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    return url.hostname.toLowerCase();
  } catch {
    return value.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
  }
};

const fetchSecurityHeaders = async (domain: string) => {
  try {
    const response = await fetch(`https://${domain}`, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
    });

    return {
      ok: true,
      hsts: response.headers.has('strict-transport-security'),
      csp: response.headers.has('content-security-policy'),
      xfo: response.headers.has('x-frame-options'),
    };
  } catch {
    return { ok: false, hsts: false, csp: false, xfo: false };
  }
};

const scoreDomain = async (domainInput: string): Promise<SecurityReport> => {
  const domain = normalizeDomain(domainInput);

  if (!domain || domain.includes(' ')) {
    throw new Error(`Invalid domain: ${domainInput}`);
  }

  const [aRecords, aaaaRecords, mxRecords, nsRecords, headerInfo] = await Promise.allSettled([
    dns.resolve4(domain),
    dns.resolve6(domain),
    dns.resolveMx(domain),
    dns.resolveNs(domain),
    fetchSecurityHeaders(domain),
  ]);

  const resolvesA = aRecords.status === 'fulfilled' && aRecords.value.length > 0;
  const resolvesAAAA = aaaaRecords.status === 'fulfilled' && aaaaRecords.value.length > 0;
  const hasMx = mxRecords.status === 'fulfilled' && mxRecords.value.length > 0;
  const hasNs = nsRecords.status === 'fulfilled' && nsRecords.value.length >= 2;
  const headers = headerInfo.status === 'fulfilled'
    ? headerInfo.value
    : { ok: false, hsts: false, csp: false, xfo: false };

  const dnsScore = clamp((resolvesA ? 40 : 0) + (resolvesAAAA ? 20 : 0) + (hasMx ? 20 : 0) + (hasNs ? 20 : 0));
  const tlsScore = clamp(headers.ok ? 90 : 25);
  const headersScore = clamp((headers.hsts ? 35 : 0) + (headers.csp ? 35 : 0) + (headers.xfo ? 30 : 0));
  const reputationScore = clamp(20 + dnsScore * 0.4 + headersScore * 0.4 + tlsScore * 0.2);
  const overallScore = clamp(dnsScore * 0.3 + tlsScore * 0.25 + headersScore * 0.25 + reputationScore * 0.2);

  const insights: string[] = [];
  if (!resolvesA && !resolvesAAAA) insights.push('Domain failed A/AAAA DNS resolution checks.');
  if (!headers.ok) insights.push('HTTPS endpoint was unreachable or timed out during TLS/header probe.');
  if (!headers.csp) insights.push('Content-Security-Policy header not detected; XSS risk can increase.');
  if (!headers.hsts) insights.push('Strict-Transport-Security header missing; downgrade attacks are more likely.');
  if (insights.length === 0) insights.push('No major warning flags from baseline DNS + HTTP header checks.');

  return {
    target: domainInput,
    normalizedDomain: domain,
    metrics: { dnsScore, tlsScore, headersScore, reputationScore, overallScore },
    checks: {
      resolvesA,
      resolvesAAAA,
      hasMx,
      dnssecHint: hasNs,
      supportsHttps: headers.ok,
      hasHsts: headers.hsts,
      hasCsp: headers.csp,
      hasXFrameOptions: headers.xfo,
    },
    insights,
  };
};

export async function POST(request: NextRequest) {
  try {
    const { siteA, siteB } = await request.json();

    if (!siteA || !siteB) {
      return NextResponse.json({ success: false, error: 'Please provide both siteA and siteB.' }, { status: 400 });
    }

    const [reportA, reportB] = await Promise.all([scoreDomain(siteA), scoreDomain(siteB)]);

    return NextResponse.json({
      success: true,
      comparedAt: new Date().toISOString(),
      reports: [reportA, reportB],
      winner: reportA.metrics.overallScore >= reportB.metrics.overallScore ? reportA.normalizedDomain : reportB.normalizedDomain,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Security comparison failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
