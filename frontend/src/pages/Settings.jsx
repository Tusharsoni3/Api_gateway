import { Settings as SettingsIcon } from 'lucide-react';
import Layout from '../components/Layout';

export default function Settings() {
  return (
    <Layout
      title="Settings"
      subtitle="Configure your account and gateway preferences."
    >
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-gatex-border bg-gatex-card px-6 py-20 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl border-2 border-gatex-border bg-gatex-bg text-slate-500">
          <SettingsIcon size={28} />
        </div>
        <h2 className="text-lg font-bold text-white">Settings Coming Soon</h2>
        <p className="mt-2 max-w-sm text-center text-sm text-slate-400">
          Account settings, notification preferences, and team management will be available here.
        </p>
      </div>
    </Layout>
  );
}
