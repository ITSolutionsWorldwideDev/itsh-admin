// src/app/(main)/jobs-info/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import InputGroup from "@/components/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import MediaPickerModal from "@/components/Media/MediaPickerModal";
import { useAuthStore } from "@/store/useAuthStore";
import {
  composeJobContent,
  parseJobContent,
  parseFreeformJobText,
  EMPTY_JOB_CONTENT_FIELDS,
  JobContentFields,
} from "@/utils/job-content-format";

interface JobInfoFormData {
  job_info_id: number;
  title: string;
  location: string;
  type: string;
  pdf_url?: string;
  published: boolean;
}

export default function EditJobInfoPage() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState<JobInfoFormData | null>(null);
  const [contentFields, setContentFields] = useState<JobContentFields>(EMPTY_JOB_CONTENT_FIELDS);
  const [quickPaste, setQuickPaste] = useState("");
  const [fillVersion, setFillVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showMediaModal, setShowMediaModal] = useState(false);

  const handleAutoFill = () => {
    if (!quickPaste.trim()) return;
    setContentFields(parseFreeformJobText(quickPaste));
    setFillVersion((v) => v + 1); // textareas ko force remount karne ke liye (defaultValue uncontrolled hai)
  };

  const { token } = useAuthStore();

  useEffect(() => {
    if (!id) return;
    if (!token) return;
    const fetchJobInfo = async () => {
      try {
        const res = await fetch(`/api/jobs-info?id=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load JobInfo");

        setForm({
          job_info_id: data.job_info_id,
          title: data.title,
          location: data.location,
          type: data.type,
          pdf_url: data.pdf_url,
          published: !!data.published,
        });

        // Purana markdown "content" wapas 4 fields mein todo taake edit ho sake
        setContentFields(parseJobContent(data.content));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJobInfo();
  }, [token, id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!form) return;
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleContentFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setContentFields({ ...contentFields, [name]: value });
  };

  const handleToggle = () => {
    if (!form) return;
    setForm({ ...form, published: !form.published });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setSaving(true);
    setError("");

    try {
      const body = {
        ...form,
        content: composeJobContent(contentFields),
      };

      const res = await fetch("/api/jobs-info", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update JobInfo");

      router.push(`/jobs-info/${data.job_info_id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading JobInfo...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!form) return <p>JobInfo not found.</p>;

  return (
    <>
      <Breadcrumb pageName="Job Info" />
      <div className="grid grid-cols-1 gap-9">
        <div className="flex flex-col gap-9">
          <ShowcaseSection title="Edit Job Info" className="space-y-5.5 !p-6.5">
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

              <div className="rounded-lg border border-dashed border-gray-400 p-4">
                <TextAreaGroup
                  label="Quick Paste (optional) — pura job description ek sath paste karo"
                  placeholder={"About the Role\nHum ek IT Support Officer dhoond rahe hain...\n\nResponsibilities\n- User tickets resolve karna\n\nRequirements\n- 2 saal ka experience\n\nBenefits\n- ITIL certification"}
                  name="quickPaste"
                  defaultValue={quickPaste}
                  handleChange={(e) => setQuickPaste(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="mt-2 rounded-md bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
                >
                  Auto-Fill Fields Below
                </button>
                <p className="mt-1 text-xs text-gray-500">
                  Heading apni line pe likho (About the Role / Responsibilities / Requirements / Benefits) — neeche wale fields (jo abhi purana data dikha rahe hain) overwrite ho jayenge, save karne se pehle review kar lena.
                </p>
              </div>

              <TextAreaGroup
                key={`aboutRole-${fillVersion}`}
                label="About the Role"
                placeholder="Role ka general description likho (paragraph mein)"
                name="aboutRole"
                defaultValue={contentFields.aboutRole}
                handleChange={handleContentFieldChange}
              />

              <TextAreaGroup
                key={`whatYoullDo-${fillVersion}`}
                label="Key Responsibilities (har line = ek bullet point)"
                placeholder={"User tickets resolve karna\nHardware issues troubleshoot karna\nNetwork problems handle karna"}
                name="whatYoullDo"
                defaultValue={contentFields.whatYoullDo}
                handleChange={handleContentFieldChange}
              />

              <TextAreaGroup
                key={`whatYoullBring-${fillVersion}`}
                label="Requirements (har line = ek bullet point)"
                placeholder={"2+ saal ka experience\nWindows aur Mac dono ka knowledge\nAchi communication skills"}
                name="whatYoullBring"
                defaultValue={contentFields.whatYoullBring}
                handleChange={handleContentFieldChange}
              />

              <TextAreaGroup
                key={`niceToHave-${fillVersion}`}
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

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={handleToggle}
                />
                <span>Published</span>
              </label>

              {error && <p className="text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="rounded bg-primary px-4 py-2 text-white hover:bg-opacity-90"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </ShowcaseSection>
        </div>
      </div>
    </>
  );
}