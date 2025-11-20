import { Suspense } from 'react';
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
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading world...</p>
          </div>
        </div>
      }
    >
      <WorldRouteClient placeholderId={params.id} />
    </Suspense>
  );
}

