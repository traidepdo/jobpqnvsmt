import EmployerShell from '@/components/employer/EmployerShell';

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        rel="stylesheet"
      />
      <EmployerShell>{children}</EmployerShell>
    </>
  );
}
