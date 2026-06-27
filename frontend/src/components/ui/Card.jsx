export default function Card({ children, className = '', hover = false, glass = false }) {
  return (
    <div className={`
      ${glass ? 'glass-card' : 'card'} 
      ${hover ? 'card-hover' : ''} 
      ${className}
    `}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between ${className}`}>
      <div>
        {title && <h3 className="text-lg font-semibold text-slate-800 dark:text-white font-display">{title}</h3>}
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 bg-slate-50/50 dark:bg-dark-800/50 border-t border-slate-100 dark:border-white/5 rounded-b-2xl ${className}`}>
      {children}
    </div>
  );
}
