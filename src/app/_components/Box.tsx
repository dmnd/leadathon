export function Box({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`${className} flex flex-col gap-4 rounded-xl bg-white/10 p-4 shadow-2xl`}
    >
      {children}
    </div>
  );
}
