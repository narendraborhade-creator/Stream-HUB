'use client';

import { useMemo, useState } from 'react';
import { ShieldCheck, Radar, Globe2, Activity } from 'lucide-react';

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

const metricKeys: Array<keyof SecurityReport['metrics']> = [
  'dnsScore',
  'tlsScore',
  'headersScore',
  'reputationScore',
  'overallScore',
];

const metricLabel: Record<keyof SecurityReport['metrics'], string> = {
  dnsScore: 'DNS',
  tlsScore: 'TLS',
  headersScore: 'Headers',
  reputationScore: 'Reputation',
  overallScore: 'Overall',
};

export default function Home() {
  const [siteA, setSiteA] = useState('google.com');
  const [siteB, setSiteB] = useState('github.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reports, setReports] = useState<SecurityReport[]>([]);
  const [winner, setWinner] = useState('');

  const radarShapes = useMemo(() => {
    if (reports.length !== 2) return null;

    const center = 150;
    const radius = 110;

    const createPoints = (metrics: SecurityReport['metrics']) => {
      return metricKeys
        .map((key, index) => {
          const angle = (Math.PI * 2 * index) / metricKeys.length - Math.PI / 2;
          const ratio = metrics[key] / 100;
          const x = center + Math.cos(angle) * radius * ratio;
          const y = center + Math.sin(angle) * radius * ratio;
          return `${x},${y}`;
        })
        .join(' ');
    };

    return {
      a: createPoints(reports[0].metrics),
      b: createPoints(reports[1].metrics),
    };
  }, [reports]);

  const compareSites = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/security/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteA, siteB }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Comparison failed.');
      }

      setReports(data.reports);
      setWinner(data.winner);
    } catch (err) {
      setReports([]);
      setWinner('');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-8 py-10 relative overflow-hidden">
      <div className="absolute inset-0 security-grid opacity-40" />
      <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full blur-3xl bg-fuchsia-600/30 animate-pulse" />
      <div className="absolute -bottom-24 right-10 w-80 h-80 rounded-full blur-3xl bg-cyan-600/30 animate-pulse" />

      <div className="relative z-10 space-y-8">
        <section className="glass rounded-3xl p-8 border border-white/10 shadow-2xl shadow-purple-900/20">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="text-cyan-300" />
            <span className="text-cyan-300 font-semibold uppercase tracking-wider text-sm">RevDevelop Security Studio</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 leading-tight">3D DNS Threat Comparator</h1>
          <p className="text-gray-300 max-w-2xl">Compare two websites in real time using DNS resilience, TLS reachability, and security-header hardening signals. See who wins on a dashing visual graph.</p>
        </section>

        <form onSubmit={compareSites} className="grid lg:grid-cols-3 gap-6 items-end">
          <label className="glass rounded-2xl p-5 border border-white/10 block transform-gpu hover:-translate-y-1 transition-transform">
            <span className="text-sm text-gray-400">Website A</span>
            <input
              value={siteA}
              onChange={(event) => setSiteA(event.target.value)}
              className="mt-2 w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="example.com"
            />
          </label>
          <label className="glass rounded-2xl p-5 border border-white/10 block transform-gpu hover:-translate-y-1 transition-transform">
            <span className="text-sm text-gray-400">Website B</span>
            <input
              value={siteB}
              onChange={(event) => setSiteB(event.target.value)}
              className="mt-2 w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
              placeholder="example.org"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="h-[72px] rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 font-bold text-lg hover:scale-[1.02] disabled:opacity-60 transition-transform"
          >
            {loading ? 'Scanning...' : 'Run Threat Comparison'}
          </button>
        </form>

        {error && <p className="text-red-300 bg-red-900/30 border border-red-400/30 px-4 py-3 rounded-xl">{error}</p>}

        {reports.length === 2 && radarShapes && (
          <section className="grid xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Radar className="w-5 h-5 text-cyan-300" />
                <h2 className="font-semibold text-xl">Security Battle Graph</h2>
              </div>

              <div className="relative overflow-auto">
                <svg viewBox="0 0 300 300" className="w-full max-w-[520px] mx-auto">
                  {[20, 40, 60, 80, 100].map((ring) => (
                    <circle
                      key={ring}
                      cx="150"
                      cy="150"
                      r={(110 * ring) / 100}
                      stroke="rgba(255,255,255,0.15)"
                      fill="none"
                    />
                  ))}
                  <polygon points={radarShapes.a} fill="rgba(34, 211, 238, 0.35)" stroke="#22d3ee" strokeWidth="2" />
                  <polygon points={radarShapes.b} fill="rgba(217, 70, 239, 0.35)" stroke="#d946ef" strokeWidth="2" />
                </svg>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-300" />
                <h3 className="font-semibold text-lg">Winner</h3>
              </div>
              <p className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-fuchsia-300 text-transparent bg-clip-text">{winner}</p>
              <p className="text-sm text-gray-300">Scoring weighs DNS, TLS readiness, and header hygiene. Use this as a baseline, not a full pentest.</p>
            </div>

            {reports.map((report, index) => (
              <article key={report.normalizedDomain} className="glass rounded-3xl p-6 border border-white/10 space-y-3 transform-gpu hover:-translate-y-1 transition-transform">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Globe2 className="w-4 h-4" /> {report.normalizedDomain}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${index === 0 ? 'bg-cyan-400/20 text-cyan-300' : 'bg-fuchsia-400/20 text-fuchsia-300'}`}>Site {index + 1}</span>
                </div>

                <div className="space-y-2">
                  {metricKeys.map((key) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs text-gray-300 mb-1">
                        <span>{metricLabel[key]}</span>
                        <span>{Math.round(report.metrics[key])}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full ${index === 0 ? 'bg-cyan-400' : 'bg-fuchsia-400'}`}
                          style={{ width: `${report.metrics[key]}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                  {report.insights.map((insight) => (
                    <li key={insight}>{insight}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
