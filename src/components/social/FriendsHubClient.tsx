"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Check,
  Inbox,
  ListPlus,
  Loader2,
  Send,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type {
  FriendCardSendWithProfiles,
  Friendship,
  Profile,
  TasteListItem,
  TasteListVisibility,
  TasteListWithRelations,
} from "@/lib/types";

type FriendBundle = {
  friendship: Friendship;
  profile: Profile | null;
};

type TasteListForClient = TasteListWithRelations & {
  is_owner?: boolean;
  taste_list_items?: TasteListItem[];
};

type FriendsHubClientProps = {
  configured: boolean;
  currentUserId: string | null;
  currentHandle: string | null;
};

type FriendsPayload = {
  friends?: FriendBundle[];
  incoming?: FriendBundle[];
  outgoing?: FriendBundle[];
  error?: string;
};

type ListsPayload = {
  lists?: TasteListForClient[];
  error?: string;
};

type CardsPayload = {
  incoming?: FriendCardSendWithProfiles[];
  sent?: FriendCardSendWithProfiles[];
  error?: string;
};

const visibilityOptions: Array<{
  value: TasteListVisibility;
  label: string;
  description: string;
}> = [
  {
    value: "friends",
    label: "Friends",
    description: "Accepted friends can see it.",
  },
  {
    value: "private",
    label: "Private",
    description: "Only you can see it.",
  },
  {
    value: "public",
    label: "Public",
    description: "Visible to signed-in TasteMap users.",
  },
];

