import { ArrowRight, CircleCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PricingFeature {
  text: string;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  betaPrice: string;
  features: PricingFeature[];
  button: {
    text: string;
    url: string;
  };
}

interface Pricing2Props {
  heading?: string;
  description?: string;
  plans?: PricingPlan[];
}

const Pricing2 = ({
  heading = "Choose Your Plan",
  description = "100% free for the first year — beta users get full access",
  plans = [
    {
      id: "standard",
      name: "Standard",
      description: "For coaches getting started",
      monthlyPrice: "Free",
      yearlyPrice: "Free",
      betaPrice: "Free",
      features: [
        { text: "Create your coach profile" },
        { text: "Up to 10 bookings/month" },
        { text: "Basic Bob AI insights" },
        { text: "Community access" },
      ],
      button: {
        text: "Get Started",
        url: "/signup",
      },
    },
    {
      id: "pro",
      name: "Pro",
      description: "For serious coaches",
      monthlyPrice: "₪99",
      yearlyPrice: "₪79",
      betaPrice: "Free",
      features: [
        { text: "Unlimited Bob AI" },
        { text: "Weekly performance reports" },
        { text: "Advanced analytics" },
        { text: "Discover boost & PRO badge" },
        { text: "Unlimited content uploads" },
      ],
      button: {
        text: "Activate Pro — Free",
        url: "/pro",
      },
    },
  ],
}: Pricing2Props) => {
  const navigate = useNavigate();

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Sparkles className="h-3 w-3" /> BETA — 100% OFF
              </span>
            </div>
            <h2 className="text-3xl font-heading font-black md:text-4xl text-foreground">
              {heading}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              {description}
            </p>
          </div>

          <div className="grid w-full gap-6 sm:grid-cols-2">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`flex flex-col justify-between text-left ${
                  plan.id === "pro"
                    ? "border-primary/40 shadow-lg shadow-primary/10"
                    : ""
                }`}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-primary">{plan.name}</p>
                    {plan.id === "pro" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">
                        FREE FOR 1 YEAR
                      </span>
                    )}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-heading font-black text-foreground">
                      {plan.betaPrice}
                    </span>
                    {plan.monthlyPrice !== "Free" && (
                      <span className="text-lg text-muted-foreground/50 line-through">
                        {plan.monthlyPrice}/mo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {plan.id === "pro"
                      ? "Free for 1 year during beta · No credit card"
                      : "Free forever during beta"}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <Separator />
                  {plan.id === "pro" && (
                    <p className="text-xs font-semibold text-muted-foreground">
                      Everything in Standard, and:
                    </p>
                  )}
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2.5">
                        <CircleCheck className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.id === "pro" ? "default" : "outline"}
                    onClick={() => navigate(plan.button.url)}
                  >
                    {plan.button.text}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export { Pricing2 };
