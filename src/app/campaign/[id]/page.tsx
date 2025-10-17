import CampaignClient from './campaign-client';

// This is required for static export with dynamic routes
export async function generateStaticParams() {
  return [];
}

interface PageProps {
  params: { id: string };
}

export default function CampaignPage({ params }: PageProps) {
  return <CampaignClient campaignId={params.id} />;
}
