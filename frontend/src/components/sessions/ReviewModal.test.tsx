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

import { ReviewModal } from "./ReviewModal";
import { User } from "@/types";

const mentor: User = {
  id: "m1",
  firstName: "Mira",
  lastName: "Mentor",
  email: "mira@x.com",
  role: "MENTOR",
};

describe("ReviewModal", () => {
  beforeEach(() => gqlMock.mockReset());

  it("does not render when closed", () => {
    renderWithProviders(
      <ReviewModal open={false} onOpenChange={() => {}} mentor={mentor} />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders mentor name and a submit button when open", () => {
    renderWithProviders(
      <ReviewModal open={true} onOpenChange={() => {}} mentor={mentor} />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Mira/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /submit/i }),
    ).toBeInTheDocument();
  });

  it("submits a review via gql when the user fills it out", async () => {
    gqlMock.mockResolvedValue({
      createReview: { success: true, errors: null, review: { id: "r1" } },
    });
    const onOpenChange = vi.fn();
    renderWithProviders(
      <ReviewModal
        open={true}
        onOpenChange={onOpenChange}
        mentor={mentor}
      />,
    );
    const textbox = screen.getByRole("textbox");
    await userEvent.type(textbox, "Excellent guidance, very patient.");
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(gqlMock).toHaveBeenCalled());
  });
});
