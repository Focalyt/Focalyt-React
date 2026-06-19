import { useCallback, useState } from 'react';

const IMPACT_PATHS = {
  department: (id) => `/college/b2b/b2b-departments/${id}/delete-impact`,
  project: (id) => `/college/b2b/b2b-projects/${id}/delete-impact`,
  type: (id) => `/college/b2b/type-of-b2b/${id}/delete-impact`,
  source: (id) => `/college/b2b/lead-categories/${id}/delete-impact`
};

const DELETE_PATHS = {
  department: (id) => `/college/b2b/b2b-departments/${id}`,
  project: (id) => `/college/b2b/b2b-projects/${id}`,
  type: (id) => `/college/b2b/type-of-b2b/${id}`,
  source: (id) => `/college/b2b/lead-categories/${id}`
};

export function useB2bDeleteWithMove({ backendUrl, token, entityType, onDeleted }) {
  const [deleteModal, setDeleteModal] = useState({ show: false, item: null, impact: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openDeleteModal = useCallback(async (item) => {
    try {
      setDeleteLoading(true);
      const impactRes = await fetch(`${backendUrl}${IMPACT_PATHS[entityType](item._id)}`, {
        headers: { 'x-auth': token, 'Content-Type': 'application/json' }
      });
      const impactData = await impactRes.json();
      if (!impactData.status) {
        throw new Error(impactData.message || 'Failed to check linked records');
      }
      setDeleteModal({ show: true, item, impact: impactData.data });
    } catch (error) {
      console.error('Delete impact error:', error);
      alert(error.message || 'Failed to check linked records');
    } finally {
      setDeleteLoading(false);
    }
  }, [backendUrl, token, entityType]);

  const closeDeleteModal = useCallback(() => {
    if (!deleteLoading) {
      setDeleteModal({ show: false, item: null, impact: null });
    }
  }, [deleteLoading]);

  const confirmDelete = useCallback(async (movePayload) => {
    if (!deleteModal.item) return;
    try {
      setDeleteLoading(true);
      const response = await fetch(
        `${backendUrl}${DELETE_PATHS[entityType](deleteModal.item._id)}`,
        {
          method: 'DELETE',
          headers: { 'x-auth': token, 'Content-Type': 'application/json' },
          body: JSON.stringify(movePayload || {})
        }
      );
      const data = await response.json();
      if (!data.status) {
        throw new Error(data.message || 'Delete failed');
      }
      setDeleteModal({ show: false, item: null, impact: null });
      onDeleted?.(deleteModal.item, data.message);
      return data;
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.message || 'Delete failed');
      return null;
    } finally {
      setDeleteLoading(false);
    }
  }, [backendUrl, token, entityType, deleteModal.item, onDeleted]);

  return {
    deleteModal,
    deleteLoading,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete
  };
}
