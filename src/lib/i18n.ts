import { useSyncExternalStore } from "react";

export type LanguageCode = "en" | "zh" | "fr";

export const languageStorageKey = "tastemap-language";

export const languageOptions: Array<{
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}> = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "zh", label: "Chinese", nativeLabel: "中文" },
  { code: "fr", label: "French", nativeLabel: "Français" },
];

const messages = {
  en: {
    "header.settings": "Settings",
    "header.language": "Language",
    "auth.login.title": "Welcome back",
    "auth.login.subtitle": "Sign in to your private restaurant memory archive.",
    "auth.signup.title": "Create TasteMap",
    "auth.signup.subtitle":
      "Keep food photos, restaurants, dishes, and revisit decisions private.",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.passwordPlaceholder": "At least 6 characters",
    "auth.emailPlaceholder": "you@example.com",
    "auth.working": "Working",
    "auth.createAccount": "Create account",
    "auth.signIn": "Sign in",
    "auth.alreadyHaveAccount": "Already have an account?",
    "auth.newToTasteMap": "New to TasteMap?",
    "auth.checkEmail": "Check your email to confirm the account, then sign in.",
    "auth.missingSupabase":
      "Supabase env vars are missing. Add .env.local before using auth.",

    "add.hero.eyebrow": "Photo-first record",
    "add.hero.title": "Turn a meal photo into a private memory.",
    "add.status.initial":
      "Add photos if you have them, or type the restaurant and save a quick private log.",
    "add.status.saving": "Saving this restaurant log.",
    "add.state.idle": "Upload",
    "add.state.reading_metadata": "Reading photo data",
    "add.state.uploading_photo": "Uploading",
    "add.state.analyzing_photo": "AI analysis",
    "add.state.finding_restaurants": "Finding places",
    "add.state.confirming_restaurant": "Restaurant",
    "add.state.confirming_dishes": "Dishes",
    "add.state.quick_review": "Review",
    "add.state.saving": "Saving",
    "add.state.success": "Saved",
    "add.state.error": "Needs attention",
    "add.localMode":
      "Local archive mode: you can save on this device right now, even without Supabase. Add .env.local later if you want cloud auth and synced storage.",
    "add.prefill":
      "This log started from a saved to-do item. We prefilled the restaurant context, tags, and note so you can finish it faster.",
    "add.editor.eyebrow": "Unified editor",
    "add.editor.title": "One pass to save this restaurant log",
    "add.editor.subtitle":
      "Photos are optional. If you add more than one, we treat the first as the restaurant shot and use the rest to detect dishes. You can also save with just a restaurant name, stars, and a short note.",
    "add.savePrivate": "Save private record",
    "add.saveLocal": "Save into local archive",
    "add.saveFailed": "Save failed",
    "add.dismiss": "Dismiss",

    "restaurant.confirm.title": "Confirm restaurant",
    "restaurant.confirm.subtitle": "Pick the closest match or keep it manual.",
    "restaurant.matches.title": "Possible matches from your archive",
    "restaurant.matches.subtitle":
      "Same names can belong to different places. Reuse one only if this is truly the same restaurant.",
    "restaurant.noLocation": "No location details yet",
    "restaurant.noCandidates":
      "No nearby candidates yet. Add the restaurant manually and keep moving.",
    "restaurant.manual.title": "Manual restaurant",
    "restaurant.name": "Name",
    "restaurant.city": "City",
    "restaurant.address": "Address",
    "restaurant.namePlaceholder": "Restaurant name",
    "restaurant.addressPlaceholder": "Optional",

    "rating.title": "Restaurant log",
    "rating.subtitle": "Leave a star rating and a short written log for this meal.",
    "rating.starRating": "Star rating",
    "rating.rangeLabel": "0 to 5 stars, in 0.5 steps",
    "rating.spend": "Average spend per person",
    "rating.optional": "Optional",
    "rating.tags": "Tags",
    "rating.existingTags": "Existing tags",
    "rating.addTagPlaceholder": "Add a tag like date night, Thai, cheap...",
    "rating.addTag": "Add tag",
    "rating.tagHelp": "Optional. Press Enter to add and tap a tag to remove it.",
    "rating.logNote": "Log note",
    "rating.notePlaceholder":
      "What stood out, what you would recommend, what to skip next time...",
    "rating.removeTag": "Remove tag",
    "rating.mustRemember": "Must remember.",
    "rating.strongMeal": "Strong meal.",
    "rating.solid": "Solid, but not special.",
    "rating.notAgain": "Would not seek out again.",
    "rating.rough": "Rough meal.",

    "share.eyebrow": "Shared TasteMap card",
    "share.createToSave": "Create account to save",
    "share.signIn": "Sign in",
    "share.photos": "Photos",
    "share.worthOrdering": "Worth ordering",
    "share.skipNextTime": "Skip next time",
    "share.noDishes": "No dishes marked yet.",
    "share.latestVisit": "Latest visit",
    "share.addToDo": "Add to my to-do list",
    "share.added": "Added",
    "share.addedMessage": "Added to your to-do list.",
    "share.addError": "Could not add this restaurant.",
  },
  zh: {
    "header.settings": "设置",
    "header.language": "语言",
    "auth.login.title": "欢迎回来",
    "auth.login.subtitle": "登录你的私人餐厅记忆库。",
    "auth.signup.title": "创建 TasteMap",
    "auth.signup.subtitle": "私密保存美食照片、餐厅、菜品和复访决定。",
    "auth.email": "邮箱",
    "auth.password": "密码",
    "auth.passwordPlaceholder": "至少 6 个字符",
    "auth.emailPlaceholder": "you@example.com",
    "auth.working": "处理中",
    "auth.createAccount": "创建账号",
    "auth.signIn": "登录",
    "auth.alreadyHaveAccount": "已经有账号？",
    "auth.newToTasteMap": "第一次使用 TasteMap？",
    "auth.checkEmail": "请查看邮箱确认账号，然后登录。",
    "auth.missingSupabase": "缺少 Supabase 环境变量。使用登录前请先添加 .env.local。",

    "add.hero.eyebrow": "照片优先记录",
    "add.hero.title": "把一张饭照变成私人的美食记忆。",
    "add.status.initial": "有照片就上传；也可以直接填写餐厅，快速保存一条私人记录。",
    "add.status.saving": "正在保存这条餐厅记录。",
    "add.state.idle": "上传",
    "add.state.reading_metadata": "读取照片数据",
    "add.state.uploading_photo": "上传中",
    "add.state.analyzing_photo": "AI 分析",
    "add.state.finding_restaurants": "查找地点",
    "add.state.confirming_restaurant": "餐厅",
    "add.state.confirming_dishes": "菜品",
    "add.state.quick_review": "评价",
    "add.state.saving": "保存中",
    "add.state.success": "已保存",
    "add.state.error": "需要处理",
    "add.localMode":
      "本地归档模式：即使没有 Supabase，也可以先保存在这台设备上。之后添加 .env.local 即可启用登录、云端上传和同步私密存储。",
    "add.prefill": "这条记录来自一个待吃项目。我们已经预填了餐厅、标签和备注，方便你更快完成记录。",
    "add.editor.eyebrow": "统一编辑器",
    "add.editor.title": "一次完成这条餐厅记录",
    "add.editor.subtitle":
      "照片是可选的。上传多张照片时，第一张会作为餐厅照片，其余用于识别菜品。你也可以只填写餐厅名、评分和简短备注来保存。",
    "add.savePrivate": "保存私人记录",
    "add.saveLocal": "保存到本地归档",
    "add.saveFailed": "保存失败",
    "add.dismiss": "关闭",

    "restaurant.confirm.title": "确认餐厅",
    "restaurant.confirm.subtitle": "选择最接近的匹配，或继续手动填写。",
    "restaurant.matches.title": "你的归档中可能匹配的餐厅",
    "restaurant.matches.subtitle": "同名餐厅可能是不同地点。只有确认是同一家时才复用。",
    "restaurant.noLocation": "暂无地点信息",
    "restaurant.noCandidates": "暂时没有附近候选。可以手动添加餐厅并继续。",
    "restaurant.manual.title": "手动填写餐厅",
    "restaurant.name": "名称",
    "restaurant.city": "城市",
    "restaurant.address": "地址",
    "restaurant.namePlaceholder": "餐厅名称",
    "restaurant.addressPlaceholder": "可选",

    "rating.title": "餐厅记录",
    "rating.subtitle": "为这顿饭留下星级评分和简短文字记录。",
    "rating.starRating": "星级评分",
    "rating.rangeLabel": "0 到 5 星，支持 0.5 星",
    "rating.spend": "人均消费",
    "rating.optional": "可选",
    "rating.tags": "标签",
    "rating.existingTags": "已有标签",
    "rating.addTagPlaceholder": "添加标签，例如约会夜、泰餐、便宜...",
    "rating.addTag": "添加标签",
    "rating.tagHelp": "可选。按 Enter 添加，点击标签可移除。",
    "rating.logNote": "记录备注",
    "rating.notePlaceholder": "哪里好吃、推荐什么、下次避开什么...",
    "rating.removeTag": "移除标签",
    "rating.mustRemember": "一定要记住。",
    "rating.strongMeal": "很不错的一餐。",
    "rating.solid": "还可以，但不算特别。",
    "rating.notAgain": "不会特意再去。",
    "rating.rough": "体验不太好。",

    "share.eyebrow": "TasteMap 分享卡片",
    "share.createToSave": "创建账号并保存",
    "share.signIn": "登录",
    "share.photos": "照片",
    "share.worthOrdering": "值得点",
    "share.skipNextTime": "下次避开",
    "share.noDishes": "还没有标记菜品。",
    "share.latestVisit": "最近一次到访",
    "share.addToDo": "加入我的待吃清单",
    "share.added": "已加入",
    "share.addedMessage": "已加入你的待吃清单。",
    "share.addError": "无法加入这个餐厅。",
  },
  fr: {
    "header.settings": "Paramètres",
    "header.language": "Langue",
    "auth.login.title": "Bon retour",
    "auth.login.subtitle": "Connectez-vous à votre archive privée de restaurants.",
    "auth.signup.title": "Créer TasteMap",
    "auth.signup.subtitle":
      "Gardez vos photos, restaurants, plats et décisions de retour en privé.",
    "auth.email": "E-mail",
    "auth.password": "Mot de passe",
    "auth.passwordPlaceholder": "Au moins 6 caractères",
    "auth.emailPlaceholder": "vous@example.com",
    "auth.working": "En cours",
    "auth.createAccount": "Créer un compte",
    "auth.signIn": "Se connecter",
    "auth.alreadyHaveAccount": "Vous avez déjà un compte ?",
    "auth.newToTasteMap": "Nouveau sur TasteMap ?",
    "auth.checkEmail": "Confirmez votre compte par e-mail, puis connectez-vous.",
    "auth.missingSupabase":
      "Variables Supabase manquantes. Ajoutez .env.local avant d'utiliser l'authentification.",

    "add.hero.eyebrow": "Note à partir d'une photo",
    "add.hero.title": "Transformez une photo de repas en souvenir privé.",
    "add.status.initial":
      "Ajoutez des photos si vous en avez, ou saisissez le restaurant pour enregistrer une note rapide.",
    "add.status.saving": "Enregistrement de cette note de restaurant.",
    "add.state.idle": "Téléverser",
    "add.state.reading_metadata": "Lecture des données photo",
    "add.state.uploading_photo": "Téléversement",
    "add.state.analyzing_photo": "Analyse IA",
    "add.state.finding_restaurants": "Recherche de lieux",
    "add.state.confirming_restaurant": "Restaurant",
    "add.state.confirming_dishes": "Plats",
    "add.state.quick_review": "Avis",
    "add.state.saving": "Enregistrement",
    "add.state.success": "Enregistré",
    "add.state.error": "À vérifier",
    "add.localMode":
      "Mode archive locale : vous pouvez enregistrer sur cet appareil même sans Supabase. Ajoutez .env.local plus tard pour activer la connexion, les uploads cloud et le stockage synchronisé.",
    "add.prefill":
      "Cette note vient d'un élément à essayer. Le restaurant, les tags et la note ont été préremplis pour aller plus vite.",
    "add.editor.eyebrow": "Éditeur unifié",
    "add.editor.title": "Enregistrer cette note en une seule passe",
    "add.editor.subtitle":
      "Les photos sont facultatives. Avec plusieurs photos, la première sert de photo du restaurant et les autres aident à détecter les plats. Vous pouvez aussi enregistrer seulement un nom, une note et un court commentaire.",
    "add.savePrivate": "Enregistrer en privé",
    "add.saveLocal": "Enregistrer en local",
    "add.saveFailed": "Échec de l'enregistrement",
    "add.dismiss": "Fermer",

    "restaurant.confirm.title": "Confirmer le restaurant",
    "restaurant.confirm.subtitle": "Choisissez la meilleure correspondance ou gardez une saisie manuelle.",
    "restaurant.matches.title": "Correspondances possibles dans votre archive",
    "restaurant.matches.subtitle":
      "Deux restaurants peuvent avoir le même nom. Réutilisez seulement si c'est vraiment le même lieu.",
    "restaurant.noLocation": "Aucun détail de localisation",
    "restaurant.noCandidates":
      "Aucun candidat à proximité pour le moment. Ajoutez le restaurant manuellement.",
    "restaurant.manual.title": "Restaurant manuel",
    "restaurant.name": "Nom",
    "restaurant.city": "Ville",
    "restaurant.address": "Adresse",
    "restaurant.namePlaceholder": "Nom du restaurant",
    "restaurant.addressPlaceholder": "Facultatif",

    "rating.title": "Note du restaurant",
    "rating.subtitle": "Ajoutez une note étoilée et un court commentaire pour ce repas.",
    "rating.starRating": "Note étoilée",
    "rating.rangeLabel": "0 à 5 étoiles, par pas de 0,5",
    "rating.spend": "Dépense moyenne par personne",
    "rating.optional": "Facultatif",
    "rating.tags": "Tags",
    "rating.existingTags": "Tags existants",
    "rating.addTagPlaceholder": "Ajoutez un tag comme rendez-vous, thaï, pas cher...",
    "rating.addTag": "Ajouter un tag",
    "rating.tagHelp": "Facultatif. Appuyez sur Entrée pour ajouter, touchez un tag pour le retirer.",
    "rating.logNote": "Note",
    "rating.notePlaceholder":
      "Ce qui ressort, ce que vous recommandez, ce qu'il faut éviter...",
    "rating.removeTag": "Retirer le tag",
    "rating.mustRemember": "À retenir absolument.",
    "rating.strongMeal": "Très bon repas.",
    "rating.solid": "Correct, mais pas exceptionnel.",
    "rating.notAgain": "Je ne chercherais pas à y retourner.",
    "rating.rough": "Expérience difficile.",

    "share.eyebrow": "Carte TasteMap partagée",
    "share.createToSave": "Créer un compte pour sauvegarder",
    "share.signIn": "Se connecter",
    "share.photos": "Photos",
    "share.worthOrdering": "À commander",
    "share.skipNextTime": "À éviter la prochaine fois",
    "share.noDishes": "Aucun plat marqué pour le moment.",
    "share.latestVisit": "Dernière visite",
    "share.addToDo": "Ajouter à ma liste",
    "share.added": "Ajouté",
    "share.addedMessage": "Ajouté à votre liste.",
    "share.addError": "Impossible d'ajouter ce restaurant.",
  },
} satisfies Record<LanguageCode, Record<string, string>>;

export type I18nKey = keyof typeof messages.en;

const listeners = new Set<() => void>();

export function getBrowserLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(languageStorageKey);
  return isLanguageCode(saved) ? saved : "en";
}

export function setBrowserLanguage(language: LanguageCode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(languageStorageKey, language);
  document.documentElement.lang = language;
  listeners.forEach((listener) => listener());
}

export function useLanguage() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getBrowserLanguage,
    (): LanguageCode => "en",
  );
}

export function useI18n() {
  const language = useLanguage();
  return {
    language,
    t: (key: I18nKey) => translate(key, language),
  };
}

export function translate(key: I18nKey, language: LanguageCode = "en") {
  return messages[language][key] ?? messages.en[key] ?? key;
}

export function isLanguageCode(value: string | null): value is LanguageCode {
  return value === "en" || value === "zh" || value === "fr";
}
