import { useEffect, useState } from "react";

export const AuthScreen = () => {
  const [authUrl, setAuthUrl] = useState("");

  useEffect(function buildAuthUrl() {
    webflow.getSiteInfo().then(({ siteId, shortName }) => {
      const base64 = btoa(
        JSON.stringify({
          siteId,
          returnUrl: `https://webflow.com/design/${shortName}`,
        })
      );
      setAuthUrl(
        `${import.meta.env.VITE_DATA_CLIENT_URL}/webflow/install?state=${base64}`
      );
    });
  }, []);

  const handleAuthenticate = () => {
    if (!authUrl) return;
    window.open(authUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={"w-full bg-background text-foreground"}>
      <div className="m-auto flex h-screen w-1/2 flex-col items-start justify-center gap-3">
        <p className="text-center text-[0.85rem] font-medium">
          Looks like you are trying to use the app in a new site. You need to re-grant the permissions to continue.
        </p>
        {authUrl && (
          <button
            type="button"
            onClick={handleAuthenticate}
            className="boxShadows-action-colored mx-auto mb-15 cursor-pointer rounded-lg border border-border bg-[#0073E6] px-3 py-1 text-center text-[0.71rem] text-white hover:bg-[#005bb5] transition-colors"
          >
            Authenticate
          </button>
        )}
      </div>
    </div>
  );
};