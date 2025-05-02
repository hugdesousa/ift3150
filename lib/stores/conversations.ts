// lib/stores/conversations.ts
import { create } from "zustand";

type Preview = {
    id: string;
    last_message: { content: string; created_at: Date };
    unread_count: number;
    participant: { full_name: string; profile_image_url: string | null };
};

type State = { previews: Record<string, Preview> };
type Actions = {
    addOrUpdatePreview: (p: Preview) => void;
    markRead: (convId: string) => void;
};

export const useConvStore = create<State & Actions>((set) => ({
    previews: {},
    addOrUpdatePreview: (p) =>
        set((s) => ({
            previews: {
                ...s.previews,
                [p.id]: {
                    ...p,
                    unread_count: (s.previews[p.id]?.unread_count ?? 0) + 1,
                },
            },
        })),
    markRead: (id) =>
        set((s) => ({
            previews: {
                ...s.previews,
                [id]: { ...s.previews[id], unread_count: 0 },
            },
        })),
}));
