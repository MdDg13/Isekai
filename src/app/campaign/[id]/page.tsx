import CampaignClient from './campaign-client';

// Required for static export - returns empty array to disable static generation
export async function generateStaticParams() {
  return [];
}

interface PageProps {
  params: { id: string };
}

export default function CampaignPage({ params }: PageProps) {
  return <CampaignClient campaignId={params.id} />;
}
