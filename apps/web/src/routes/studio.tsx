import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";

export const Route = createFileRoute("/studio")({
  component: StudioPage,
});

type DeviceType = "phone" | "tablet" | "laptop" | "desktop" | "watch" | "other";

const DEVICE_TYPES: DeviceType[] = ["phone", "tablet", "laptop", "desktop", "watch", "other"];

interface FormState {
  id: string;
  name: string;
  collection: string;
  deviceType: DeviceType;
  deviceModel: string;
  tags: string;
  creditAuthor: string;
  creditLicense: string;
}

const INITIAL_FORM: FormState = {
  id: "",
  name: "",
  collection: "",
  deviceType: "phone",
  deviceModel: "generic",
  tags: "minimal",
  creditAuthor: "MockyMax Team",
  creditLicense: "CC-BY-NC-4.0",
};

function StudioPage() {
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [maskFile, setMaskFile] = useState<File | null>(null);
  const bgUrl = useMemo(() => (bgFile ? URL.createObjectURL(bgFile) : null), [bgFile]);
  const maskUrl = useMemo(() => (maskFile ? URL.createObjectURL(maskFile) : null), [maskFile]);
  const [showOverlay, setShowOverlay] = useState(true);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!bgUrl) return;
    return () => URL.revokeObjectURL(bgUrl);
  }, [bgUrl]);

  useEffect(() => {
    if (!maskUrl) return;
    return () => URL.revokeObjectURL(maskUrl);
  }, [maskUrl]);

  useEffect(() => {
    if (!bgUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    let cancelled = false;

    (async () => {
      try {
        const bg = await loadImage(bgUrl);
        if (cancelled) return;
        canvas.width = bg.width;
        canvas.height = bg.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(bg, 0, 0);
        if (showOverlay && maskUrl) {
          const mask = await loadImage(maskUrl);
          if (cancelled) return;
          ctx.globalAlpha = 0.5;
          ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = 1;
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "preview failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bgUrl, maskUrl, showOverlay]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleDownload() {
    setError(null);

    if (!bgFile || !maskFile) {
      setError("Both background and mask are required.");
      return;
    }
    if (!form.id || !form.name || !form.collection) {
      setError("ID, name, and collection are required.");
      return;
    }
    if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(form.id)) {
      setError("ID must be 'collection/scene-name' in kebab-case.");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(form.collection)) {
      setError("Collection must be kebab-case.");
      return;
    }

    setBusy(true);
    try {
      const bg = await fileToImage(bgFile);
      const backgroundBlob = await canvasToBlob(bg, "image/webp", 0.85);
      const thumbBlob = await renderThumb(bg);

      const maskBytes = await maskFile.arrayBuffer();

      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const manifest = {
        schemaVersion: 2 as const,
        id: form.id,
        name: form.name,
        collection: form.collection,
        device: {
          type: form.deviceType,
          model: form.deviceModel,
        },
        tags: tags.length > 0 ? tags : ["minimal"],
        assets: {
          background: "background.webp",
          mask: "mask.png",
          thumb: "thumb.webp",
        },
        credit: {
          author: form.creditAuthor,
          license: form.creditLicense,
        },
      };

      const zip = new JSZip();
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));
      zip.file("background.webp", backgroundBlob);
      zip.file("mask.png", maskBytes);
      zip.file("thumb.webp", thumbBlob);

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const sceneSlug = form.id.split("/")[1] ?? "scene";
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sceneSlug}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "bundle failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scene Studio</h1>
        <p className="mt-2 text-neutral-600">
          Drop a background and its mask (from <code>pnpm mask</code>), fill the metadata, and
          download a scene bundle to commit into{" "}
          <code>
            scenes/{"{collection}"}/{"{name}"}/
          </code>
          .
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm">
              <span className="text-neutral-700">Background</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBgFile(e.target.files?.[0] ?? null)}
                className="ml-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="text-neutral-700">Mask</span>
              <input
                type="file"
                accept="image/png"
                onChange={(e) => setMaskFile(e.target.files?.[0] ?? null)}
                className="ml-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showOverlay}
                onChange={(e) => setShowOverlay(e.target.checked)}
              />
              Show mask overlay
            </label>
          </div>

          <div className="mt-4 overflow-auto rounded border border-neutral-200 bg-neutral-50">
            <canvas ref={canvasRef} className="block max-w-full" />
            {!bgUrl && (
              <p className="px-4 py-8 text-center text-sm text-neutral-500">
                Drop a background image to preview.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6 space-y-3">
          <Field label="ID (collection/scene-name)">
            <input
              type="text"
              value={form.id}
              onChange={(e) => updateField("id", e.target.value)}
              placeholder="studio/display-concrete-01"
              className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            />
          </Field>
          <Field label="Name">
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Studio Display on Concrete"
              className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            />
          </Field>
          <Field label="Collection">
            <input
              type="text"
              value={form.collection}
              onChange={(e) => updateField("collection", e.target.value)}
              placeholder="studio"
              className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            />
          </Field>
          <Field label="Device type">
            <select
              value={form.deviceType}
              onChange={(e) => updateField("deviceType", e.target.value as DeviceType)}
              className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            >
              {DEVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Device model">
            <input
              type="text"
              value={form.deviceModel}
              onChange={(e) => updateField("deviceModel", e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            />
          </Field>
          <Field label="Tags (comma-separated)">
            <input
              type="text"
              value={form.tags}
              onChange={(e) => updateField("tags", e.target.value)}
              placeholder="minimal, concrete, overcast"
              className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            />
          </Field>
          <Field label="Credit author">
            <input
              type="text"
              value={form.creditAuthor}
              onChange={(e) => updateField("creditAuthor", e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            />
          </Field>
          <Field label="License">
            <input
              type="text"
              value={form.creditLicense}
              onChange={(e) => updateField("creditLicense", e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            />
          </Field>

          {error && (
            <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleDownload}
            disabled={busy || !bgFile || !maskFile}
            className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? "Bundling…" : "Download bundle"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-neutral-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

async function canvasToBlob(
  source: HTMLImageElement,
  type: string,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");
  ctx.drawImage(source, 0, 0);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))),
      type,
      quality,
    );
  });
}

async function renderThumb(source: HTMLImageElement): Promise<Blob> {
  const targetWidth = 480;
  const scale = targetWidth / source.width;
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = Math.round(source.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context for thumb");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("thumb encode failed"))),
      "image/webp",
      0.85,
    );
  });
}
