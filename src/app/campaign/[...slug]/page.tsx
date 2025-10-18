import CampaignClient from '../[id]/campaign-client';

interface PageProps {
  params: { slug: string[] };
}

export default function CampaignPage({ params }: PageProps) {
  const campaignId = params.slug[0];
  return <CampaignClient campaignId={campaignId} />;
}
