"use client";

import CampaignClient from './campaign-client';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

// For static export, we need to generate at least one path
// Actual campaign IDs are handled client-side via the URL
export const dynamicParams = false;
export function generateStaticParams(): Array<{ id: string }> {
  // Generate a catch-all path that will handle all campaign IDs client-side
  return [{ id: 'campaign' }];
}

interface PageProps {
  params: { id: string };
}

export default function CampaignPage({ params }: PageProps) {
  const pathname = usePathname();
  
  // Extract campaign ID from URL path
  const campaignId = useMemo(() => {
    // With static export, params.id might be 'campaign' (the generated path)
    // So we read the actual ID from the URL pathname
    if (pathname) {
      const match = pathname.match(/\/campaign\/([^\/]+)/);
      if (match && match[1] && match[1] !== 'campaign') {
        return match[1];
      }
    }
    // Fallback to params.id if it's not the placeholder
    return params.id && params.id !== 'campaign' ? params.id : null;
  }, [pathname, params.id]);
  
  if (!campaignId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Campaign not found</p>
          <p className="text-xs text-gray-500 mt-2">URL: {pathname}</p>
        </div>
      </div>
    );
  }
  
  return <CampaignClient campaignId={campaignId} />;
}
