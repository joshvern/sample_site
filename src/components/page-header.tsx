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
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-[#335cff] uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[28px] leading-tight font-bold tracking-[-0.035em] text-slate-950 sm:text-[32px]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
      {actions}
    </div>
  );
}
