import { useNavigate, useParams, useLocation } from "react-router-dom";
import { PhoneFrame, StatusBar, TabBar } from "@/components/v2/shared";
import { CoachProfileHero } from "@/components/v2/coach/CoachProfileHero";
import { AboutTab } from "@/components/v2/coach/AboutTab";
import { CommunityTab } from "@/components/v2/coach/CommunityTab";
import { ShopTab } from "@/components/v2/coach/ShopTab";
import { BookingBar } from "@/components/v2/coach/BookingBar";
import { useCoach, useCirclePosts, useShopItems } from "@/hooks/v2/useMocks";
import { isShopEnabled } from "@/lib/v2/featureFlag";

type TabKey = "about" | "community" | "content" | "shop";

function tabFromPath(pathname: string): TabKey {
  if (pathname.endsWith("/community")) return "community";
  if (pathname.endsWith("/content")) return "content";
  if (pathname.endsWith("/shop") && isShopEnabled()) return "shop";
  return "about";
}

export default function CoachProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const tab = tabFromPath(location.pathname);

  const { data: coach, isLoading } = useCoach(id);
  const { data: posts = [] } = useCirclePosts(id);
  const { data: items = [] } = useShopItems(id);

  const setTab = (next: TabKey) => {
    if (next === "content") {
      navigate(`/v2/coach/${id}/content`);
      return;
    }
    if (next === "about") navigate(`/v2/coach/${id}`);
    else navigate(`/v2/coach/${id}/${next}`);
  };

  if (isLoading) {
    return (
      <PhoneFrame className="min-h-[100dvh]">
        <StatusBar />
        <div className="px-5 pt-12 animate-pulse">
          <div className="h-24 bg-navy-card rounded-2xl mb-4" />
          <div className="h-6 bg-navy-card rounded mb-2" />
          <div className="h-4 bg-navy-card rounded w-1/2" />
        </div>
      </PhoneFrame>
    );
  }

  if (!coach) {
    return (
      <PhoneFrame className="min-h-[100dvh]">
        <StatusBar />
        <div className="flex-1 flex items-center justify-center px-8 text-center">
          <div>
            <h2 className="text-[18px] font-bold mb-2">Coach not found</h2>
            <p className="text-[13px] text-v2-muted mb-4">This coach is unavailable or moved.</p>
            <button
              onClick={() => navigate("/v2/discover")}
              className="px-4 py-2.5 rounded-[12px] bg-teal text-navy-deep font-bold text-[13px]"
            >
              Discover coaches
            </button>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame className="min-h-[100dvh] pb-32">
      <StatusBar />
      <CoachProfileHero coach={coach} activeTab={tab} onTab={setTab} onBack={() => navigate(-1)} />
      {tab === "about" && (
        <AboutTab
          coach={coach}
          onFollow={() => navigate(`/v2/coach/${coach.id}/join`)}
          onMessage={() => navigate(`/v2/messages/th-${coach.id}`)}
        />
      )}
      {tab === "community" && (
        <CommunityTab coach={coach} posts={posts} onJoin={() => navigate(`/v2/coach/${coach.id}/join`)} />
      )}
      {tab === "shop" && <ShopTab items={items} />}
      <BookingBar nextLabel="Today · 18:00" onBook={() => navigate(`/v2/book/${coach.id}`)} />
      <TabBar mode="player" active="discover" />
    </PhoneFrame>
  );
}
