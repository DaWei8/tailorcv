// app/dashboard/layout.tsx
export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}