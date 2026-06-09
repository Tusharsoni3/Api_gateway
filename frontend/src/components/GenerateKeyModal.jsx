import { useState } from 'react';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function GenerateKeyModal({ isOpen, onClose, onSubmit, loading }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setName('');
    setUrl('');
    setError('');
    setGeneratedKey(null);
    setCopied(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !url.trim()) {
      setError('Name and URL are required');
      return;
    }

    try {
      const result = await onSubmit({ name: name.trim(), URL: url.trim() });
      setGeneratedKey(result);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setError(Object.values(data.errors).flat().join('. '));
      } else {
        setError(data?.message || 'Failed to generate key');
      }
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCopy = async () => {
    if (!generatedKey?.key) return;
    await navigator.clipboard.writeText(generatedKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (generatedKey) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="API Key Generated">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-orange-400" />
            <p className="text-sm text-orange-200">
              Copy your API key now. You won&apos;t be able to see the full key again after closing this dialog.
            </p>
          </div>

          <div>
            <p className="mb-1 text-sm text-slate-400">Name</p>
            <p className="font-semibold text-white">{generatedKey.name}</p>
          </div>

          <div>
            <p className="mb-1 text-sm text-slate-400">Target URL</p>
            <p className="break-all text-sm text-slate-300">{generatedKey.url}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Your API Key
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-lg border-2 border-gatex-border bg-gatex-bg px-3 py-2.5 font-mono text-xs text-gatex-green">
                {generatedKey.key}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-lg border-2 border-gatex-border bg-gatex-bg p-2.5 text-slate-400 transition-colors hover:border-gatex-green hover:text-gatex-green"
                title="Copy to clipboard"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-full rounded-lg border-2 border-black bg-gatex-green px-4 py-2.5 text-sm font-bold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] transition-colors hover:bg-gatex-green-hover"
          >
            Done
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate New API Key">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="key-name" className="mb-1.5 block text-sm font-medium text-slate-300">
            Name
          </label>
          <input
            id="key-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Production API"
            className="w-full rounded-lg border-2 border-gatex-border bg-gatex-bg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-colors focus:border-gatex-green"
          />
        </div>
        <div>
          <label htmlFor="key-url" className="mb-1.5 block text-sm font-medium text-slate-300">
            Target URL
          </label>
          <input
            id="key-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://localhost:4000"
            className="w-full rounded-lg border-2 border-gatex-border bg-gatex-bg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-colors focus:border-gatex-green"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-lg border-2 border-gatex-border bg-gatex-bg px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg border-2 border-black bg-gatex-green px-4 py-2.5 text-sm font-bold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] transition-colors hover:bg-gatex-green-hover disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Key'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
