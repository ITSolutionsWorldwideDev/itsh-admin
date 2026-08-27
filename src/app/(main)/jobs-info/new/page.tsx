// src/app/(main)/jobs-info/new/page.tsx
"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import InputGroup from "@/components/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import MediaPickerModal from "@/components/Media/MediaPickerModal";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  composeJobContent,
  EMPTY_JOB_CONTENT_FIELDS,
  JobContentFields,
} from "@/utils/job-content-format";

export default function JobInfoFormPage() {
  const router = useRouter();
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [error, setError] = useState("");

  const { token } = useAuthStore();

  const [form, setForm] = useState({
    title: "",
    location: "",
    type: "",
    pdf_url: "",
    published: false,
  });
  const [contentFields, setContentFields] = useState<JobContentFields>(EMPTY_JOB_CONTENT_FIELDS);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleContentFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setContentFields({ ...contentFields, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const body = {
        ...form,
        content: composeJobContent(contentFields),
      };

      const res = await fetch("/api/jobs-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save blog");

      router.push("/jobs-info");
    } catch (err: any) {
      console.error("err  ==== ", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Breadcrumb pageName="Job Info" />
      <div className="grid grid-cols-1 gap-9">
        <div className="flex flex-col gap-9">
          <ShowcaseSection title="Add Job Info" className="space-y-5.5 !p-6.5">
            {error && <p className="mb-2 text-red-500">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <InputGroup
                label="Title"
                placeholder="JobInfo Title"
                type="text"
                name="title"
                active
                required
                handleChange={handleChange}
                value={form.title}
              />

              <InputGroup
                label="Location"
                placeholder="Location"
                type="text"
                name="location"
                active
                required
                handleChange={handleChange}
                value={form.location}
              />

              <InputGroup
                label="Type"
                placeholder="Type"
                type="text"
                name="type"
                active
                required
                handleChange={handleChange}
                value={form.type}
              />

              <TextAreaGroup
                label="About the Role"
                placeholder="Role ka general description likho (paragraph mein)"
                name="aboutRole"
                defaultValue={contentFields.aboutRole}
                handleChange={handleContentFieldChange}
              />

              <TextAreaGroup
                label="Key Responsibilities (har line = ek bullet point)"
                placeholder={"User tickets resolve karna\nHardware issues troubleshoot karna\nNetwork problems handle karna"}
                name="whatYoullDo"
                defaultValue={contentFields.whatYoullDo}
                handleChange={handleContentFieldChange}
              />

              <TextAreaGroup
                label="Requirements (har line = ek bullet point)"
                placeholder={"2+ saal ka experience\nWindows aur Mac dono ka knowledge\nAchi communication skills"}
                name="whatYoullBring"
                defaultValue={contentFields.whatYoullBring}
                handleChange={handleContentFieldChange}
              />

              <TextAreaGroup
                label="Nice to Have (har line = ek bullet point)"
                placeholder={"ITIL certification\nNetworking background"}
                name="niceToHave"
                defaultValue={contentFields.niceToHave}
                handleChange={handleContentFieldChange}
              />

              <div>
                <label className="mb-2 block font-medium">Featured Image</label>

                {form.pdf_url ? (
                  <div className="relative w-40 rounded border bg-gray-50 p-2 hover:shadow-md">
                    <div className="flex aspect-square items-center justify-center bg-gray-200 text-center text-sm text-gray-600">
                      <a target="_blank" href={form.pdf_url}>
                        application/pdf <br />
                        {form.title}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, pdf_url: "" })}
                      className="absolute right-1 top-1 rounded bg-red-600 px-2 py-1 text-xs text-white"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowMediaModal(true)}
                    className="rounded border border-dashed border-gray-400 px-4 py-2 hover:border-primary"
                  >
                    + Select Featured Image
                  </button>
                )}
              </div>

              {/* Media Picker Modal */}
              {showMediaModal && (
                <MediaPickerModal
                  {...({
                    open: showMediaModal,
                    multiple: false,
                    module_ref: "jobs_desc",
                    onClose: () => setShowMediaModal(false),
                    onSelect: (files: any) => {
                      if (files[0]) {
                        setForm({ ...form, pdf_url: files[0].file_path });
                      }
                    },
                  } as any)}
                />
              )}

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="published"
                  checked={form.published}
                  onChange={handleChange}
                />
                <span>Published</span>
              </label>

              {/* Additional Information — OPTIONAL, form ke end mein */}
              <TextAreaGroup
                label="Additional Information (optional)"
                placeholder="Koi extra detail agar deni ho — khali bhi chhod sakte ho"
                name="additionalInfo"
                defaultValue={contentFields.additionalInfo}
                handleChange={handleContentFieldChange}
              />

              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-primary px-4 py-2 text-white hover:bg-opacity-90"
              >
                {loading ? "Saving..." : "Save JobInfo"}
              </button>
            </form>
          </ShowcaseSection>
        </div>
      </div>
    </>
  );
}