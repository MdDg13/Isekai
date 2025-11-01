import CampaignClient from '../[id]/campaign-client';

// Required for static export - returns empty array to disable static generation
export async function generateStaticParams() {
  return [];
}

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function CampaignPage({ params }: PageProps) {
  const { slug } = await params;
  const campaignId = slug[0];
  return <CampaignClient campaignId={campaignId} />;
}
