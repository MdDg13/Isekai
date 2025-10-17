import CampaignClient from './campaign-client';

interface PageProps {
  params: { id: string };
}

export default function CampaignPage({ params }: PageProps) {
  return <CampaignClient campaignId={params.id} />;
}
