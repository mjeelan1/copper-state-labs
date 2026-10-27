// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient as createBrowser } from "@/lib/supabase/client";
import {
  createStatelessClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [] }),
}));

afterEach(() => vi.unstubAllEnvs());

describe("Supabase helpers", () => {
  it("return null instead of throwing when Supabase isn't set up", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(isSupabaseConfigured()).toBe(false);
    expect(createBrowser()).toBeNull();
    expect(createStatelessClient()).toBeNull();
  });

  it("create clients when both variables are set", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    expect(isSupabaseConfigured()).toBe(true);
    expect(createStatelessClient()).not.toBeNull();
  });
});
