import { useSearchParams } from "react-router-dom";
import { UserCampaigns } from "./UserCampaigns.jsx";
import { UserCompose } from "./UserCompose.jsx";

// Toggles between the campaigns list and the compose flow.
// `?compose=1` (set by the calendar's "Nueva campaña") opens compose directly.

export function CampaignsRoute() {
  const [params, setParams] = useSearchParams();
  const composing = params.get("compose") === "1";

  const openCompose = () => setParams({ compose: "1" });
  const backToList = () => setParams({});

  return composing ? <UserCompose onBack={backToList} /> : <UserCampaigns onCompose={openCompose} />;
}
