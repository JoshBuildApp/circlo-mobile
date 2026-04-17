/**
 * useFilePicker — unified file/image picker for web + native.
 *
 * On native, uses @capacitor/camera (prompts the user with
 * Camera / Photo Library). On web, falls back to a hidden
 * <input type="file"> element.
 *
 * Components should import this instead of wiring up file inputs
 * directly so both platforms work without extra conditionals.
 */
import { useCallback, useRef } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

export interface PickedFile {
  /** data URL suitable for <img src> or uploading */
  dataUrl: string;
  /** best-effort File object (web) or synthesized from data URL (native) */
  file: File;
  format: string; // "jpeg" | "png" | "webp" | ...
}

const dataUrlToFile = (dataUrl: string, fileName: string): File => {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:([^;]+);/.exec(meta)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], fileName, { type: mime });
};

export function useFilePicker() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pick = useCallback(
    async (opts: {
      source?: "camera" | "library" | "prompt";
      accept?: string; // web only, e.g. "image/*"
    } = {}): Promise<PickedFile | null> => {
      const { source = "prompt", accept = "image/*" } = opts;

      // Native — use Capacitor Camera
      if (Capacitor.isNativePlatform()) {
        try {
          const capSource =
            source === "camera"
              ? CameraSource.Camera
              : source === "library"
                ? CameraSource.Photos
                : CameraSource.Prompt;
          const photo = await Camera.getPhoto({
            source: capSource,
            resultType: CameraResultType.DataUrl,
            quality: 90,
            correctOrientation: true,
          });
          if (!photo.dataUrl) return null;
          const format = photo.format ?? "jpeg";
          const file = dataUrlToFile(photo.dataUrl, `upload.${format}`);
          return { dataUrl: photo.dataUrl, file, format };
        } catch (err) {
          // User cancelled or denied permission — treat as no pick
          console.debug("[circlo] camera picker cancelled", err);
          return null;
        }
      }

      // Web — hidden <input type="file">
      return new Promise<PickedFile | null>((resolve) => {
        let input = inputRef.current;
        if (!input) {
          input = document.createElement("input");
          input.type = "file";
          input.style.display = "none";
          document.body.appendChild(input);
          inputRef.current = input;
        }
        input.accept = accept;
        input.value = ""; // allow re-picking the same file
        const cleanup = () => {
          input!.onchange = null;
          input!.oncancel = null;
        };
        input.onchange = () => {
          const file = input!.files?.[0];
          cleanup();
          if (!file) return resolve(null);
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const format = file.type.split("/")[1] ?? "jpeg";
            resolve({ dataUrl, file, format });
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        };
        input.oncancel = () => {
          cleanup();
          resolve(null);
        };
        input.click();
      });
    },
    [],
  );

  return { pick };
}
