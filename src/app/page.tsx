'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Globe, ShieldCheck, Sparkles } from 'lucide-react';

interface SiteResult {
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

interface CompareResult {
  siteA: SiteResult;
  siteB: SiteResult;
  winner: 'siteA' | 'siteB' | 'tie';
}

const metricConfig = [
  { key: 'dnsHealth', label: 'DNS Health' },
  { key: 'tlsStrength', label: 'TLS Strength' },
  { key: 'headerProtection', label: 'Header Protection' },
  { key: 'threatExposure', label: 'Threat Resistance' },
] as const;

function RadarGraph({ siteA, siteB }: { siteA: SiteResult; siteB: SiteResult }) {
  const pointsA = useMemo(() => {
    return metricConfig
      .map((metric, index) => {
        const value = siteA.metrics[metric.key] / 100;
        const angle = (Math.PI * 2 * index) / metricConfig.length - Math.PI / 2;
        const r = value * 140;
        return `${180 + Math.cos(angle) * r},${180 + Math.sin(angle) * r}`;
      })
      .join(' ');
  }, [siteA]);

  const pointsB = useMemo(() => {
    return metricConfig
      .map((metric, index) => {
        const value = siteB.metrics[metric.key] / 100;
        const angle = (Math.PI * 2 * index) / metricConfig.length - Math.PI / 2;
        const r = value * 140;
        return `${180 + Math.cos(angle) * r},${180 + Math.sin(angle) * r}`;
      })
      .join(' ');
  }, [siteB]);

  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-4 shadow-[0_0_80px_rgba(34,211,238,0.2)]">
      <h3 className="mb-4 text-lg font-semibold text-cyan-200">Security Comparison Graph</h3>
      <svg viewBox="0 0 360 360" className="mx-auto h-[320px] w-full max-w-[460px]">
        {[40, 80, 120, 140].map((radius) => (
          <circle key={radius} cx="180" cy="180" r={radius} fill="none" stroke="rgba(148,163,184,0.25)" />
        ))}
        {metricConfig.map((metric, index) => {
          const angle = (Math.PI * 2 * index) / metricConfig.length - Math.PI / 2;
          return (
            <g key={metric.key}>
              <line
                x1="180"
                y1="180"
                x2={180 + Math.cos(angle) * 150}
                y2={180 + Math.sin(angle) * 150}
                stroke="rgba(148,163,184,0.3)"
              />
              <text
                x={180 + Math.cos(angle) * 165}
                y={180 + Math.sin(angle) * 165}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgb(186,230,253)"
                fontSize="12"
              >
                {metric.label}
              </text>
            </g>
          );
        })}

        <polygon points={pointsA} fill="rgba(59,130,246,0.35)" stroke="rgba(96,165,250,1)" strokeWidth="3" />
        <polygon points={pointsB} fill="rgba(236,72,153,0.35)" stroke="rgba(244,114,182,1)" strokeWidth="3" />
      </svg>
      <div className="mt-3 flex flex-wrap gap-5 text-sm text-slate-200">
        <span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded bg-blue-400" /> {siteA.hostname}</span>
        <span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded bg-pink-400" /> {siteB.hostname}</span>
      </div>
    </div>
  );
}

function MetricBar({ label, a, b }: { label: string; a: number; b: number }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-300">{label}</p>
      <div className="space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-blue-400" style={{ width: `${a}%` }} />
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-pink-400" style={{ width: `${b}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [siteA, setSiteA] = useState('openai.com');
  const [siteB, setSiteB] = useState('cloudflare.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CompareResult | null>(null);

  const runComparison = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/security/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteA, siteB }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'Failed to compare websites.');
      }

      setResult(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f172a_0%,#020617_65%)] px-6 py-8 md:px-10">
      <section className="relative overflow-hidden rounded-3xl border border-sky-400/20 bg-slate-900/70 p-8 shadow-[0_0_80px_rgba(14,165,233,0.15)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-10 h-36 w-36 rounded-full bg-fuchsia-500/20 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-1 text-xs text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" /> 3D Cyber Defense Dashboard
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Website DNS & Threat Optimizer
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Compare two websites in real time. We inspect DNS health, TLS setup, and secure-header posture to reveal potential threats with a cool visual graph.
          </p>

          <form onSubmit={runComparison} className="mt-8 grid gap-4 rounded-2xl border border-slate-700/70 bg-slate-950/60 p-5 md:grid-cols-[1fr_1fr_auto]">
            <label className="space-y-2">
              <span className="text-sm text-slate-300">Website A</span>
              <input
                value={siteA}
                onChange={(e) => setSiteA(e.target.value)}
                placeholder="example.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300">Website B</span>
              <input
                value={siteB}
                onChange={(e) => setSiteB(e.target.value)}
                placeholder="another-site.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-fuchsia-400"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="h-fit self-end rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-3 font-semibold text-slate-950 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Analyzing...' : 'Compare Now'}
            </button>
          </form>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}
        </div>
      </section>

      {result && (
        <section className="mt-8 grid gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {[result.siteA, result.siteB].map((site, index) => (
              <article
                key={site.hostname + index}
                className="transform-gpu rounded-3xl border border-slate-700 bg-slate-900/70 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_50px_rgba(56,189,248,0.18)]"
                style={{ perspective: 900 }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{site.normalizedUrl}</p>
                    <h2 className="text-2xl font-bold text-white">{site.hostname}</h2>
                  </div>
                  <div className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-cyan-200">
                    Score {site.metrics.overallScore}
                  </div>
                </div>

                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2"><Globe className="h-4 w-4 text-cyan-300" /> DNS IPs: {site.details.ipAddresses.join(', ') || 'N/A'}</li>
                  <li>Protocol: {site.details.tlsProtocol ?? 'Unavailable'} • Cert issuer: {site.details.certificateIssuer ?? 'Unavailable'}</li>
                  <li>Security headers found: {site.details.headersFound.length} / 6</li>
                </ul>

                <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                  <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">Threat Signals</p>
                  <ul className="space-y-1 text-sm text-rose-200">
                    {site.details.threats.length === 0 ? (
                      <li className="flex items-center gap-2 text-emerald-300"><ShieldCheck className="h-4 w-4" /> No high-priority threats detected</li>
                    ) : (
                      site.details.threats.map((threat) => <li key={threat}>• {threat}</li>)
                    )}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          <RadarGraph siteA={result.siteA} siteB={result.siteB} />

          <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5">
            <h3 className="mb-4 text-lg font-semibold text-white">Metric Breakdown</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {metricConfig.map((metric) => (
                <MetricBar
                  key={metric.key}
                  label={metric.label}
                  a={result.siteA.metrics[metric.key]}
                  b={result.siteB.metrics[metric.key]}
                />
              ))}
            </div>
            <p className="mt-5 text-sm text-slate-300">
              Winner:{' '}
              <span className="font-semibold text-cyan-300">
                {result.winner === 'tie'
                  ? 'Tie'
                  : result.winner === 'siteA'
                    ? result.siteA.hostname
                    : result.siteB.hostname}
              </span>
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
