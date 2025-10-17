'use client';

import { useParams } from 'next/navigation';
import CampaignClient from './campaign-client';

export default function CampaignPage() {
  const params = useParams();
  const campaignId = params.id as string;
  
  return <CampaignClient campaignId={campaignId} />;
}
