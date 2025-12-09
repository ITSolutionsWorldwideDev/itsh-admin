// src/app/(main)/media/page.tsx
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

export default function MediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([]);
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
    fetchMedia();
  }, [token]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("module_ref", "blogs");

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

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this image?")) return;
    if (!token) return;

    await fetch(`/api/media?id=${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`, // ✅ attach token
      },
    });
    await fetchMedia();
  };

  const formatFileName = (name: string) => {
    // remove prefix before first hyphen
    let cleaned = name.split("-").slice(1).join("-");

    // remove underscores
    cleaned = cleaned.replace(/_/g, " ");

    // limit to 50 chars
    if (cleaned.length > 50) {
      cleaned = cleaned.slice(0, 50) + "...";
    }

    return cleaned;
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Media Library</h1>

      <div className="mb-4">
        <label className="cursor-pointer rounded border border-dashed border-gray-400 px-6 py-3 hover:border-primary">
          <input type="file" hidden onChange={handleUpload} />
          {uploading ? "Uploading..." : "Click or Drag to Upload"}
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {media.map((item) => {
          const displayName = formatFileName(item.file_name);

          return (
            <div
              key={item.media_id}
              className="relative rounded border bg-gray-50 p-2 hover:shadow-md"
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
                <div className="flex aspect-square items-center justify-center break-words bg-gray-200 p-2 text-center text-xs text-gray-700">
                  {item.file_type} <br />
                  {displayName}
                </div>
              )}

              <button
                onClick={() => handleDelete(item.media_id)}
                className="absolute right-1 top-1 rounded bg-red-500 px-2 py-1 text-xs text-white"
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
