"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import {
  AtSign,
  Camera,
  RotateCcw,
  Save,
  Upload,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  defaultDisplayNameForLanguage,
  generateProfileHandle,
  profileInitial,
} from "@/lib/profileUtils";
import { useI18n } from "@/lib/i18n";
import {
  canUseSupabaseInBrowser,
  createSupabaseBrowserClient,
} from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

type ProfileFormProps = {
  initialProfile: Pick<Profile, "display_name" | "handle" | "avatar_url"> | null;
  mode?: "setup" | "edit";
  nextPath?: string;
};

export function ProfileForm({
  initialProfile,
  mode = "edit",
  nextPath = "/",
}: ProfileFormProps) {
  const router = useRouter();
  const { language, t } = useI18n();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [defaultHandle] = useState(() => generateProfileHandle());
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [displayNameTouched, setDisplayNameTouched] = useState(false);
  const [handleTouched, setHandleTouched] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const effectiveDisplayName = displayNameTouched
    ? displayName
    : (initialProfile?.display_name ?? defaultDisplayNameForLanguage(language));
  const effectiveHandle = handleTouched
    ? handle
    : (initialProfile?.handle ?? defaultHandle);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const normalizedHandle = effectiveHandle.trim().toLowerCase();
    if (!/^[A-Za-z0-9._-]{1,20}$/.test(normalizedHandle)) {
      setMessage(t("profile.handleInvalid"));
      return;
    }

    setIsSaving(true);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: effectiveDisplayName.trim(),
        handle: normalizedHandle,
        avatar_url: avatarUrl.trim(),
      }),
    });
    setIsSaving(false);

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      setMessage(payload?.error ?? t("profile.saveError"));
      return;
    }

    setMessage(t("profile.saved"));
    router.refresh();

    if (mode === "setup") {
      router.push(sanitizeNextPath(nextPath));
    }
  }

  const previewProfile = {
    display_name: effectiveDisplayName,
    handle: effectiveHandle,
  };

  async function uploadAvatarFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!canUseSupabaseInBrowser()) {
      setMessage(t("auth.missingSupabase"));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage(t("profile.avatarInvalid"));
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setMessage(t("profile.avatarTooLarge"));
      return;
    }

    setIsUploadingAvatar(true);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsUploadingAvatar(false);
      setMessage(t("auth.missingSupabase"));
      return;
    }

    const extension = extensionFromMimeType(file.type);
    const path = `${user.id}/avatar-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

    if (error) {
      setIsUploadingAvatar(false);
      setMessage(error.message);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setIsUploadingAvatar(false);
    setMessage(t("profile.avatarReady"));
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="flex items-center gap-4 rounded-lg bg-stone-50 p-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="size-16 rounded-full border border-stone-200 object-cover"
          />
        ) : (
          <div className="grid size-16 place-items-center rounded-full bg-stone-950 text-xl font-bold text-white">
            {profileInitial(previewProfile)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-stone-950">
            {effectiveDisplayName || t("profile.displayNamePlaceholder")}
          </p>
          <p className="truncate text-sm font-semibold text-stone-500">
            @{effectiveHandle || t("profile.handlePlaceholder")}
          </p>
        </div>
      </div>

      <div className="grid gap-2 rounded-lg border border-stone-200 bg-white p-3">
        <p className="text-sm font-semibold text-stone-700">
          {t("profile.avatar")}
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:opacity-60"
          >
            <Upload aria-hidden="true" className="size-4" />
            {t("profile.uploadAvatar")}
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:opacity-60"
          >
            <Camera aria-hidden="true" className="size-4" />
            {t("profile.takeAvatar")}
          </button>
          <button
            type="button"
            onClick={() => setAvatarUrl("")}
            disabled={isUploadingAvatar}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-white disabled:opacity-60"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            {t("profile.defaultAvatar")}
          </button>
        </div>
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={uploadAvatarFile}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={uploadAvatarFile}
        />
        <p className="text-xs leading-5 text-stone-500">
          {isUploadingAvatar ? t("profile.avatarUploading") : t("profile.avatarHelp")}
        </p>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-stone-700">
        {t("profile.displayName")}
        <span className="relative">
          <UserRound
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            required
            maxLength={30}
            value={effectiveDisplayName}
            onChange={(event) => {
              setDisplayNameTouched(true);
              setDisplayName(event.target.value);
            }}
            className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            placeholder={t("profile.displayNamePlaceholder")}
          />
        </span>
      </label>

      <div className="grid gap-2 text-sm font-semibold text-stone-700">
        <div className="flex items-center justify-between gap-3">
          <span>{t("profile.handle")}</span>
          <button
            type="button"
            onClick={() => {
              setHandleTouched(true);
              setHandle(generateProfileHandle());
            }}
            className="text-xs font-bold text-stone-700 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-950"
          >
            {t("profile.randomHandle")}
          </button>
        </div>
        <span className="relative">
          <AtSign
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            required
            maxLength={20}
            value={effectiveHandle}
            onChange={(event) => {
              setHandleTouched(true);
              setHandle(event.target.value);
            }}
            className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            placeholder={t("profile.handlePlaceholder")}
          />
        </span>
        <span className="text-xs font-normal leading-5 text-stone-500">
          {t("profile.handleHelp")}
        </span>
      </div>

      {message ? (
        <p className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
      >
        <Save aria-hidden="true" className="size-4" />
        {isSaving ? t("profile.saving") : t("profile.save")}
      </button>
    </form>
  );
}

function sanitizeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/profile/setup")) return "/";
  return value;
}

function extensionFromMimeType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/heic") return "heic";
  if (type === "image/heif") return "heif";
  return "jpg";
}
