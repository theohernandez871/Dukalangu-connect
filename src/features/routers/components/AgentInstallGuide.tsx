import { CheckCircleIcon, InboxArrowDownIcon } from '@heroicons/react/24/outline';

const FLOW = ['Fungua', 'Weka Token', 'Jaribu', 'Hifadhi', 'Service', 'ONLINE'];

const STEPS = [
  {
    n: 1,
    title: 'Pata kifurushi cha Agent',
    body: 'Msimamizi wa mfumo atakupa kifurushi cha Agent (faili ya ZIP) kupitia WhatsApp, flash disk, au email. Kipeleke kwenye kompyuta ya Windows itakayobaki karibu na MikroTik.',
  },
  {
    n: 2,
    title: 'Fungua kifurushi',
    body: 'Fungua (extract) ZIP kwenye folda, mfano C:\\hotspot-agent. Hakikisha kompyuta ina Node.js (kutoka nodejs.org, toleo 18+). Kama haipo, isakinishe kwanza.',
  },
  {
    n: 3,
    title: 'Tengeneza Token (hapa dashboard)',
    body: 'Nenda kichupo cha "Agents", bonyeza "Tengeneza agent", nakili Agent Token (inaonyeshwa mara moja tu). Utaihitaji hatua inayofuata.',
  },
  {
    n: 4,
    title: 'Endesha install.bat',
    body: 'Kwenye folda ya Agent, bonyeza mara mbili install.bat. Setup Wizard itafunguka yenyewe kwenye browser ya kompyuta hiyo.',
  },
  {
    n: 5,
    title: 'Jaza Setup Wizard',
    body: 'Weka Agent Token, MikroTik IP, jina + nenosiri la MikroTik, na System URL/Key. Bonyeza "Jaribu Muunganisho" — hakikisha vyote vina alama ya kijani. Kisha "Hifadhi".',
  },
  {
    n: 6,
    title: 'Washa Service ya 24/7',
    body: 'Funga Wizard. Bonyeza kulia install-service.bat, chagua "Run as administrator". Agent itaendesha 24/7 na kujianzisha kila kompyuta inapowashwa.',
  },
  {
    n: 7,
    title: 'Thibitisha ONLINE',
    body: 'Rudi hapa (au Routers). Router yako itaonyesha ONLINE. Umemaliza — sasa unaweza kusimamia hotspot kutoka dashboard popote, hata kwa simu.',
  },
];

export function AgentInstallGuide() {
  return (
    <div className="space-y-5">
      {/* Kidokezo cha kupata kifurushi */}
      <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-5 dark:border-sky-900/40 dark:bg-sky-900/10">
        <div className="flex items-start gap-3">
          <InboxArrowDownIcon className="h-6 w-6 shrink-0 text-sky-600 dark:text-sky-400" />
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Kupata kifurushi cha Agent</h3>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Kifurushi cha Agent hutolewa na msimamizi wa mfumo (kupitia WhatsApp,
              flash disk, au email). Ukishakipata, fuata hatua zilizo hapa chini.
            </p>
          </div>
        </div>
      </div>

      {/* Mtiririko mzima (visual) */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">Mtiririko mzima:</p>
        <div className="flex flex-wrap items-center gap-2">
          {FLOW.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="rounded-lg bg-primary-600/10 px-3 py-1.5 text-sm font-medium text-primary-700 dark:text-primary-300">
                {step}
              </span>
              {i < FLOW.length - 1 && <span className="text-slate-300">&rarr;</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Hatua kwa hatua */}
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

      {/* Mahitaji */}
      <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
        <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Mahitaji:</p>
        <ul className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
          {[
            'Kompyuta ya Windows inayobaki ON 24/7 karibu na MikroTik',
            'Node.js 18+ (kutoka nodejs.org)',
            'MikroTik imeunganishwa kwa cable/LAN na kompyuta hiyo',
            'Agent Token (unaitengeneza kwenye kichupo cha Agents)',
          ].map((req) => (
            <li key={req} className="flex items-start gap-2">
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              {req}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
