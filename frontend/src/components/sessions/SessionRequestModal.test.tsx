import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

const gqlMock = vi.fn();
vi.mock("@/lib/graphql", () => ({
  gql: (...args: unknown[]) => gqlMock(...args),
  GraphQLError: class extends Error {},
}));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { SessionRequestModal } from "./SessionRequestModal";
import { User } from "@/types";

const mentor: User = {
  id: "m1",
  firstName: "Mira",
  lastName: "Mentor",
  email: "mira@x.com",
  role: "MENTOR",
};

describe("SessionRequestModal", () => {
  beforeEach(() => gqlMock.mockReset());

  it("does not render when closed", () => {
    renderWithProviders(
      <SessionRequestModal
        open={false}
        onOpenChange={() => {}}
        mentor={mentor}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders mentor name when open", () => {
    renderWithProviders(
      <SessionRequestModal
        open={true}
        onOpenChange={() => {}}
        mentor={mentor}
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Mira/)).toBeInTheDocument();
  });

  it("submits a session request via gql", async () => {
    gqlMock.mockResolvedValue({
      createSession: {
        success: true,
        errors: null,
        session: { id: "s1" },
      },
    });
    renderWithProviders(
      <SessionRequestModal
        open={true}
        onOpenChange={vi.fn()}
        mentor={mentor}
      />,
    );
    const textbox = screen.getByRole("textbox");
    await userEvent.type(textbox, "Could you help me with system design?");
    await userEvent.click(
      screen.getByRole("button", { name: /send|request|submit/i }),
    );

    await waitFor(() => expect(gqlMock).toHaveBeenCalled());
  });
});
