import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockGetVideos = vi.fn();

vi.mock("@/services/api", () => ({
  productService: { getVideos: (...args: any[]) => mockGetVideos(...args) },
  API_BASE_URL: "",
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey, queryFn }: any) => {
    const result = queryFn();
    if (result instanceof Promise) {
      throw new Error("useQuery mock does not support async queryFn directly");
    }
    return { data: result, isLoading: false };
  },
}));

vi.mock("swiper/react", () => ({
  Swiper: ({ children }: any) => <div data-testid="swiper">{children}</div>,
  SwiperSlide: ({ children }: any) => <div data-testid="swiper-slide">{children}</div>,
}));

vi.mock("swiper/modules", () => ({
  Autoplay: {},
  Pagination: {},
}));

import VideoSwiper from "./VideoSwiper";

const mockVideo = {
  id: "1",
  name: "Test Video",
  type: "youtube",
  url: "https://youtu.be/d9RY0tx6ERs",
  isActive: true,
  product: { id: "p1", name: "Test Product", slug: "test-product", image: null },
};

describe("VideoSwiper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when no videos", () => {
    mockGetVideos.mockReturnValue([]);
    const { container } = render(<VideoSwiper />);
    expect(container.innerHTML).toBe("");
  });

  it("renders swiper with videos", () => {
    mockGetVideos.mockReturnValue([mockVideo]);
    const { container } = render(<VideoSwiper />);
    expect(screen.getByText("Product Videos")).toBeTruthy();
    expect(container.querySelector("h2")).toBeTruthy();
    expect(screen.getByText("Test Video")).toBeTruthy();
    expect(screen.getByText("Test Product")).toBeTruthy();
  });

  it("renders multiple slides", () => {
    mockGetVideos.mockReturnValue([
      mockVideo,
      { ...mockVideo, id: "2", name: "Video 2" },
    ]);
    render(<VideoSwiper />);
    expect(screen.getByText("Video 2")).toBeTruthy();
  });

  it("displays uploaded video type without img", () => {
    mockGetVideos.mockReturnValue([
      { ...mockVideo, type: "upload", url: "/uploads/videos/test.ts" },
    ]);
    render(<VideoSwiper />);
    expect(screen.queryByTestId("swiper-slide")).toBeTruthy();
  });

  it("does not render video name when null", () => {
    mockGetVideos.mockReturnValue([
      { ...mockVideo, name: null, product: null },
    ]);
    render(<VideoSwiper />);
    expect(screen.queryByText("Test Product")).toBeNull();
  });
});
