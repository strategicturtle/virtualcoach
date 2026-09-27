export default function AuthShell({
  subtitle,
  children,
}: {
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <h1 className="text-center text-4xl font-extrabold tracking-tight text-gold-shine">
        VirtualCoach
      </h1>
      <p className="mt-2 mb-8 text-center text-muted">{subtitle}</p>
      {children}
    </main>
  );
}
