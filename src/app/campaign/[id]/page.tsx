import CampaignClient from './campaign-client';

// Required for static export - allow dynamic routes for any campaign ID
// Must be synchronous for Next.js 15.5.4 + static export
export const dynamicParams = true;
export const generateStaticParams = (): Array<{ id: string }> => {
  // Return empty array to allow dynamic routes - campaigns loaded client-side
  return [];
};

interface PageProps {
  params: { id: string };
}

export default function CampaignPage({ params }: PageProps) {
  return <CampaignClient campaignId={params.id} />;
}
