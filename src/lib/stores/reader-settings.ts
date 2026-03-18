import { writable } from "svelte/store";

export interface ReaderSettings {
  fontSize: number;
  backgroundColor: string;
  textColor: string;
  brightness: number;
  readingMode: "vertical" | "horizontal";
  showPageNumber: boolean;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 16,
  backgroundColor: "#000000",
  textColor: "#ffffff",
  brightness: 100,
  readingMode: "vertical",
  showPageNumber: true,
};

function createReaderSettingsStore() {
  const stored =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("reader_settings")
      : null;

  const initial = stored ? JSON.parse(stored) : DEFAULT_SETTINGS;

  const { subscribe, set, update } = writable<ReaderSettings>(initial);

  return {
    subscribe,
    set: (value: ReaderSettings) => {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("reader_settings", JSON.stringify(value));
      }
      set(value);
    },
    update: (fn: (settings: ReaderSettings) => ReaderSettings) => {
      update((settings) => {
        const newSettings = fn(settings);
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("reader_settings", JSON.stringify(newSettings));
        }
        return newSettings;
      });
    },
    reset: () => {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(
          "reader_settings",
          JSON.stringify(DEFAULT_SETTINGS),
        );
      }
      set(DEFAULT_SETTINGS);
    },
  };
}

export const readerSettings = createReaderSettingsStore();
