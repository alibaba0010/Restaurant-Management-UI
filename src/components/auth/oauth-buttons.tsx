import { Button } from "../ui/button";
import { Chrome } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { AppleLogo } from "../icons/apple-logo";
import { FacebookLogo } from "../icons/facebook-logo";

export default function OauthButtons() {
  const handleOAuth = async (provider: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/${provider}/login`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        console.error("Failed to initiate OAuth", res.statusText);
      }
    } catch (error) {
      console.error("Error initiating OAuth", error);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <Button variant="outline" onClick={() => handleOAuth("google")}>
        <Chrome className="mr-2 h-4 w-4" />
        Google
      </Button>
      <Button variant="outline" onClick={() => handleOAuth("apple")}>
        <AppleLogo className="mr-2 h-4 w-4" />
        Apple
      </Button>
      <Button variant="outline" onClick={() => handleOAuth("facebook")}>
        <FacebookLogo className="mr-2 h-4 w-4" />
        Facebook
      </Button>
    </div>
  );
}
