import CampaignClient from './campaign-client';

// Required for static export - cannot use dynamicParams: true with static export
// Must be synchronous for Next.js 15.5.4 + static export
export const dynamicParams = false;
export function generateStaticParams(): Array<{ id: string }> {
  // Return at least one placeholder path for static export
  // Client-side routing will handle actual campaign IDs
  return [{ id: 'placeholder' }];
}

interface PageProps {
  params: { id: string };
}

export default function CampaignPage({ params }: PageProps) {
  return <CampaignClient campaignId={params.id} />;
}
