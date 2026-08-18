import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function CreateClassPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const editId = params.get('edit');

  const target = editId
    ? `/host-dashboard?modal=edit&edit=${encodeURIComponent(editId)}`
    : '/host-dashboard?modal=create';

  return <Navigate to={target} replace />;
}
