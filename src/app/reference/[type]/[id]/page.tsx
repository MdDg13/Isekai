import ReferenceDetailClient from './reference-detail-client';

interface ReferenceParams {
  type: string;
  id: string;
}

interface ReferenceDetailPageProps {
  params: ReferenceParams;
}

export default function ReferenceDetailPage({ params }: ReferenceDetailPageProps) {
  return <ReferenceDetailClient type={params.type} id={params.id} />;
}

export function generateStaticParams(): ReferenceParams[] {
  return [{ type: 'items', id: 'placeholder' }];
}

