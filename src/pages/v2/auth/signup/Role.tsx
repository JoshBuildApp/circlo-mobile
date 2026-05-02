import { useNavigate } from "react-router-dom";
import { GraduationCap, Smile } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { RoleCard } from "../components/RoleCard";
import { useSignup } from "../SignupContext";
import { useHaptics } from "@/native/useNative";
import "./role.css";

/**
 * Step 1/4 of signup: choose player vs coach.
 *
 * Visual reference: prototype/auth-flow.html → screenRole().
 * The CirloRing is rendered by AuthLayout at the role variant (64px top-
 * center); the .circlo-spacer-role below the header reserves vertical space
 * so the title doesn't collide with the ring.
 */
export default function Role() {
  const navigate = useNavigate();
  const { role, setRole } = useSignup();
  const { tap } = useHaptics();

  return (
    <div className="circlo-screen overflow-y-auto">
      <PageHeader step={1} onBack={() => navigate("/v2/auth/welcome")} />
      <div className="circlo-spacer-role" />

      <div className="circlo-screen-enter">
        <h1 className="circlo-screen-title" style={{ textAlign: "center" }}>
          Who are you on Circlo?
        </h1>
        <p className="circlo-screen-subtitle" style={{ textAlign: "center" }}>
          Pick one — you can switch later from your profile.
        </p>

        <div className="circlo-role-stack">
          <RoleCard
            icon={<Smile size={26} strokeWidth={2} />}
            title="I'm a player"
            description="Find coaches, book sessions, and join circles."
            selected={role === "player"}
            onSelect={() => {
              tap("light");
              setRole("player");
            }}
          />
          <RoleCard
            icon={<GraduationCap size={26} strokeWidth={2} />}
            title="I'm a coach"
            description="Build your circle, sell programs, grow your business."
            selected={role === "coach"}
            onSelect={() => {
              tap("light");
              setRole("coach");
            }}
          />
        </div>
      </div>

      <div className="circlo-bottom-cta">
        <button
          type="button"
          className="circlo-btn circlo-btn-primary"
          disabled={!role}
          onClick={() => {
            tap("light");
            navigate("/v2/auth/signup/sports");
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
