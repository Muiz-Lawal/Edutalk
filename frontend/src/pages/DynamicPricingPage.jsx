import React from 'react';
import { useParams } from 'react-router-dom';
import DynamicPricingManager from '../components/DynamicPricingManager';

export default function DynamicPricingPage() {
  const { bundleId } = useParams();

  return (
    <div className="dynamic-pricing-page">
      <DynamicPricingManager bundleId={bundleId} />
    </div>
  );
}
