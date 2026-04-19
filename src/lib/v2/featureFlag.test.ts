import { describe, expect, it, beforeEach } from "vitest";
import { isV2Enabled, V2_ENABLED_KEY } from "./featureFlag";

describe("featureFlag", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("is off by default", () => {
    expect(isV2Enabled()).toBe(false);
  });

  it("turns on when localStorage has the flag", () => {
    window.localStorage.setItem(V2_ENABLED_KEY, "true");
    expect(isV2Enabled()).toBe(true);
  });

  it("treats any non-true value as off", () => {
    window.localStorage.setItem(V2_ENABLED_KEY, "yes");
    expect(isV2Enabled()).toBe(false);
  });
});
