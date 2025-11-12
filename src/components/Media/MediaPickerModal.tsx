// src/components/Media/MediaPickerModal.tsx

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore"; 

interface MediaItem {
  media_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

interface MediaPickerModalProps {
  open: boolean;
  multiple?: boolean;
  module_ref?:string;
  onClose: () => void;
  onSelect: (selected: MediaItem[]) => void;
}

export default function MediaPickerModal({
  open,
  multiple = false,
  module_ref="media",
  onClose,
  onSelect,
}: MediaPickerModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const { token } = useAuthStore();

  const fetchMedia = async () => {
    if (!token) return;

    const res = await fetch("/api/media", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    setMedia(data);
  };

  useEffect(() => {
    if (open) fetchMedia();
  }, [token,open]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    // formData.append("module_ref", "blogs");
    formData.append("module_ref", module_ref);

    const res = await fetch("/api/media", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (res.ok) {
      await fetchMedia();
    }
    setUploading(false);
  };

  const toggleSelect = (item: MediaItem) => {
    if (multiple) {
      setSelected((prev) =>
        prev.find((i) => i.media_id === item.media_id)
          ? prev.filter((i) => i.media_id !== item.media_id)
          : [...prev, item]
      );
    } else {
      setSelected([item]);
    }
  };

  const confirmSelection = () => {
    onSelect(selected);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-xl font-semibold">Media Library</h2>
          <button
            onClick={onClose}
            className="rounded px-3 py-1 text-gray-600 hover:text-red-500"
          >
            ✕
          </button>
        </div>

        {/* Upload area */}
        <div className="my-4">
          <label className="cursor-pointer rounded border border-dashed border-gray-400 px-6 py-3 hover:border-primary">
            <input type="file" hidden onChange={handleUpload} />
            {uploading ? "Uploading..." : "Click or Drag to Upload"}
          </label>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 overflow-y-auto max-h-[60vh]">
          {media.map((item) => (
            <div
              key={item.media_id}
              onClick={() => toggleSelect(item)}
              className={`relative cursor-pointer rounded border-2 ${
                selected.find((i) => i.media_id === item.media_id)
                  ? "border-primary"
                  : "border-transparent"
              }`}
            >
              {item.file_type.startsWith("image/") ? (
                <Image
                  src={item.file_path}
                  alt={item.file_name}
                  width={200}
                  height={200}
                  className="aspect-square w-full rounded object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-gray-200 text-sm text-gray-600">
                  {item.file_type}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end gap-3 border-t pt-3">
          <button
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={confirmSelection}
            disabled={selected.length === 0}
            className="rounded bg-primary px-4 py-2 text-sm text-white hover:bg-opacity-90 disabled:opacity-50"
          >
            Use {selected.length > 1 ? `${selected.length} files` : "This File"}
          </button>
        </div>
      </div>
    </div>
  );
}
