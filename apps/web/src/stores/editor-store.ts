import { create } from "zustand";

/**
 * Editor state. The single source of truth for what the user is currently
 * editing in the /editor route.
 *
 * Intentionally minimal at this stage — we add fields as features need them.
 */
interface EditorState {
  // The currently selected scene id (e.g. "studio/macbook-concrete-01")
  // null when no scene is loaded yet
  sceneId: string | null;

  // The user's uploaded screenshot, as a Blob URL the canvas can render
  // null when no screenshot has been dropped in
  screenshotUrl: string | null;

  // Transform applied to the screenshot inside the scene's screen quad
  // For now: simple position offset + scale. We'll add rotation later.
  transform: {
    offsetX: number;
    offsetY: number;
    scale: number;
  };

  // Actions
  setScene: (sceneId: string) => void;
  setScreenshot: (url: string | null) => void;
  setTransform: (transform: Partial<EditorState["transform"]>) => void;
  reset: () => void;
}

const initialTransform = { offsetX: 0, offsetY: 0, scale: 1 };

export const useEditorStore = create<EditorState>((set) => ({
  sceneId: null,
  screenshotUrl: null,
  transform: initialTransform,

  setScene: (sceneId) => set({ sceneId }),
  setScreenshot: (url) => set({ screenshotUrl: url }),
  setTransform: (transform) =>
    set((state) => ({
      transform: { ...state.transform, ...transform },
    })),
  reset: () =>
    set({
      sceneId: null,
      screenshotUrl: null,
      transform: initialTransform,
    }),
}));
