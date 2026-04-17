import {
  CardTransformed,
  CardsContainer,
  ContainerScroll,
  ReviewStars,
} from "@/components/ui/animated-cards-stack";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SectionHeader from "./SectionHeader";

const TESTIMONIALS = [
  {
    id: "t1",
    name: "Noa R.",
    profession: "Padel Player",
    rating: 5,
    description:
      "Found my coach on Circlo in minutes. The booking was instant — no WhatsApp back-and-forth. Already leveled up my game after 4 sessions!",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=60",
  },
  {
    id: "t2",
    name: "Amit S.",
    profession: "Fitness Coach",
    rating: 5,
    description:
      "Since going Pro, my bookings increased by 40%. The AI recommendations helped me optimize my schedule and the Discover boost brought in new clients every week.",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=60",
  },
  {
    id: "t3",
    name: "Maya L.",
    profession: "Tennis Enthusiast",
    rating: 4.5,
    description:
      "The community features are amazing. I connected with other players at my level and we book group sessions together now. Total game changer!",
    avatarUrl:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=60",
  },
  {
    id: "t4",
    name: "Dan K.",
    profession: "Boxing Coach",
    rating: 5,
    description:
      "Circlo gave me a professional online presence without building a website. My profile, schedule, and payments — all in one place. Couldn't be easier.",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60",
  },
];

const Testimonials = () => {
  return (
    <div className="px-4">
      <SectionHeader title="What They Say" />

      <ContainerScroll className="h-[180vh]">
        <div className="sticky top-32">
          <CardsContainer className="h-[420px] w-full max-w-md mx-auto">
            {TESTIMONIALS.map((testimonial, index) => (
              <CardTransformed
                key={testimonial.id}
                index={index}
                arrayLength={TESTIMONIALS.length}
                variant="light"
                incrementY={12}
                incrementZ={8}
              >
                {/* Stars + quote */}
                <div className="flex flex-col items-center text-center gap-3">
                  <ReviewStars
                    rating={testimonial.rating}
                    className="text-primary"
                  />
                  <p className="text-sm text-foreground/80 leading-relaxed italic">
                    "{testimonial.description}"
                  </p>
                </div>

                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <Avatar className="!h-10 !w-10 border border-border">
                    <AvatarImage
                      src={testimonial.avatarUrl}
                      alt={testimonial.name}
                    />
                    <AvatarFallback>
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.profession}
                    </p>
                  </div>
                </div>
              </CardTransformed>
            ))}
          </CardsContainer>
        </div>
      </ContainerScroll>
    </div>
  );
};

export default Testimonials;
