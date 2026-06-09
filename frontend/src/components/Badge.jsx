const variants = {
  active: 'bg-gatex-green text-white',
  inactive: 'bg-red-500 text-white',
  get: 'bg-gatex-green text-white',
  post: 'bg-blue-500 text-white',
  delete: 'bg-red-500 text-white',
  patch: 'bg-purple-500 text-white',
  put: 'bg-orange-500 text-white',
  '200': 'bg-gatex-green text-white',
  '201': 'bg-gatex-green text-white',
  '429': 'bg-orange-500 text-white',
  '500': 'bg-red-500 text-white',
  yes: 'bg-red-500 text-white',
  no: 'bg-gatex-green text-white',
  default: 'bg-slate-600 text-white',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  const style = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center rounded-md border border-black/30 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${style} ${className}`}
    >
      {children}
    </span>
  );
}
