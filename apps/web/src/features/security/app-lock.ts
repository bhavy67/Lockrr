import { PrivacyScreen } from "@capacitor-community/privacy-screen";
import { BiometryType, NativeBiometric } from "@capgo/capacitor-native-biometric";
import { isNative, kvSet } from "@/lib/data/native";

/**
 * Optional fingerprint / screen-lock gate for the native app.
 *
 * A convenience lock, not encryption: it keeps a borrowed or unlocked phone
 * out of the vault. The files themselves rely on Android's app sandbox and
 * the phone's own storage encryption.
 */

const KEY = "lk.appLock";

export const lockEnabled = () => isNative && localStorage.getItem(KEY) === "1";

/** True when the phone has a fingerprint, face or at least a PIN/pattern set. */
export async function canUseLock(): Promise<boolean> {
  if (!isNative) return false;
  const { isAvailable } = await NativeBiometric.isAvailable({ useFallback: true });
  return isAvailable;
}

/** Shows the system prompt. Resolves true on success, false on cancel/failure. */
export async function verifyOwner(): Promise<boolean> {
  try {
    await NativeBiometric.verifyIdentity({
      title: "Unlock LockKaro",
      subtitle: "Confirm it's you to open your vault",
      useFallback: true,
      // Fingerprint/face, or the phone's PIN/pattern for phones without one.
      allowedBiometryTypes: [
        BiometryType.FINGERPRINT,
        BiometryType.FACE_AUTHENTICATION,
        BiometryType.IRIS_AUTHENTICATION,
        BiometryType.DEVICE_CREDENTIAL,
      ],
    });
    return true;
  } catch {
    return false;
  }
}

/** Turning the lock on asks first, so nobody locks themselves out. */
export async function setLockEnabled(on: boolean): Promise<boolean> {
  if (on && !(await verifyOwner())) return false;
  kvSet(KEY, on ? "1" : "0");
  // Hides the vault in the recent-apps switcher (and blocks screenshots).
  await (on ? PrivacyScreen.enable() : PrivacyScreen.disable());
  return true;
}

export { PrivacyScreen };
