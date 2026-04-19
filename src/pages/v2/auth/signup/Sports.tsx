import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { SportCard } from "../components/SportCard";
import { useSignup } from "../SignupContext";
import "./sports.css";

/**
 * Step 2/4 of signup: select one or more sports. Title + subtitle swap copy
 * based on the player/coach role chosen on Step 1.
 *
 * Visual reference: prototype/auth-flow.html → screenSports().
 */
export default function Sports() {
  const navigate = useNavigate();
  const { role, sports, toggleSport } = useSignup();
  const count = sports.size;

  const isCoach = role === "coach";
  const title = isCoach ? "What do you coach?" : "What sports are you into?";
  const subtitle = isCoach
    ? "Pick all that apply — this shapes your coach profile."
    : "Pick any that you play — we'll tailor your feed.";

  return (
    <div className="circlo-screen">
      <PageHeader step={2} onBack={() => navigate("/v2/auth/signup/role")} />

      <div className="circlo-screen-enter">
        <h1 className="circlo-screen-title">{title}</h1>
        <p className="circlo-screen-subtitle">{subtitle}</p>

        <div
          className={`circlo-sel-chip ${count === 0 ? "circlo-sel-chip--empty" : ""}`.trim()}
          aria-live="polite"
        >
          {count === 0
            ? "Tap squares to select"
            : `${count} selected · tap to add more`}
        </div>
      </div>

      <div className="circlo-sport-scroll">
        <div className="circlo-sport-grid">
          {SPORTS.map(([emoji, name]) => (
            <SportCard
              key={name}
              emoji={emoji}
              name={name}
              selected={sports.has(name)}
              onToggle={() => toggleSport(name)}
            />
          ))}
        </div>
      </div>

      <div className="circlo-bottom-cta">
        <button
          type="button"
          className="circlo-btn circlo-btn-primary"
          disabled={count === 0}
          onClick={() => navigate("/v2/auth/signup/credentials")}
        >
          {count === 0
            ? "Pick at least one"
            : `Continue · ${count} sport${count > 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}

/**
 * Canonical sport list for Circlo, 30 items in 3 columns of 10 rows.
 * Copied verbatim from prototype/auth-flow.html. Emoji first, name second
 * so the tuple maps 1:1 to SportCard props.
 */
const SPORTS: Array<[string, string]> = [
  ["🎾", "Padel"],
  ["🎾", "Tennis"],
  ["⚽", "Football"],
  ["🏀", "Basketball"],
  ["🏐", "Volleyball"],
  ["🏈", "Am. Football"],
  ["⚾", "Baseball"],
  ["🏓", "Ping Pong"],
  ["🏸", "Badminton"],
  ["🏋️", "Gym"],
  ["🤸", "CrossFit"],
  ["🧘", "Yoga"],
  ["🧘‍♀️", "Pilates"],
  ["🏃", "Running"],
  ["🚴", "Cycling"],
  ["🏊", "Swim"],
  ["🏄", "Surfing"],
  ["🤽", "Water Polo"],
  ["🥊", "Boxing"],
  ["🥋", "MMA / BJJ"],
  ["🤼", "Wrestling"],
  ["🥏", "Frisbee"],
  ["⛳", "Golf"],
  ["🏇", "Equestrian"],
  ["⛸️", "Skating"],
  ["🎿", "Skiing"],
  ["🏂", "Snowboard"],
  ["🧗", "Climbing"],
  ["🏹", "Archery"],
  ["🕺", "Dance"],
];
