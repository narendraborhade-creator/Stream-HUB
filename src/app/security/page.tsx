'use client';

import { FormEvent, useMemo, useState } from 'react';
import { ShieldCheck, Radar, AlertTriangle, Binary, Sparkles } from 'lucide-react';

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
  securityHeaders: Record<string, boolean>;
  tls: {
    httpsReachable: boolean;
    finalUrl: string;
  };
  threatSignals: string[];
  score: number;
}

interface ApiResponse {
  success: boolean;
  data?: {
    primary: ScanResult;
    secondary: ScanResult;
  };
  error?: string;
}

const metricPalette = ['from-fuchsia-500 to-purple-500', 'from-cyan-400 to-blue-500'];

export default function SecurityPage() {
  const [primary, setPrimary] = useState('google.com');
  const [secondary, setSecondary] = useState('example.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ApiResponse['data']>();

  const graphData = useMemo(() => {
    if (!result) {
      return [];
    }

    return [
      {
        label: 'DNS Resilience',
        primary: Math.min(100, result.primary.dns.nsRecords.length * 25 + result.primary.dns.aRecords.length * 10),
        secondary: Math.min(
          100,
          result.secondary.dns.nsRecords.length * 25 + result.secondary.dns.aRecords.length * 10
        ),
      },
      {
        label: 'Header Protection',
        primary: Object.values(result.primary.securityHeaders).filter(Boolean).length * 16,
        secondary: Object.values(result.secondary.securityHeaders).filter(Boolean).length * 16,
      },
      {
        label: 'TLS Readiness',
        primary: result.primary.tls.httpsReachable ? 100 : 20,
        secondary: result.secondary.tls.httpsReachable ? 100 : 20,
      },
      {
        label: 'Threat Exposure',
        primary: Math.max(10, 100 - result.primary.threatSignals.length * 18),
        secondary: Math.max(10, 100 - result.secondary.threatSignals.length * 18),
      },
    ];
  }, [result]);

  const handleScan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primary, secondary }),
      });

      const data = (await response.json()) as ApiResponse;
      if (!data.success || !data.data) {
        throw new Error(data.error ?? 'Unable to scan websites.');
      }

      setResult(data.data);
    } catch (scanError) {
      const message = scanError instanceof Error ? scanError.message : 'Unexpected scan issue.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-[radial-gradient(circle_at_top,_#4c1d95_0%,_#030712_50%,_#020617_100%)]">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">
          <div className="absolute -top-14 -right-14 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute -bottom-14 -left-14 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="relative z-10">
            <p className="text-fuchsia-300 uppercase tracking-[0.24em] text-xs mb-4">revdevelop security cockpit</p>
            <h1 className="text-4xl font-black mb-3">3D DNS Threat Comparator</h1>
            <p className="text-gray-300 max-w-3xl">
              Compare two websites for DNS reliability, TLS posture, and critical security headers. Results are
              scored and visualized in an interactive graph for fast analysis.
            </p>
          </div>
        </section>

        <form onSubmit={handleScan} className="grid lg:grid-cols-3 gap-6">
          {[{ label: 'Website A', value: primary, setter: setPrimary }, { label: 'Website B', value: secondary, setter: setSecondary }].map(
            (item, index) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-[0_20px_60px_-30px_rgba(76,29,149,0.9)] transition-transform duration-500 hover:-translate-y-2 hover:rotate-1"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <label className="block text-sm text-gray-300 mb-2">{item.label}</label>
                <input
                  value={item.value}
                  onChange={(event) => item.setter(event.target.value)}
                  placeholder="e.g. github.com"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                  required
                />
                <p className="mt-3 text-xs text-gray-400">Node #{index + 1} for real-time security check.</p>
              </div>
            )
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-gradient-to-br from-fuchsia-600 to-cyan-500 p-6 text-left font-semibold text-white shadow-[0_20px_70px_-25px_rgba(6,182,212,0.8)] transition hover:scale-[1.02] disabled:opacity-60"
          >
            <Sparkles className="w-7 h-7 mb-4" />
            {loading ? 'Scanning network posture...' : 'Launch Security Scan'}
            <p className="text-sm mt-3 text-white/80">Analyze DNS, TLS and web defenses with Node.js API intelligence.</p>
          </button>
        </form>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {result && (
          <>
            <section className="grid md:grid-cols-2 gap-6">
              {[result.primary, result.secondary].map((site) => (
                <article key={site.hostname} className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg">{site.hostname}</h2>
                    <span className="text-2xl font-black text-cyan-300">{site.score}</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2"><Binary className="w-4 h-4 text-fuchsia-400" />A Records: {site.dns.aRecords.length}</li>
                    <li className="flex items-center gap-2"><Radar className="w-4 h-4 text-fuchsia-400" />Name Servers: {site.dns.nsRecords.length}</li>
                    <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-fuchsia-400" />Threat Flags: {site.threatSignals.length}</li>
                  </ul>
                </article>
              ))}
            </section>

            <section className="rounded-3xl border border-white/10 bg-black/30 p-6">
              <h3 className="text-xl font-bold mb-4">Cool Comparison Graph</h3>
              <div className="space-y-5">
                {graphData.map((metric) => (
                  <div key={metric.label}>
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                      <span>{metric.label}</span>
                      <span>
                        {result.primary.hostname} {metric.primary} vs {result.secondary.hostname} {metric.secondary}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[metric.primary, metric.secondary].map((score, idx) => (
                        <div key={`${metric.label}-${idx}`} className="h-4 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${metricPalette[idx]}`}
                            style={{ width: `${score}%`, transition: 'width 700ms ease' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
