import Link from "next/link";

export default function ContentNotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-sm font-bold text-blue-600">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-950">
        Content not found
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        This canonical identity does not exist in the current workspace.
      </p>
      <Link
        href="/content"
        className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
      >
        Return to catalog
      </Link>
    </div>
  );
}
