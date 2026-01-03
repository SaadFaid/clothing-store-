import { X, User } from 'lucide-react';
import { useState } from 'react';

export type DetailsModalProps = {
  isOpen: boolean;
  title: string;
  data: any;
  itemType: 'product' | 'message' | 'order' | 'user';
  onClose: () => void;
  onRestore?: () => Promise<void>;
  onPermanentDelete?: () => Promise<void>;
};

export function DetailsModal({
  isOpen,
  title,
  data,
  itemType,
  onClose,
  onRestore,
  onPermanentDelete,
}: DetailsModalProps) {
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleRestore = async () => {
    if (!onRestore) return;
    if (!confirm('Restore this item?')) return;
    setRestoring(true);
    try {
      await onRestore();
      onClose();
    } finally {
      setRestoring(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!onPermanentDelete) return;
    if (!confirm('Permanently delete this item? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await onPermanentDelete();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-subtle p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-body">{title}</h2>
          <button onClick={onClose} className="icon-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {itemType === 'product' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Price</p>
                  <p className="text-lg font-semibold text-gray-900">MAD {data.price?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Stock</p>
                  <p className="text-lg font-semibold text-gray-900">{data.stock_quantity || 0}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Tax</p>
                  <p className="text-lg font-semibold text-gray-900">MAD {data.tax?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Shipping</p>
                  <p className="text-lg font-semibold text-gray-900">MAD {data.shipping_cost?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            )}

            {itemType === 'message' && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Subject:</p>
                  <p className="font-semibold text-gray-900">{data.subject || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">From:</p>
                  <p className="font-semibold text-gray-900">{data.sender_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Body:</p>
                  <p className="text-gray-700 whitespace-pre-wrap max-h-40 overflow-auto">{data.body || 'N/A'}</p>
                </div>
              </div>
            )}

            {itemType === 'user' && (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-600 dark:text-gray-200">{(data?.full_name || 'U').slice(0,1).toUpperCase()}</div>
                  <div>
                    <p className="text-lg font-semibold text-body">{data?.full_name || 'N/A'}</p>
                    <p className="text-sm text-muted">{data?.email || 'N/A'}</p>
                    <p className="text-sm text-muted">{data?.phone || '—'}</p>
                    <p className="text-sm text-muted">Role: <span className="font-medium">{data?.role || 'user'}</span></p>
                    <p className="text-sm text-muted">Location: {data?.address ? `${data.address.city}${data.address.state ? ', ' + data.address.state : ''}${data.address.country ? ', ' + data.address.country : ''}` : '—'}</p>
                    {data?.address && (
                      <div className="mt-2 text-sm text-muted">
                        <div>{data.address.full_name}</div>
                        <div>{data.address.address_line1}{data.address.address_line2 ? `, ${data.address.address_line2}` : ''}</div>
                        <div>{data.address.city}{data.address.state ? `, ${data.address.state}` : ''} {data.address.postal_code ? data.address.postal_code : ''}</div>
                        <div>{data.address.country}</div>
                        <div>{data.address.phone}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-surface border-t border-subtle p-6 flex gap-3">
          {onRestore && (
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {restoring ? 'Restoring...' : 'Restore'}
            </button>
          )}

          {onPermanentDelete && (
            <button
              onClick={handlePermanentDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? 'Deleting...' : 'Delete Permanently'}
            </button>
          )}

          <button
            onClick={onClose}
            className="ml-auto btn btn-outline focus-ring"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
