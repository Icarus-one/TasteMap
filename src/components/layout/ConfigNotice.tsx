import { I18nText } from "@/components/i18n/I18nText";

export function ConfigNotice() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <I18nText k="config.localMode" />
    </div>
  );
}
