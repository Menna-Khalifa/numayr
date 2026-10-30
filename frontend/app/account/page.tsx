"use client";

import AppShell from "@/components/app/AppShell";
import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/lib/auth";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BellRing,
  CalendarDays,
  Check,
  ChevronLeft,
  CircleUserRound,
  FileText,
  Globe2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";

type Profile = {
  id?: number;
  user_id?: number;
  avatar: string | null;
  city: string | null;
  nationality: string | null;
  birth_date: string | null;
};

type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  profile: Profile | null;
};

type Address = {
  id: number;
  label: string | null;
  city: string;
  district: string | null;
  street: string | null;
  building: string | null;
  postal_code: string | null;
  latitude: string | null;
  longitude: string | null;
  notes: string | null;
  is_default: boolean;
};

type NotificationPreferences = {
  id: number;
  user_id: number;
  in_app_enabled: boolean;
  sms_enabled: boolean;
  smart_alerts_enabled: boolean;
  settings: unknown[];
};

type ProfileResponse = {
  success: true;
  message?: string;
  data: {
    user: User;
  };
};

type AddressesResponse = {
  success: true;
  data: {
    addresses: Address[];
  };
};

type AddressResponse = {
  success: true;
  message: string;
  data: {
    address: Address;
  };
};

type PreferencesResponse = {
  success: true;
  message?: string;
  data: {
    preferences: NotificationPreferences;
  };
};

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [city, setCity] = useState("");
  const [nationality, setNationality] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] =
    useState<Address | null>(null);

  const [deleteAddress, setDeleteAddress] =
    useState<Address | null>(null);

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadAccount() {
      try {
        const [
          profileResponse,
          addressesResponse,
          preferencesResponse,
        ] = await Promise.all([
          apiRequest<ProfileResponse>("/profile", {
            token,
          }),
          apiRequest<AddressesResponse>("/addresses", {
            token,
          }),
          apiRequest<PreferencesResponse>(
            "/notification-preferences",
            {
              token,
            }
          ),
        ]);

        const loadedUser = profileResponse.data.user;

        setUser(loadedUser);
        setAddresses(addressesResponse.data.addresses);
        setPreferences(
          preferencesResponse.data.preferences
        );

        setName(loadedUser.name ?? "");
        setPhone(loadedUser.phone ?? "");
        setAvatar(loadedUser.profile?.avatar ?? "");
        setCity(loadedUser.profile?.city ?? "");
        setNationality(
          loadedUser.profile?.nationality ?? ""
        );
        setBirthDate(
          loadedUser.profile?.birth_date
            ? loadedUser.profile.birth_date.slice(0, 10)
            : ""
        );
      } catch (exception) {
        if (
          exception instanceof ApiError &&
          exception.status === 401
        ) {
          removeAuthToken();
          router.replace("/login");
          return;
        }

        setPageError("تعذر تحميل بيانات الحساب");
      } finally {
        setLoading(false);
      }
    }

    void loadAccount();
  }, [router]);

  async function saveProfile(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token = getAuthToken();

    if (!token) {
      return;
    }

    if (!/^05[0-9]{8}$/.test(phone.trim())) {
      setProfileError("رقم الجوال مطلوب بصيغة سعودية صحيحة: 05xxxxxxxx");
      return;
    }

    setProfileError("");
    setProfileMessage("");
    setSavingProfile(true);

    try {
      const response =
        await apiRequest<ProfileResponse>("/profile", {
          method: "PUT",
          token,
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            avatar: avatar.trim() || null,
            city: city.trim() || null,
            nationality: nationality.trim() || null,
            birth_date: birthDate || null,
          }),
        });

      setUser(response.data.user);
      setEditingProfile(false);
      setProfileMessage(
        response.message ||
          "تم تحديث الملف الشخصي بنجاح"
      );
    } catch (exception) {
      if (exception instanceof ApiError) {
        setProfileError(exception.message);
      } else {
        setProfileError(
          "تعذر تحديث الملف الشخصي"
        );
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function togglePreference(
    key:
      | "in_app_enabled"
      | "sms_enabled"
      | "smart_alerts_enabled"
  ) {
    const token = getAuthToken();

    if (!token || !preferences) {
      return;
    }

    const nextValue = !preferences[key];

    const nextPreferences = {
      ...preferences,
      [key]: nextValue,
    };

    setPreferences(nextPreferences);

    try {
      const response =
        await apiRequest<PreferencesResponse>(
          "/notification-preferences",
          {
            method: "PATCH",
            token,
            body: JSON.stringify({
              in_app_enabled:
                nextPreferences.in_app_enabled,
              sms_enabled:
                nextPreferences.sms_enabled,
              smart_alerts_enabled:
                nextPreferences.smart_alerts_enabled,
              settings:
                nextPreferences.settings ?? [],
            }),
          }
        );

      setPreferences(
        response.data.preferences
      );
    } catch {
      setPreferences(preferences);
    }
  }

  async function setDefaultAddress(
    address: Address
  ) {
    const token = getAuthToken();

    if (!token) {
      return;
    }

    try {
      await apiRequest(
        `/addresses/${address.id}/default`,
        {
          method: "PATCH",
          token,
        }
      );

      setAddresses((current) =>
        current.map((item) => ({
          ...item,
          is_default:
            item.id === address.id,
        }))
      );
    } catch {
      setPageError(
        "تعذر تعيين العنوان الافتراضي"
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f9fb]">
        <div className="flex flex-col items-center">
          <span className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#d4e8ed] border-t-[#16a6c9]" />

          <p className="mt-4 text-sm font-extrabold text-[#718197]">
            جاري تحميل حسابك...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-[900px]">
          <div className="rounded-[28px] bg-white p-8 text-center">
            <p className="font-extrabold text-[#0d2b4e]">
              تعذر تحميل الحساب
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell userName={user.name}>
      <div className="mx-auto max-w-[1500px]">
        <motion.section
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="relative overflow-hidden rounded-[30px] bg-[#0d2b4e] p-6 shadow-[0_24px_70px_rgba(13,43,78,.15)] sm:p-8"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(22,166,201,.32),transparent_30%),linear-gradient(135deg,#123d67,#0d2b4e_55%,#081f39)]" />

          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-[82px] w-[82px] shrink-0 items-center justify-center overflow-hidden rounded-[25px] border border-white/10 bg-white/10">
                {user.profile?.avatar ? (
                  <img
                    src={user.profile.avatar}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound className="h-9 w-9 text-[#68def4]" />
                )}
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1.5 text-[10px] font-extrabold text-[#6adcf2]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  حساب نمير
                </div>

                <h1 className="mt-3 text-[27px] font-extrabold text-white sm:text-[34px]">
                  {user.name}
                </h1>

                <p className="mt-1 text-xs font-bold text-white/45">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setEditingProfile(true)
              }
              className="flex h-[48px] items-center justify-center gap-2 rounded-[15px] bg-white px-5 text-xs font-extrabold text-[#0d2b4e]"
            >
              <Pencil className="h-4 w-4 text-[#16a6c9]" />
              تعديل البيانات
            </button>
          </div>
        </motion.section>

        {pageError ? (
          <div className="mt-5 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {pageError}
          </div>
        ) : null}

        {profileMessage ? (
          <div className="mt-5 rounded-[18px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {profileMessage}
          </div>
        ) : null}

        <section className="mt-7 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
          <div className="space-y-6">
            <div className="rounded-[27px] border border-[#e0ecef] bg-white p-5 shadow-[0_12px_38px_rgba(13,43,78,.045)] sm:p-6">
              <SectionHeading
                icon={
                  <CircleUserRound className="h-5 w-5" />
                }
                eyebrow="الملف الشخصي"
                title="بياناتي"
              />

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <DataCard
                  label="الاسم"
                  value={user.name}
                  icon={
                    <UserRound className="h-4 w-4" />
                  }
                />

                <DataCard
                  label="رقم الجوال"
                  value={user.phone}
                  icon={
                    <Phone className="h-4 w-4" />
                  }
                />

                <DataCard
                  label="البريد الإلكتروني"
                  value={user.email}
                  icon={
                    <Globe2 className="h-4 w-4" />
                  }
                />

                <DataCard
                  label="المدينة"
                  value={
                    user.profile?.city ||
                    "غير محددة"
                  }
                  icon={
                    <MapPin className="h-4 w-4" />
                  }
                />

                <DataCard
                  label="الجنسية"
                  value={
                    user.profile?.nationality ||
                    "غير محددة"
                  }
                  icon={
                    <Globe2 className="h-4 w-4" />
                  }
                />

                <DataCard
                  label="تاريخ الميلاد"
                  value={
                    user.profile?.birth_date
                      ? formatDate(
                          user.profile.birth_date
                        )
                      : "غير محدد"
                  }
                  icon={
                    <CalendarDays className="h-4 w-4" />
                  }
                />
              </div>
            </div>

            <div className="rounded-[27px] border border-[#e0ecef] bg-white p-5 shadow-[0_12px_38px_rgba(13,43,78,.045)] sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <SectionHeading
                  icon={
                    <MapPin className="h-5 w-5" />
                  }
                  eyebrow="المواقع"
                  title="عناويني"
                />

                <button
                  type="button"
                  onClick={() => {
                    setEditingAddress(null);
                    setAddressModalOpen(true);
                  }}
                  className="flex h-10 items-center gap-2 rounded-[13px] bg-[#0d2b4e] px-4 text-[11px] font-extrabold text-white"
                >
                  <Plus className="h-4 w-4" />
                  إضافة عنوان
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="mt-6 rounded-[20px] border border-dashed border-[#d3e4e9] bg-[#f8fcfd] px-5 py-10 text-center">
                  <MapPin className="mx-auto h-7 w-7 text-[#16a6c9]" />

                  <p className="mt-3 text-sm font-extrabold text-[#0d2b4e]">
                    لا توجد عناوين محفوظة
                  </p>

                  <p className="mt-2 text-xs font-bold text-[#8699a6]">
                    أضف عنوانًا لاستخدامه في طلباتك.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {addresses.map((address) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      onEdit={() => {
                        setEditingAddress(address);
                        setAddressModalOpen(true);
                      }}
                      onDelete={() =>
                        setDeleteAddress(address)
                      }
                      onSetDefault={() =>
                        void setDefaultAddress(
                          address
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[27px] border border-[#e0ecef] bg-white p-5 shadow-[0_12px_38px_rgba(13,43,78,.045)] sm:p-6">
              <SectionHeading
                icon={
                  <BellRing className="h-5 w-5" />
                }
                eyebrow="التنبيهات"
                title="تفضيلات الإشعارات"
              />

              {preferences ? (
                <div className="mt-6 space-y-3">
                  <PreferenceRow
                    icon={
                      <Bell className="h-4 w-4" />
                    }
                    title="إشعارات داخل التطبيق"
                    description="تنبيهات الطلبات والخدمات داخل نمير."
                    checked={
                      preferences.in_app_enabled
                    }
                    onToggle={() =>
                      void togglePreference(
                        "in_app_enabled"
                      )
                    }
                  />

                  <PreferenceRow
                    icon={
                      <Smartphone className="h-4 w-4" />
                    }
                    title="رسائل SMS"
                    description="استلام التنبيهات المهمة على الجوال."
                    checked={
                      preferences.sms_enabled
                    }
                    onToggle={() =>
                      void togglePreference(
                        "sms_enabled"
                      )
                    }
                  />

                  <PreferenceRow
                    icon={
                      <SparklesIcon />
                    }
                    title="التنبيهات الذكية"
                    description="تذكيرات دورية مرتبطة بحالة البرادة."
                    checked={
                      preferences.smart_alerts_enabled
                    }
                    onToggle={() =>
                      void togglePreference(
                        "smart_alerts_enabled"
                      )
                    }
                  />
                </div>
              ) : null}
            </div>

            <div className="rounded-[27px] border border-[#e0ecef] bg-white p-5 shadow-[0_12px_38px_rgba(13,43,78,.045)] sm:p-6">
              <p className="text-[10px] font-extrabold text-[#16a6c9]">
                إدارة الحساب
              </p>

              <h2 className="mt-1 text-lg font-extrabold text-[#0d2b4e]">
                الوصول السريع
              </h2>

              <div className="mt-5 space-y-2">
                <QuickLink
                  href="/subscriptions"
                  icon={
                    <ShieldCheck className="h-4 w-4" />
                  }
                  title="الاشتراكات"
                  description="الباقات والاشتراكات الحالية"
                />

                <QuickLink
                  href="/orders"
                  icon={
                    <PackageIcon />
                  }
                  title="طلباتي"
                  description="متابعة الطلبات والخدمات"
                />

                <QuickLink
                  href="/invoices"
                  icon={
                    <FileText className="h-4 w-4" />
                  }
                  title="الفواتير"
                  description="الفواتير والمدفوعات"
                />
              </div>
            </div>
          </aside>
        </section>

        <AnimatePresence>
          {editingProfile ? (
            <ProfileModal
              email={user.email}
              name={name}
              phone={phone}
              avatar={avatar}
              city={city}
              nationality={nationality}
              birthDate={birthDate}
              setName={setName}
              setPhone={setPhone}
              setAvatar={setAvatar}
              setCity={setCity}
              setNationality={setNationality}
              setBirthDate={setBirthDate}
              saving={savingProfile}
              error={profileError}
              onClose={() => {
                setEditingProfile(false);
                setProfileError("");
              }}
              onSubmit={saveProfile}
            />
          ) : null}

          {addressModalOpen ? (
            <AddressModal
              address={editingAddress}
              onClose={() => {
                setAddressModalOpen(false);
                setEditingAddress(null);
              }}
              onSaved={(savedAddress) => {
                setAddresses((current) => {
                  const exists = current.some(
                    (item) =>
                      item.id === savedAddress.id
                  );

                  if (exists) {
                    return current.map((item) =>
                      item.id === savedAddress.id
                        ? savedAddress
                        : savedAddress.is_default
                          ? {
                              ...item,
                              is_default: false,
                            }
                          : item
                    );
                  }

                  return [
                    savedAddress,
                    ...current.map((item) =>
                      savedAddress.is_default
                        ? {
                            ...item,
                            is_default: false,
                          }
                        : item
                    ),
                  ];
                });

                setAddressModalOpen(false);
                setEditingAddress(null);
              }}
            />
          ) : null}

          {deleteAddress ? (
            <DeleteAddressModal
              address={deleteAddress}
              onClose={() =>
                setDeleteAddress(null)
              }
              onDeleted={() => {
                const deletedId =
                  deleteAddress.id;

                setAddresses((current) =>
                  current.filter(
                    (item) =>
                      item.id !== deletedId
                  )
                );

                setDeleteAddress(null);

                void refreshAddresses(
                  setAddresses
                );
              }}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function SectionHeading({
  icon,
  eyebrow,
  title,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#eaf8fb] text-[#16a6c9]">
        {icon}
      </div>

      <div>
        <p className="text-[10px] font-extrabold text-[#16a6c9]">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-lg font-extrabold text-[#0d2b4e]">
          {title}
        </h2>
      </div>
    </div>
  );
}

function DataCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[18px] bg-[#f7fbfc] p-4">
      <div className="flex items-center gap-2 text-[#16a6c9]">
        {icon}

        <span className="text-[10px] font-bold text-[#8a9da9]">
          {label}
        </span>
      </div>

      <p className="mt-2 truncate text-sm font-extrabold text-[#0d2b4e]">
        {value}
      </p>
    </div>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <div className="relative rounded-[21px] border border-[#dfeaed] bg-[#fbfdfe] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#eaf8fb] text-[#16a6c9]">
          <MapPin className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-extrabold text-[#0d2b4e]">
              {address.label ||
                "عنوان بدون اسم"}
            </h3>

            {address.is_default ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-extrabold text-emerald-700">
                افتراضي
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-xs font-bold leading-6 text-[#8194a2]">
            {address.city}
            {address.district
              ? `، ${address.district}`
              : ""}
            {address.street
              ? `، ${address.street}`
              : ""}
          </p>

          {address.building ? (
            <p className="mt-1 text-[10px] font-bold text-[#93a4ae]">
              مبنى {address.building}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e8f0f2] pt-3">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-9 items-center gap-1.5 rounded-[11px] bg-white px-3 text-[10px] font-extrabold text-[#0d2b4e]"
        >
          <Pencil className="h-3.5 w-3.5 text-[#16a6c9]" />
          تعديل
        </button>

        {!address.is_default ? (
          <button
            type="button"
            onClick={onSetDefault}
            className="flex h-9 items-center gap-1.5 rounded-[11px] bg-white px-3 text-[10px] font-extrabold text-[#16a6c9]"
          >
            <Check className="h-3.5 w-3.5" />
            تعيين افتراضي
          </button>
        ) : null}

        <button
          type="button"
          onClick={onDelete}
          className="mr-auto flex h-9 items-center gap-1.5 rounded-[11px] bg-red-50 px-3 text-[10px] font-extrabold text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
          حذف
        </button>
      </div>
    </div>
  );
}

function PreferenceRow({
  icon,
  title,
  description,
  checked,
  onToggle,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-[#f7fbfc] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-white text-[#16a6c9]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold text-[#0d2b4e]">
          {title}
        </p>

        <p className="mt-1 text-[10px] font-bold leading-5 text-[#8799a6]">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked
            ? "bg-[#16a6c9]"
            : "bg-[#d5e2e6]"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
            checked
              ? "left-1"
              : "left-6"
          }`}
        />
      </button>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-[17px] bg-[#f7fbfc] p-4 transition hover:bg-[#edf8fa]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-white text-[#16a6c9]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold text-[#0d2b4e]">
          {title}
        </p>

        <p className="mt-1 text-[10px] font-bold text-[#8799a6]">
          {description}
        </p>
      </div>

      <ChevronLeft className="h-4 w-4 text-[#a0b0b9] transition-transform group-hover:-translate-x-1" />
    </Link>
  );
}

function ProfileModal({
  email,
  name,
  phone,
  avatar,
  city,
  nationality,
  birthDate,
  setName,
  setPhone,
  setAvatar,
  setCity,
  setNationality,
  setBirthDate,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  email: string;
  name: string;
  phone: string;
  avatar: string;
  city: string;
  nationality: string;
  birthDate: string;
  setName: (value: string) => void;
  setPhone: (value: string) => void;
  setAvatar: (value: string) => void;
  setCity: (value: string) => void;
  setNationality: (value: string) => void;
  setBirthDate: (value: string) => void;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>
  ) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-[#061a2f]/50 backdrop-blur-[4px]"
      />

      <motion.div
        initial={{
          opacity: 0,
          y: 25,
          scale: 0.97,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          scale: 0.97,
        }}
        className="fixed inset-x-4 top-1/2 z-[90] mx-auto max-h-[90vh] max-w-[600px] -translate-y-1/2 overflow-y-auto rounded-[30px] bg-white shadow-[0_35px_100px_rgba(5,24,44,.28)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#0d2b4e] px-5 py-4">
          <div>
            <p className="text-[10px] font-extrabold text-[#68dcf3]">
              حسابي
            </p>

            <h2 className="mt-1 font-extrabold text-white">
              تعديل البيانات الشخصية
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white/10 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="p-5 sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="الاسم"
              value={name}
              onChange={setName}
              required
            />

            <InputField
              label="رقم الجوال"
              value={phone}
              onChange={setPhone}
              required
              dir="ltr"
            />

            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-extrabold text-[#0d2b4e]">
                البريد الإلكتروني
              </label>

              <input
                value={email}
                disabled
                dir="ltr"
                className="h-[52px] w-full rounded-[15px] border border-[#e2eaed] bg-[#f4f7f8] px-4 text-left text-sm font-bold text-[#8d9da7]"
              />

              <p className="mt-2 text-[10px] font-bold text-[#94a5af]">
                تعديل البريد الإلكتروني غير متاح حاليًا من النظام.
              </p>
            </div>

            <InputField
              label="المدينة"
              value={city}
              onChange={setCity}
            />

            <InputField
              label="الجنسية"
              value={nationality}
              onChange={setNationality}
            />

            <div>
              <label className="mb-2 block text-xs font-extrabold text-[#0d2b4e]">
                تاريخ الميلاد
              </label>

              <input
                type="date"
                value={birthDate}
                onChange={(event) =>
                  setBirthDate(
                    event.target.value
                  )
                }
                className="h-[52px] w-full rounded-[15px] border border-[#dce8ec] px-4 text-sm font-bold text-[#0d2b4e] outline-none focus:border-[#16a6c9]"
              />
            </div>

            <InputField
              label="رابط الصورة الشخصية"
              value={avatar}
              onChange={setAvatar}
              dir="ltr"
            />
          </div>

          {avatar ? (
            <div className="mt-4 flex items-center gap-3 rounded-[18px] bg-[#f6fafb] p-3">
              <img
                src={avatar}
                alt="الصورة الشخصية"
                className="h-14 w-14 rounded-[16px] object-cover"
              />

              <p className="text-xs font-bold text-[#7e919e]">
                معاينة الصورة الشخصية
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-[14px] bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#0d2b4e] text-xs font-extrabold text-white disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving
              ? "جاري الحفظ..."
              : "حفظ التعديلات"}
          </button>
        </form>
      </motion.div>
    </>
  );
}

function AddressModal({
  address,
  onClose,
  onSaved,
}: {
  address: Address | null;
  onClose: () => void;
  onSaved: (address: Address) => void;
}) {
  const [label, setLabel] = useState(
    address?.label ?? ""
  );
  const [city, setCity] = useState(
    address?.city ?? ""
  );
  const [district, setDistrict] = useState(
    address?.district ?? ""
  );
  const [street, setStreet] = useState(
    address?.street ?? ""
  );
  const [building, setBuilding] = useState(
    address?.building ?? ""
  );
  const [postalCode, setPostalCode] = useState(
    address?.postal_code ?? ""
  );
  const [latitude, setLatitude] = useState(
    address?.latitude ?? ""
  );
  const [longitude, setLongitude] = useState(
    address?.longitude ?? ""
  );
  const [notes, setNotes] = useState(
    address?.notes ?? ""
  );
  const [isDefault, setIsDefault] = useState(
    address?.is_default ?? false
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token = getAuthToken();

    if (!token) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await apiRequest<AddressResponse>(
          address
            ? `/addresses/${address.id}`
            : "/addresses",
          {
            method: address
              ? "PUT"
              : "POST",
            token,
            body: JSON.stringify({
              label: label.trim() || null,
              city: city.trim(),
              district:
                district.trim() || null,
              street:
                street.trim() || null,
              building:
                building.trim() || null,
              postal_code:
                postalCode.trim() || null,
              latitude:
                latitude.trim() || null,
              longitude:
                longitude.trim() || null,
              notes:
                notes.trim() || null,
              is_default: isDefault,
            }),
          }
        );

      onSaved(response.data.address);
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      } else {
        setError("تعذر حفظ العنوان");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-[#061a2f]/50 backdrop-blur-[4px]"
      />

      <motion.div
        initial={{
          opacity: 0,
          y: 25,
          scale: 0.97,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          scale: 0.97,
        }}
        className="fixed inset-x-4 top-1/2 z-[90] mx-auto max-h-[90vh] max-w-[640px] -translate-y-1/2 overflow-y-auto rounded-[30px] bg-white shadow-[0_35px_100px_rgba(5,24,44,.28)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#0d2b4e] px-5 py-4">
          <div>
            <p className="text-[10px] font-extrabold text-[#68dcf3]">
              العناوين
            </p>

            <h2 className="mt-1 font-extrabold text-white">
              {address
                ? "تعديل العنوان"
                : "إضافة عنوان جديد"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white/10 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={submit}
          className="p-5 sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="اسم العنوان"
              value={label}
              onChange={setLabel}
              placeholder="مثال: المنزل أو المكتب"
            />

            <InputField
              label="المدينة"
              value={city}
              onChange={setCity}
              required
              placeholder="الرياض"
            />

            <InputField
              label="الحي"
              value={district}
              onChange={setDistrict}
            />

            <InputField
              label="الشارع"
              value={street}
              onChange={setStreet}
            />

            <InputField
              label="رقم المبنى"
              value={building}
              onChange={setBuilding}
            />

            <InputField
              label="الرمز البريدي"
              value={postalCode}
              onChange={setPostalCode}
            />

            <InputField
              label="خط العرض"
              value={latitude}
              onChange={setLatitude}
              dir="ltr"
            />

            <InputField
              label="خط الطول"
              value={longitude}
              onChange={setLongitude}
              dir="ltr"
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-xs font-extrabold text-[#0d2b4e]">
              ملاحظات
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={3}
              placeholder="أي تفاصيل تساعد على الوصول للمكان..."
              className="w-full resize-none rounded-[15px] border border-[#dce8ec] p-4 text-sm font-bold text-[#0d2b4e] outline-none focus:border-[#16a6c9]"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setIsDefault((value) => !value)
            }
            className="mt-4 flex w-full items-center gap-3 rounded-[17px] bg-[#f6fafb] p-4 text-right"
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                isDefault
                  ? "bg-[#16a6c9] text-white"
                  : "border border-[#cfdee3]"
              }`}
            >
              {isDefault ? (
                <Check className="h-3.5 w-3.5" />
              ) : null}
            </span>

            <span>
              <span className="block text-xs font-extrabold text-[#0d2b4e]">
                تعيين كعنوان افتراضي
              </span>

              <span className="mt-1 block text-[10px] font-bold text-[#8799a6]">
                سيتم استخدامه تلقائيًا في الخدمات الجديدة.
              </span>
            </span>
          </button>

          {error ? (
            <div className="mt-4 rounded-[14px] bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#0d2b4e] text-xs font-extrabold text-white disabled:opacity-60"
          >
            <Save className="h-4 w-4" />

            {saving
              ? "جاري الحفظ..."
              : address
                ? "حفظ التعديلات"
                : "إضافة العنوان"}
          </button>
        </form>
      </motion.div>
    </>
  );
}

function DeleteAddressModal({
  address,
  onClose,
  onDeleted,
}: {
  address: Address;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function removeAddress() {
    const token = getAuthToken();

    if (!token) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await apiRequest(
        `/addresses/${address.id}`,
        {
          method: "DELETE",
          token,
        }
      );

      onDeleted();
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      } else {
        setError("تعذر حذف العنوان");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-[#061a2f]/50 backdrop-blur-[4px]"
      />

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          scale: 0.96,
        }}
        className="fixed inset-x-4 top-1/2 z-[90] mx-auto max-w-[420px] -translate-y-1/2 rounded-[28px] bg-white p-6 text-center shadow-[0_35px_100px_rgba(5,24,44,.28)]"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <Trash2 className="h-7 w-7 text-red-500" />
        </div>

        <h2 className="mt-5 text-lg font-extrabold text-[#0d2b4e]">
          حذف العنوان؟
        </h2>

        <p className="mt-2 text-sm font-bold leading-6 text-[#7d909e]">
          سيتم حذف{" "}
          {address.label ||
            "هذا العنوان"}{" "}
          من حسابك.
        </p>

        {error ? (
          <div className="mt-4 rounded-[14px] bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-[48px] rounded-[14px] border border-[#dce8ec] text-xs font-extrabold text-[#718592]"
          >
            تراجع
          </button>

          <button
            type="button"
            onClick={removeAddress}
            disabled={deleting}
            className="h-[48px] rounded-[14px] bg-red-500 text-xs font-extrabold text-white disabled:opacity-60"
          >
            {deleting
              ? "جاري الحذف..."
              : "حذف العنوان"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

function InputField({
  label,
  value,
  onChange,
  required,
  placeholder,
  dir,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-extrabold text-[#0d2b4e]">
        {label}

        {required ? (
          <span className="mr-1 text-red-400">
            *
          </span>
        ) : null}
      </label>

      <input
        required={required}
        value={value}
        dir={dir}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-[52px] w-full rounded-[15px] border border-[#dce8ec] px-4 text-sm font-bold text-[#0d2b4e] outline-none placeholder:font-normal placeholder:text-[#a4b4be] focus:border-[#16a6c9]"
      />
    </div>
  );
}

function SparklesIcon() {
  return (
    <BellRing className="h-4 w-4" />
  );
}

function PackageIcon() {
  return (
    <CircleUserRound className="h-4 w-4" />
  );
}

async function refreshAddresses(
  setter: (addresses: Address[]) => void
) {
  const token = getAuthToken();

  if (!token) {
    return;
  }

  try {
    const response =
      await apiRequest<AddressesResponse>(
        "/addresses",
        {
          token,
        }
      );

    setter(response.data.addresses);
  } catch {
    //
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}