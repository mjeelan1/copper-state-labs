import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SetupRequired } from "@/components/setup-required";

describe("SetupRequired", () => {
  it("names the service and the variables to set", () => {
    render(<SetupRequired service="supabase" />);
    expect(
      screen.getByText("Set up Supabase to use this page"),
    ).toBeInTheDocument();
    expect(screen.getByText("NEXT_PUBLIC_SUPABASE_URL")).toBeInTheDocument();
  });

  it("covers the AI gateway key", () => {
    render(<SetupRequired service="ai" />);
    expect(
      screen.getByText("Set up the AI gateway to use this page"),
    ).toBeInTheDocument();
    expect(screen.getByText("AI_GATEWAY_API_KEY")).toBeInTheDocument();
  });
});
