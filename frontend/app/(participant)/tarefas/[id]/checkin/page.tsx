import { PhotoCapture } from '@/components/shared/PhotoCapture';

export default function CheckInPage({ params }: { params: { id: string } }) {
  return <PhotoCapture taskId={params.id} type="checkin" />;
}
