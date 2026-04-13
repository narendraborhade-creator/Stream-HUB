'use client';

import { useMemo, useState } from 'react';
import { ShieldCheck, Radar, Globe2, AlertTriangle, Sparkles } from 'lucide-react';

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

interface ComparisonResponse {
  success: boolean;
  error?: string;
  data?: {
    websiteA: WebsiteSecurityReport;
    websiteB: WebsiteSecurityReport;
  };
}

const metricMeta = [
  { key: 'score', label: 'Overall Score' },
  { key: 'ssl', label: 'TLS Health' },
  { key: 'headers', label: 'Header Hardening' },
  { key: 'dns', label: 'DNS Integrity' },
] as const;

export default function Home() {
  const [websiteA, setWebsiteA] = useState('google.com');
  const [websiteB, setWebsiteB] = useState('cloudflare.com');
  const [result, setResult] = useState<ComparisonResponse['data']>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const graphData = useMemo(() => {
    if (!result) return null;

    const normalizeHeaders = (site: WebsiteSecurityReport) => {
      const values = [site.securityHeaders.hsts, site.securityHeaders.csp, site.securityHeaders.xFrameOptions];
      return (values.filter(Boolean).length / values.length) * 100;
    };

    const normalizeDns = (site: WebsiteSecurityReport) => {
      const values = [site.hasCAARecord, site.hasIPv6, site.dnssecSignal];
      return (values.filter(Boolean).length / values.length) * 100;
    };

    const normalizeTls = (site: WebsiteSecurityReport) => {
      if (!site.httpsReachable) return 0;
      return Math.min(100, (site.sslValidDays / 90) * 100);
    };

    return {
      websiteA: {
        score: result.websiteA.score,
        ssl: normalizeTls(result.websiteA),
        headers: normalizeHeaders(result.websiteA),
        dns: normalizeDns(result.websiteA),
      },
      websiteB: {
        score: result.websiteB.score,
        ssl: normalizeTls(result.websiteB),
        headers: normalizeHeaders(result.websiteB),
        dns: normalizeDns(result.websiteB),
      },
    };
  }, [result]);

  const runComparison = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/security-compare', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ websiteA, websiteB }),
      });

      const payload = (await response.json()) as ComparisonResponse;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? 'Failed to compare websites.');
      }

      setResult(payload.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden px-6 pb-20 pt-10 md:px-12">
      <div className="hero-3d absolute inset-0 -z-10 opacity-80" />

      <section className="mx-auto max-w-6xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-2 text-sm text-fuchsia-100">
          <Sparkles className="h-4 w-4" />
          Infosys-grade Network Threat Optimizer
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
          Compare DNS Security & Threat Surface of Any Two Websites
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-300">
          Built with React + Node.js analysis pipeline. Run instant posture checks for DNS integrity, TLS health,
          security headers, and suspicious domain threat indicators.
        </p>
      </section>

      <section className="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_1fr]">
        <form className="glass-3d rounded-3xl p-6" onSubmit={runComparison}>
          <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
            <Radar className="h-5 w-5 text-cyan-300" />
            Security Duel Setup
          </h2>

          <div className="space-y-4">
            <label className="block text-sm text-slate-200">
              Website A
              <input
                value={websiteA}
                onChange={(event) => setWebsiteA(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                placeholder="example.com"
                required
              />
            </label>
            <label className="block text-sm text-slate-200">
              Website B
              <input
                value={websiteB}
                onChange={(event) => setWebsiteB(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-fuchsia-400"
                placeholder="another-example.com"
                required
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-5 py-3 font-bold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Scanning threat vectors…' : 'Compare Websites'}
          </button>

          {error ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-rose-300">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </p>
          ) : null}
        </form>

        <div className="glass-3d rounded-3xl p-6">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
            <Globe2 className="h-5 w-5 text-cyan-200" />
            Cool Security Graph
          </h2>

          {!graphData ? (
            <p className="text-slate-300">Run a comparison to generate your interactive graph.</p>
          ) : (
            <div className="space-y-4">
              {metricMeta.map((metric) => {
                const aValue = graphData.websiteA[metric.key];
                const bValue = graphData.websiteB[metric.key];

                return (
                  <div key={metric.key}>
                    <div className="mb-2 flex justify-between text-sm text-slate-200">
                      <span>{metric.label}</span>
                      <span>{Math.round(aValue)} vs {Math.round(bValue)}</span>
                    </div>
                    <div className="relative h-4 overflow-hidden rounded-full bg-slate-800/70">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-cyan-400/80 transition-all duration-700"
                        style={{ width: `${aValue}%` }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-fuchsia-400/70 mix-blend-screen transition-all duration-700"
                        style={{ width: `${bValue}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {result ? (
        <section className="mx-auto mt-8 grid max-w-6xl gap-6 md:grid-cols-2">
          {[result.websiteA, result.websiteB].map((website, index) => (
            <article key={website.hostname + index} className="glass-3d rotate-3d rounded-3xl p-6">
              <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                {website.hostname}
              </h3>
              <p className="mt-2 text-sm text-slate-300">Security Score: {website.score}/100</p>
              <ul className="mt-4 space-y-1 text-sm text-slate-300">
                <li>Resolved IP: {website.resolvedIp ?? 'Not resolved'}</li>
                <li>HTTPS Reachable: {website.httpsReachable ? 'Yes' : 'No'}</li>
                <li>SSL Validity Remaining: {website.sslValidDays} days</li>
                <li>CAA Record: {website.hasCAARecord ? 'Present' : 'Missing'}</li>
                <li>IPv6 Enabled: {website.hasIPv6 ? 'Yes' : 'No'}</li>
              </ul>

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-rose-200">Threat Signals</h4>
                {website.threatSignals.length === 0 ? (
                  <p className="mt-1 text-sm text-emerald-300">No major threat signals detected.</p>
                ) : (
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-rose-200">
                    {website.threatSignals.map((signal) => (
                      <li key={signal}>{signal}</li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
