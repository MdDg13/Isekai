import CampaignClient from './campaign-client';

// Required for static export - returns empty array to disable static generation
export function generateStaticParams() {
  return [];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignPage({ params }: PageProps) {
  const { id } = await params;
  return <CampaignClient campaignId={id} />;
}
