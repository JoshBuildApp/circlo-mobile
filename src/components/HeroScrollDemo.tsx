import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export function HeroScrollDemo() {
  return (
    <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl font-semibold text-foreground">
              Train with the best coaches <br />
              <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none bg-gradient-to-r from-teal to-emerald-400 bg-clip-text text-transparent">
                Near You
              </span>
            </h1>
          </>
        }
      >
        <img
          src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1400&q=80"
          alt="Coach training athlete in a gym session"
          width={1400}
          height={720}
          className="mx-auto rounded-2xl object-cover h-full object-left-top"
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
}
