import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const STEPS = [
  {
    n: 1,
    title: 'Andaa kompyuta',
    body: 'Tumia kompyuta ya Windows itakayobaki ikiwa ONLINE karibu na MikroTik (imeunganishwa kwa cable/LAN). Sakinisha Node.js kutoka nodejs.org (toleo 18+).',
  },
  {
    n: 2,
    title: 'Tengeneza Agent + Token',
    body: 'Nenda kichupo cha "Agents", bonyeza "Tengeneza agent", kisha nakili Agent Token (inaonyeshwa mara moja tu).',
  },
  {
    n: 3,
    title: 'Sakinisha na Sanidi',
    body: 'Kwenye kompyuta ya MikroTik, bonyeza install.bat. Setup Wizard itafunguka — weka Token + taarifa za MikroTik, bonyeza "Jaribu Muunganisho", kisha "Hifadhi".',
  },
  {
    n: 4,
    title: 'Washa Service ya 24/7',
    body: 'Bonyeza kulia install-service.bat, chagua "Run as administrator". Agent itaendesha 24/7 na itajianzisha kila kompyuta inapowashwa.',
  },
  {
    n: 5,
    title: 'Thibitisha',
    body: 'Rudi hapa au nenda Routers. Router yako itaonyesha ONLINE (nukta ya kijani). Umemaliza — sasa unaweza kusimamia hotspot kutoka dashboard popote.',
  },
];

export function AgentInstallGuide() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-800 dark:bg-sky-900/20 dark:text-sky-200">
        <div className="flex items-center gap-2 font-medium">
          <ArrowDownTrayIcon className="h-5 w-5" />
          Kuhusu Agent
        </div>
        <p className="mt-1">
          Agent ni programu ndogo inayounganisha MikroTik yako na mfumo. Inaendesha
          kwenye kompyuta ya karibu na MikroTik. Ukishaisakinisha mara moja, inajiendesha
          yenyewe — huhitaji kuifungua tena.
        </p>
      </div>

      <ol className="space-y-3">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-3 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
              {s.n}
            </span>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{s.title}</p>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="text-xs text-slate-400">
        Faili za usakinishaji (install.bat, install-service.bat) na mwongozo kamili
        (INSTALL-GUIDE.md) zinapatikana kwenye kifurushi cha Agent ulichopewa.
      </p>
    </div>
  );
}
