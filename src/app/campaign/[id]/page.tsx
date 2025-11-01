import CampaignClient from './campaign-client';

// Required for static export - returns empty array to disable static generation
// Must be synchronous for Next.js 15.5.4 + static export
export function generateStaticParams() {
  return [];
}

interface PageProps {
  params: { id: string };
}

export default function CampaignPage({ params }: PageProps) {
  return <CampaignClient campaignId={params.id} />;
}
