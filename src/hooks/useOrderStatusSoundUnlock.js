import { useEffect } from "react";
import {
  bindOrderUpdateSoundUnlock,
  primeOrderNotificationSound,
} from "../utils/orderNotificationSound";

/** Keeps trying to unlock Web Audio after redirects until the user taps the page. */
export const useOrderStatusSoundUnlock = () => {
  useEffect(() => {
    primeOrderNotificationSound();
    return bindOrderUpdateSoundUnlock();
  }, []);
};
