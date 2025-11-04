"use client";

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import CampaignClient from './campaign-client';

export default function CampaignRouteClient() {
  const pathname = usePathname();

  const campaignId = useMemo(() => {
    if (pathname) {
      const match = pathname.match(/\/campaign\/([^\/]+)/);
      if (match && match[1] && match[1] !== 'campaign') {
        return match[1];
      }
    }
    return null;
  }, [pathname]);

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


