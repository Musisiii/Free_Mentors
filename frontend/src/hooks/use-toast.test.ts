import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useToast, toast, reducer } from "./use-toast";

describe("useToast", () => {
  beforeEach(() => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.dismiss();
    });
  });

  it("starts with no toasts", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it("adds a toast when toast() is called", () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      toast({ title: "Hi", description: "There" });
    });
    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].title).toBe("Hi");
  });

  it("dismisses a toast by id", () => {
    const { result } = renderHook(() => useToast());
    let id = "";
    act(() => {
      const r = toast({ title: "Bye" });
      id = r.id;
    });
    act(() => {
      result.current.dismiss(id);
    });
    expect(result.current.toasts[0].open).toBe(false);
  });

  it("update mutates the toast in place", () => {
    const { result } = renderHook(() => useToast());
    let api: ReturnType<typeof toast>;
    act(() => {
      api = toast({ title: "Original" });
    });
    act(() => {
      api!.update({ id: api!.id, title: "Updated" });
    });
    expect(result.current.toasts[0].title).toBe("Updated");
  });
});

describe("toast reducer", () => {
  it("ADD_TOAST prepends the toast", () => {
    const next = reducer(
      { toasts: [] },
      { type: "ADD_TOAST", toast: { id: "1", open: true } },
    );
    expect(next.toasts.length).toBe(1);
    expect(next.toasts[0].id).toBe("1");
  });

  it("UPDATE_TOAST patches matching toast", () => {
    const next = reducer(
      { toasts: [{ id: "1", title: "A", open: true }] },
      { type: "UPDATE_TOAST", toast: { id: "1", title: "B" } },
    );
    expect((next.toasts[0] as any).title).toBe("B");
  });

  it("DISMISS_TOAST closes a single toast", () => {
    const next = reducer(
      { toasts: [{ id: "1", open: true }] },
      { type: "DISMISS_TOAST", toastId: "1" },
    );
    expect(next.toasts[0].open).toBe(false);
  });

  it("REMOVE_TOAST without id clears all", () => {
    const next = reducer(
      { toasts: [{ id: "1", open: true }] },
      { type: "REMOVE_TOAST" },
    );
    expect(next.toasts).toEqual([]);
  });
});
