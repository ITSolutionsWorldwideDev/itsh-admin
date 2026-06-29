// apps/admin/app/(admin)/media/page.tsx

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useToast } from "@/components/ui/toast-provider";
import { UploadButton, UploadDropzone } from "@uploadthing/react";
import type { MediaRouter } from "@/app/api/uploadthing/core";

interface MediaItem {
  media_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  created_at: string;
}
interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ── File Type Thumbnail ───────────────────────────────────────────────────────

function FileThumbnail({ item }: { item: MediaItem }) {
  const isImage = item.file_type?.startsWith("image/");
  const isPdf = item.file_type === "application/pdf";
  const isWord =
    item.file_type === "application/msword" ||
    item.file_type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  if (isImage && item.file_path?.startsWith("http")) {
    return (
      <Image
        src={item.file_path}
        alt={item.file_name}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
    );
  }

  if (isPdf) {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        {/* PDF Icon */}
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="8" fill="#FEE2E2" />
          <path
            d="M14 10h14l10 10v22a2 2 0 01-2 2H14a2 2 0 01-2-2V12a2 2 0 012-2z"
            fill="#EF4444"
          />
          <path d="M28 10l10 10H28V10z" fill="#FCA5A5" />
          <text
            x="24"
            y="34"
            textAnchor="middle"
            fill="white"
            fontSize="9"
            fontWeight="700"
            fontFamily="Arial"
          >
            PDF
          </text>
        </svg>
        <span className="px-2 text-center text-[10px] font-medium text-red-600">
          PDF Document
        </span>
      </div>
    );
  }

  if (isWord) {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        {/* Word Icon */}
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="8" fill="#DBEAFE" />
          <path
            d="M14 10h14l10 10v22a2 2 0 01-2 2H14a2 2 0 01-2-2V12a2 2 0 012-2z"
            fill="#2563EB"
          />
          <path d="M28 10l10 10H28V10z" fill="#93C5FD" />
          <text
            x="24"
            y="34"
            textAnchor="middle"
            fill="white"
            fontSize="8"
            fontWeight="700"
            fontFamily="Arial"
          >
            DOC
          </text>
        </svg>
        <span className="px-2 text-center text-[10px] font-medium text-blue-600">
          Word Document
        </span>
      </div>
    );
  }

  // fallback — unknown type
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="8" fill="#F3F4F6" />
        <path
          d="M14 10h14l10 10v22a2 2 0 01-2 2H14a2 2 0 01-2-2V12a2 2 0 012-2z"
          fill="#9CA3AF"
        />
        <path d="M28 10l10 10H28V10z" fill="#D1D5DB" />
      </svg>
      <span className="px-2 text-center text-[10px] text-gray-400">
        {item.file_type || "Unknown"}
      </span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 12,
    totalRecords: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const { showToast } = useToast();
  const limitPerPage = 12;

  const fetchMedia = async (targetPage = currentPage) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/media?page=${targetPage}&limit=${limitPerPage}`,
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMedia(data.media || []);
      if (data.pagination) setPagination(data.pagination);
    } catch {
      showToast("error", "Failed to load Media assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia(currentPage);
  }, [currentPage]);

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleDelete = async (ids: number[] | number) => {
    const list = Array.isArray(ids) ? ids : [ids];
    if (!confirm(`Permanently remove ${list.length} file(s) from asset tracking?`)) return;

    try {
      setLoading(true);
      await Promise.all(
        list.map((id) => fetch(`/api/media?id=${id}`, { method: "DELETE" })),
      );
      setSelected([]);
      showToast("success", "Deleted files successfully");
      const remainingOnPage = media.length - list.length;
      if (remainingOnPage <= 0 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        fetchMedia(currentPage);
      }
    } catch {
      showToast("error", "Failed processing file removal commands");
    } finally {
      setLoading(false);
    }
  };

  const formatFileName = (name: string) => {
    let cleaned = name.split("-").slice(1).join("-");
    if (!cleaned) cleaned = name;
    cleaned = cleaned.replace(/_/g, " ");
    return cleaned.length > 30 ? cleaned.slice(0, 30) + "..." : cleaned;
  };

  return (
    <div className="page-wrapper">
      <div className="content mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h4 className="text-xl font-semibold text-gray-900">Media Library</h4>
            <p className="text-sm text-gray-500">Upload and manage product catalog assets</p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-400">
            Total Files: {pagination.totalRecords}
          </span>
        </div>

        {/* Dropzone */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <UploadDropzone<MediaRouter, "productImage">
            endpoint="productImage"
            className="rounded-xl border border-dashed border-gray-300 transition duration-200 hover:border-blue-500"
            appearance={{
              container: { backgroundColor: "#ffffff", padding: "24px" },
              button: {
                backgroundColor: "#f97316",
                fontSize: "0.875rem",
                fontWeight: "600",
                padding: "8px 24px",
                borderRadius: "0.5rem",
              },
              label: { color: "#4b5563" },
              allowedContent: { color: "#9ca3af" },
            }}
            content={{
              label({ isUploading, files }) {
                if (isUploading)
                  return (
                    <span className="animate-pulse font-medium text-orange-500">
                      Uploading files...
                    </span>
                  );
                if (files.length > 0) {
                  return (
                    <div className="my-2 flex w-full max-w-md flex-col items-center gap-1.5">
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                        Ready to upload ({files.length} selected):
                      </span>
                      <ul className="max-h-24 w-full space-y-0.5 divide-y divide-gray-100 overflow-y-auto text-center text-xs text-gray-500">
                        {files.map((f) => (
                          <li key={f.name} className="truncate rounded border border-gray-100 bg-gray-50 px-2 py-1 font-mono">
                            {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                return "Choose files or drag and drop here";
              },
            }}
            onUploadBegin={() => {}}
            onClientUploadComplete={async (res) => {
              if (!res?.length) return;
              try {
                await Promise.all(
                  res.map((file) =>
                    fetch("/api/media/save", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        file_name: file.name,
                        file_path: file.ufsUrl,
                        file_type: file.type,
                      }),
                    }),
                  ),
                );
                showToast("success", "Files uploaded successfully");
                setCurrentPage(1);
                fetchMedia(1);
              } catch (err: any) {
                showToast("error", err.message || "Failed linking files downstream");
              }
            }}
            onUploadError={(err) => showToast("error", err.message)}
          />
        </div>

        {/* Bulk actions */}
        {selected.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <span className="mr-2 text-xs font-semibold text-blue-700">
              Selected {selected.length} asset elements
            </span>
            <button
              onClick={() => handleDelete(selected)}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelected([])}
              className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-white"
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Grid */}
        {loading && media.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">Loading media assets...</p>
        ) : media.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-16 text-center text-sm font-medium text-gray-400">
            No library assets found. Upload files above to begin.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {media.map((item) => {
              const displayName = formatFileName(item.file_name);
              const isSelected = selected.includes(item.media_id);

              return (
                <div
                  key={item.media_id}
                  onClick={() => toggleSelect(item.media_id)}
                  className={`group relative cursor-pointer select-none rounded-xl border bg-white p-2.5 transition ${
                    isSelected
                      ? "border-transparent shadow-sm ring-2 ring-blue-500"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                    <FileThumbnail item={item} />
                  </div>

                  {/* File name */}
                  <p className="mt-2 truncate px-0.5 text-xs font-medium text-gray-700">
                    {displayName}
                  </p>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.media_id);
                    }}
                    className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white opacity-0 shadow-md transition-opacity duration-200 hover:bg-red-700 group-hover:opacity-100"
                    title="Delete item"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={!pagination.hasPrevPage || loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
            >
              ← Previous
            </button>
            <span className="text-xs font-medium text-gray-600">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.totalPages))}
              disabled={!pagination.hasNextPage || loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}