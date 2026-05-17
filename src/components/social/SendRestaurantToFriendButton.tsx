"use client";

import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import type { Friendship, Profile } from "@/lib/types";

type FriendBundle = {
  friendship: Friendship;
  profile: Profile | null;
};

type SendRestaurantToFriendButtonProps = {
  restaurantId: string;
  restaurantName: string;
};

export function SendRestaurantToFriendButton({
  restaurantId,
  restaurantName,
}: SendRestaurantToFriendButtonProps) {
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<FriendBundle[]>([]);
  const [recipientId, setRecipientId] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    async function loadFriends() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/friends");
        const payload = (await response.json()) as {
          friends?: FriendBundle[];
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error);
        const accepted = payload.friends ?? [];
        setFriends(accepted);
        setRecipientId((current) => current || accepted[0]?.profile?.id || "");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not load friends.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadFriends();
  }, [open]);

  async function sendCard() {
    if (!recipientId) return;
    setIsSending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/friend-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_id: recipientId,
          restaurant_id: restaurantId,
          note,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error);
      setNote("");
      setMessage("Card sent.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send card.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-800 transition hover:border-stone-300 hover:bg-stone-50"
      >
        <Send aria-hidden="true" className="size-4" />
        Send to friend
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/30 px-4">
          <div className="grid w-full max-w-md gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-xl">
            <div>
              <p className="text-sm font-semibold uppercase text-emerald-700">
                Trusted card
              </p>
              <h2 className="text-2xl font-bold text-stone-950">
                Send {restaurantName}
              </h2>
            </div>

            {isLoading ? (
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600">
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                Loading friends
              </p>
            ) : friends.length ? (
              <>
                <label className="grid gap-1 text-sm font-semibold text-stone-700">
                  Friend
                  <select
                    value={recipientId}
                    onChange={(event) => setRecipientId(event.target.value)}
                    className="h-11 rounded-lg border border-stone-200 px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                  >
                    {friends.map((friend) => (
                      <option key={friend.friendship.id} value={friend.profile?.id ?? ""}>
                        {friend.profile?.display_name ?? friend.profile?.handle ?? "Friend"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-700">
                  Message
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    className="resize-none rounded-lg border border-stone-200 px-3 py-2 font-normal leading-6 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                    placeholder="Bro this one is actually worth it."
                  />
                </label>
              </>
            ) : (
              <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4 text-sm leading-6 text-stone-600">
                Add and accept a friend first. Then you can send restaurant
                cards straight into their TasteMap inbox.
              </p>
            )}

            {message ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                {message}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setMessage(null);
                  setError(null);
                }}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:border-stone-300"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isSending || !recipientId}
                onClick={() => void sendCard()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-60"
              >
                {isSending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Send aria-hidden="true" className="size-4" />
                )}
                Send
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
