import CampaignClient from '../[id]/campaign-client';

// Required for static export - returns empty array to disable static generation
export async function generateStaticParams() {
  return [];
}

interface PageProps {
  params: { slug: string[] };
}

export default function CampaignPage({ params }: PageProps) {
  const campaignId = params.slug[0];
  return <CampaignClient campaignId={campaignId} />;
}
