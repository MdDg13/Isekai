// For static export, we need to generate at least one path
// Actual campaign IDs are handled client-side via the URL
export const dynamicParams = false;
export function generateStaticParams(): Array<{ id: string }> {
  // Generate a placeholder path that will handle all campaign IDs client-side
  return [{ id: 'campaign' }];
}

import CampaignRouteClient from './campaign-route-client';

export default function CampaignPage() {
  // Server component wrapper that renders a client route resolver
  return <CampaignRouteClient />;
}
