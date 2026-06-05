import CandidateShell from '@/components/candidate/CandidateShell';

export default function CandidateLayout({ children }: { children: React.ReactNode }) {

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        rel="stylesheet"
      />
      <CandidateShell>{children}</CandidateShell>
    </>
  );
}
