/**
 * Editable stream name component
 * Displays income stream name with inline editing via hover pencil icon
 * Updates all entries sharing the same stream name on rename
 */

import React, { useState, useRef, useEffect } from 'react';
import { LuPencil, LuCheck, LuX } from 'react-icons/lu';
import { toast } from 'sonner';

interface EditableStreamNameProps {
  streamName: string;
  allStreamNames: string[];
  onRename: (oldName: string, newName: string) => Promise<void>;
}

export const EditableStreamName: React.FC<EditableStreamNameProps> = ({
  streamName,
  allStreamNames,
  onRename,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(streamName);
  const [isHovered, setIsHovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmed = editValue.trim();

    // Validation: empty check
    if (!trimmed) {
      toast.error('Stream name cannot be empty');
      return;
    }

    // Validation: duplicate check (case-insensitive)
    const isDuplicate = allStreamNames.some(
      (name) =>
        name.toLowerCase() === trimmed.toLowerCase() && name !== streamName,
    );
    if (isDuplicate) {
      toast.warning('A stream with this name already exists');
    }

    // Only proceed if there's an actual change
    if (trimmed === streamName) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onRename(streamName, trimmed);
      setIsEditing(false);
    } catch {
      // Error already shown by onRename
      setEditValue(streamName);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(streamName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    const inputBaseClass =
      'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 transition-colors';
    const inputFocusClass =
      'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10';

    return (
      <div className="flex items-center gap-2 flex-1">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className={`${inputBaseClass} ${inputFocusClass} disabled:opacity-50`}
          placeholder="Stream name"
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-1.5 rounded-lg transition-colors text-green-600 hover:bg-green-50 disabled:opacity-50"
          title="Save"
          aria-label="Save"
        >
          <LuCheck className="w-4 h-4" />
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="p-1.5 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          title="Cancel"
          aria-label="Cancel"
        >
          <LuX className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="group flex items-center gap-2 cursor-pointer leading-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsEditing(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setIsEditing(true);
        }
      }}
    >
      <span className="text-gray-900 font-medium">{streamName}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        className={`p-1 rounded-lg transition-all text-blue-600 hover:bg-blue-50 flex items-center justify-center h-5 w-5 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        title="Edit stream name"
        aria-label="Edit stream name"
      >
        <LuPencil className="w-4 h-4" />
      </button>
    </div>
  );
};
