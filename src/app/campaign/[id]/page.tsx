import CampaignClient from './campaign-client';
import campaigns from '../../data/campaigns.json';

// Required for static export - returns empty array to disable static generation
// Must be synchronous for Next.js 15.5.4 + static export
export const dynamicParams = false;
export const generateStaticParams = (): Array<{ id: string }> => {
  const ids: string[] = Array.isArray(campaigns) ? campaigns : [];
  return ids.map((id) => ({ id }));
};

interface PageProps {
  params: { id: string };
}

export default function CampaignPage({ params }: PageProps) {
  return <CampaignClient campaignId={params.id} />;
}
