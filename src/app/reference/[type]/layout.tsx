import type { ReactNode } from 'react';

interface ReferenceTypeLayoutProps {
  children: ReactNode;
}

export default function ReferenceTypeLayout({ children }: ReferenceTypeLayoutProps) {
  return <>{children}</>;
}

export function generateStaticParams() {
  return [];
}

