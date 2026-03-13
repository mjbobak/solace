import { useEffect, useState } from 'react';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Modal } from '@/shared/components/Modal';

import type { ProjectedIncomeSource } from '../../types/income';

interface RenameSourceModalProps {
  isOpen: boolean;
  source: ProjectedIncomeSource | null;
  onClose: () => void;
  onSubmit: (sourceId: number, name: string) => Promise<void>;
}

export function RenameSourceModal({
  isOpen,
  source,
  onClose,
  onSubmit,
}: RenameSourceModalProps) {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(source?.name ?? '');
    setIsSaving(false);
  }, [isOpen, source]);

  const handleSubmit = async () => {
    if (!source || !name.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit(source.id, name.trim());
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rename Income Source">
      <div className="space-y-4">
        <Input
          label="Income source name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Acme Corp"
          required
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSaving}
            disabled={!name.trim() || name.trim() === source?.name}
          >
            Save Name
          </Button>
        </div>
      </div>
    </Modal>
  );
}
