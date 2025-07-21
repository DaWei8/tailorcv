// app/dashboard/layout.tsx
export default function ProfilesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-gray-100">
      <main className="mx-auto w-full">{children}</main>
    </div>
  );
}