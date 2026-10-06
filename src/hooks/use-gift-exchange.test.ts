// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import useGiftExchange from "./use-gift-exchange";

const STORAGE_KEY = "gift-exchange-storage";

describe("useGiftExchange store", () => {
  beforeEach(() => {
    useGiftExchange.setState({ result: undefined });
    sessionStorage.clear();
  });

  it("starts without a result", () => {
    expect(useGiftExchange.getState().result).toBeUndefined();
  });

  it("stores the draw via setResult", () => {
    useGiftExchange.getState().setResult({ 1: 2, 2: 1 });
    expect(useGiftExchange.getState().result).toEqual({ 1: 2, 2: 1 });
  });

  it("replaces (not merges) a previous draw", () => {
    useGiftExchange.getState().setResult({ 1: 2, 2: 1 });
    useGiftExchange.getState().setResult({ 3: 4, 4: 3 });
    expect(useGiftExchange.getState().result).toEqual({ 3: 4, 4: 3 });
  });

  it("persists the draw to sessionStorage", () => {
    useGiftExchange.getState().setResult({ 1: 2, 2: 1 });
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    expect(stored.state.result).toEqual({ 1: 2, 2: 1 });
  });

  it("rehydrates the draw from sessionStorage", async () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { result: { 5: 6, 6: 5 } }, version: 0 })
    );
    await useGiftExchange.persist.rehydrate();
    expect(useGiftExchange.getState().result).toEqual({ 5: 6, 6: 5 });
  });
});
