export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold tracking-[0.14em] text-blue-600 uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
      {actions}
    </div>
  );
}
