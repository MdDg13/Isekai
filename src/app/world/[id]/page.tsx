import WorldRouteClient from './world-route-client';

// For static export, we need to generate at least one path
export const dynamicParams = false;
export function generateStaticParams(): Array<{ id: string }> {
  return [{ id: 'world' }];
}

interface PageProps {
  params: { id: string };
}

export default function WorldPage({ params }: PageProps) {
  // Server component wrapper; client-side route parsing happens in WorldRouteClient
  return <WorldRouteClient placeholderId={params.id} />;
}