export function FriendsHubClient({
  configured,
  currentUserId,
  currentHandle,
}: FriendsHubClientProps) {
  const [friends, setFriends] = useState<FriendBundle[]>([]);
  const [incoming, setIncoming] = useState<FriendBundle[]>([]);
  const [outgoing, setOutgoing] = useState<FriendBundle[]>([]);
  const [lists, setLists] = useState<TasteListForClient[]>([]);
  const [cards, setCards] = useState<FriendCardSendWithProfiles[]>([]);
  const [sentCards, setSentCards] = useState<FriendCardSendWithProfiles[]>([]);
  const [handle, setHandle] = useState("");
  const [listTitle, setListTitle] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [visibility, setVisibility] = useState<TasteListVisibility>("friends");
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ownLists = useMemo(
    () => lists.filter((list) => list.is_owner || list.user_id === currentUserId),
    [currentUserId, lists],
  );
  const friendLists = useMemo(
    () => lists.filter((list) => !(list.is_owner || list.user_id === currentUserId)),
    [currentUserId, lists],
  );

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    setIsLoading(true);
    setError(null);

    try {
      const [friendsResponse, listsResponse, cardsResponse] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/taste-lists"),
        fetch("/api/friend-cards"),
      ]);
      const [friendsPayload, listsPayload, cardsPayload] = (await Promise.all([
        friendsResponse.json(),
        listsResponse.json(),
        cardsResponse.json(),
      ])) as [FriendsPayload, ListsPayload, CardsPayload];

      if (!friendsResponse.ok) throw new Error(friendsPayload.error);
      if (!listsResponse.ok) throw new Error(listsPayload.error);
      if (!cardsResponse.ok) throw new Error(cardsPayload.error);

      setFriends(friendsPayload.friends ?? []);
      setIncoming(friendsPayload.incoming ?? []);
      setOutgoing(friendsPayload.outgoing ?? []);
      setLists(listsPayload.lists ?? []);
      setCards(cardsPayload.incoming ?? []);
      setSentCards(cardsPayload.sent ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load friends.");
    } finally {
      setIsLoading(false);
    }
  }

  async function sendFriendRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!handle.trim()) return;
    setIsWorking(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const payload = (await response.json()) as { error?: string; already_exists?: boolean };
      if (!response.ok) throw new Error(payload.error);
      setHandle("");
      setMessage(payload.already_exists ? "That connection already exists." : "Friend request sent.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send request.");
    } finally {
      setIsWorking(false);
    }
  }

  async function actOnFriendship(id: string, action: "accept" | "remove") {
    setIsWorking(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error);
      setMessage(action === "accept" ? "Friend added." : "Connection removed.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update friendship.");
    } finally {
      setIsWorking(false);
    }
  }

  async function createList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!listTitle.trim()) return;
    setIsWorking(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/taste-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: listTitle,
          description: listDescription,
          visibility,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error);
      setListTitle("");
      setListDescription("");
      setVisibility("friends");
      setMessage("List created.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create list.");
    } finally {
      setIsWorking(false);
    }
  }

  if (!configured) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        Friends and shared lists need Supabase auth. Local archive mode can still
        save your own logs, but the trust network starts after cloud login is set up.
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:gap-6">
      <section className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-stone-950">Friend bar</h2>
            <p className="text-sm text-stone-500">
              Your TasteMap ID:{" "}
              <span className="font-semibold text-stone-800">
                @{currentHandle ?? "set one in profile"}
              </span>
            </p>
          </div>
          {isLoading ? (
            <span className="inline-flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-700">
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              Loading
            </span>
          ) : null}
        </div>

        <form onSubmit={sendFriendRequest} className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <label className="grid gap-1 text-sm font-semibold text-stone-700">
            Add by TasteMap ID
            <input
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              className="h-11 rounded-lg border border-stone-200 px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              placeholder="alex.food"
            />
          </label>
          <button
            type="submit"
            disabled={isWorking || !handle.trim()}
            className="inline-flex h-11 w-full items-center justify-center gap-2 self-end rounded-lg bg-stone-950 px-4 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-60 sm:w-auto"
          >
            {isWorking ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <UserPlus aria-hidden="true" className="size-4" />
            )}
            Add friend
          </button>
        </form>

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
      </section>

      <section className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <Panel title="Friends" icon={<Users aria-hidden="true" className="size-5" />}>
          {friends.length ? (
            friends.map((item) => (
              <FriendRow
                key={item.friendship.id}
                item={item}
                actionLabel="Remove"
                onAction={() => void actOnFriendship(item.friendship.id, "remove")}
              />
            ))
          ) : (
            <EmptyLine text="No accepted friends yet." />
          )}
        </Panel>

        <Panel title="Incoming" icon={<Inbox aria-hidden="true" className="size-5" />}>
          {incoming.length ? (
            incoming.map((item) => (
              <FriendRow
                key={item.friendship.id}
                item={item}
                actionLabel="Accept"
                actionIcon={<Check aria-hidden="true" className="size-4" />}
                onAction={() => void actOnFriendship(item.friendship.id, "accept")}
                secondaryActionLabel="Reject"
                secondaryActionIcon={<X aria-hidden="true" className="size-4" />}
                onSecondaryAction={() =>
                  void actOnFriendship(item.friendship.id, "remove")
                }
              />
            ))
          ) : (
            <EmptyLine text="No pending requests." />
          )}
        </Panel>

        <Panel title="Sent" icon={<Send aria-hidden="true" className="size-5" />}>
          {outgoing.length ? (
            outgoing.map((item) => (
              <FriendRow
                key={item.friendship.id}
                item={item}
                actionLabel="Cancel"
                onAction={() => void actOnFriendship(item.friendship.id, "remove")}
              />
            ))
          ) : (
            <EmptyLine text="No outgoing requests." />
          )}
        </Panel>
      </section>

      <section className="grid gap-3 sm:gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <form
          onSubmit={createList}
          className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">
              Shared wishlist
            </p>
            <h2 className="text-xl font-bold text-stone-950">Create a list</h2>
          </div>
          <label className="grid gap-1 text-sm font-semibold text-stone-700">
            Title
            <input
              value={listTitle}
              onChange={(event) => setListTitle(event.target.value)}
              className="h-11 rounded-lg border border-stone-200 px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              placeholder="Tokyo list"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-stone-700">
            Note
            <textarea
              value={listDescription}
              onChange={(event) => setListDescription(event.target.value)}
              rows={3}
              className="resize-none rounded-lg border border-stone-200 px-3 py-2 font-normal leading-6 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              placeholder="Hidden gems for the next trip."
            />
          </label>
          <div className="grid gap-2">
            {visibilityOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 p-3 text-sm"
              >
                <input
                  type="radio"
                  name="visibility"
                  value={option.value}
                  checked={visibility === option.value}
                  onChange={() => setVisibility(option.value)}
                  className="mt-1 accent-emerald-700"
                />
                <span>
                  <span className="block font-bold text-stone-900">{option.label}</span>
                  <span className="text-stone-500">{option.description}</span>
                </span>
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={isWorking || !listTitle.trim()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
          >
            <ListPlus aria-hidden="true" className="size-4" />
            Create list
          </button>
        </form>

        <div className="grid gap-4">
          <ListSection title="Your lists" lists={ownLists} empty="No lists yet." />
          <ListSection
            title="Friends' public lists"
            lists={friendLists}
            empty="Accepted friends' visible lists will appear here."
          />
        </div>
      </section>

      <section className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <CardInbox title="Cards from friends" cards={cards} empty="No cards sent to you yet." />
        <CardInbox title="Cards you sent" cards={sentCards} empty="No sent cards yet." />
      </section>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid content-start gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold text-stone-950">
        {icon}
        {title}
      </h2>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

function FriendRow({
  item,
  actionLabel,
  actionIcon,
  onAction,
  secondaryActionLabel,
  secondaryActionIcon,
  onSecondaryAction,
}: {
  item: FriendBundle;
  actionLabel: string;
  actionIcon?: ReactNode;
  onAction: () => void;
  secondaryActionLabel?: string;
  secondaryActionIcon?: ReactNode;
  onSecondaryAction?: () => void;
}) {
  const profile = item.profile;
  return (
    <div className="grid gap-3 rounded-lg border border-stone-200 p-3">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-full bg-stone-950 text-sm font-bold text-white">
          {(profile?.display_name ?? profile?.handle ?? "?").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-stone-950">
            {profile?.display_name ?? "TasteMap user"}
          </p>
          <p className="truncate text-xs font-medium text-stone-500">
            @{profile?.handle ?? "unknown"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button
          type="button"
          onClick={onAction}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-800 transition hover:border-stone-300"
        >
          {actionIcon}
          {actionLabel}
        </button>
        {secondaryActionLabel && onSecondaryAction ? (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
          >
            {secondaryActionIcon}
            {secondaryActionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ListSection({
  title,
  lists,
  empty,
}: {
  title: string;
  lists: TasteListForClient[];
  empty: string;
}) {
  return (
    <section className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-bold text-stone-950">{title}</h2>
      {lists.length ? (
        <div className="grid gap-3">
          {lists.map((list) => (
            <article key={list.id} className="grid gap-3 rounded-lg border border-stone-200 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-stone-950">{list.title}</h3>
                  <p className="text-xs font-medium text-stone-500">
                    @{list.profiles?.handle ?? "you"} · {list.visibility}
                  </p>
                </div>
                <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-bold uppercase text-stone-600">
                  {list.taste_list_items?.length ?? 0} places
                </span>
              </div>
              {list.description ? (
                <p className="text-sm leading-6 text-stone-600">{list.description}</p>
              ) : null}
              {list.taste_list_items?.length ? (
                <div className="grid gap-2">
                  {list.taste_list_items.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700"
                    >
                      <span className="font-semibold">{item.item_title}</span>
                      {item.item_city || item.item_address ? (
                        <span className="text-stone-500">
                          {" "}
                          · {item.item_city ?? item.item_address}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyLine text={empty} />
      )}
    </section>
  );
}

function CardInbox({
  title,
  cards,
  empty,
}: {
  title: string;
  cards: FriendCardSendWithProfiles[];
  empty: string;
}) {
  return (
    <section className="grid content-start gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-bold text-stone-950">{title}</h2>
      {cards.length ? (
        <div className="grid gap-3">
          {cards.map((card) => (
            <article key={card.id} className="grid gap-2 rounded-lg border border-stone-200 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-stone-950">{card.card_title}</h3>
                  {card.card_subtitle ? (
                    <p className="text-sm text-stone-500">{card.card_subtitle}</p>
                  ) : null}
                </div>
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                  @{card.sender?.handle ?? card.recipient?.handle ?? "friend"}
                </span>
              </div>
              {card.note ? (
                <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm leading-6 text-stone-700">
                  {card.note}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyLine text={empty} />
      )}
    </section>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">
      {text}
    </p>
  );
}
