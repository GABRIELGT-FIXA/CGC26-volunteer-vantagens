import { PhotoCapture } from '@/components/shared/PhotoCapture';

export default function CheckOutPage({ params }: { params: { id: string } }) {
  return <PhotoCapture taskId={params.id} type="checkout" />;
}
