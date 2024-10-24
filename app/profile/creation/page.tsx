"use client";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/supabase/utils";
import ProfileCreation from "@/components/profile/ProfileCreation";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ErrorCard from "@/components/ui/error-card";

export default function ProfileCreationPage() {
  const { user, ready, getAccessToken } = usePrivy();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [jwt, setJwt] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      if (!ready) return;

      if (!user || !user.wallet?.address) {
        router.push("/");
        return;
      }

      const token = await getAccessToken();
      setJwt(token);

      const { success, data, error } = await getUser(user.wallet.address, token);

      if (!success && error) {
        setError(true);
      } else if (data) {
        router.push("/matching");
      }

      setIsLoading(false);
    };

    checkUser();
  }, [user, ready, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorCard />;
  }

  if (!user || !user.wallet?.address) {
    return null; // This will be handled by the router.push("/") in the useEffect
  }

  return <ProfileCreation jwt={jwt} address={user.wallet.address} />;
}
