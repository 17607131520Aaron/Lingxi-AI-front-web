"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { subscribeNavigate } from "@/utils/navigationBus";

export default function NavigationSubscriber() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = subscribeNavigate(({ to, replace }) => {
      if (replace) {
        router.replace(to);
        return;
      }
      router.push(to);
    });
    return unsubscribe;
  }, [router]);

  return null;
}
