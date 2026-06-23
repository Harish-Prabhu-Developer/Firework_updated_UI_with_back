import { useState, useRef } from "react";
import { X, Play, Loader2, Film } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { API_BASE_URL, productService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import "swiper/css";
import "swiper/css/pagination";

interface Video {
  id: string;
  name: string | null;
  type: string;
  url: string;
  isActive: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  } | null;
}

const getMediaUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const clean = url.replace(/\\/g, "/").replace(/^\//, "");
  return `${API_BASE_URL}/${clean}`;
};

const getYtId = (url: string) =>
  url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
  )?.[1];

const VideoModal = ({
  video,
  onClose,
}: {
  video: Video;
  onClose: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [iframeLoading, setIframeLoading] = useState(true);

  const close = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={close}
    >
      <div
        className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
        >
          <X size={18} />
        </button>
        <div className="aspect-video w-full relative">
          {video.type === "youtube" ? (
            <>
              {iframeLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <Loader2 size={36} className="animate-spin text-white/60" />
                </div>
              )}
              <iframe
                src={`https://www.youtube.com/embed/${getYtId(video.url)}?autoplay=1`}
                className={`w-full h-full ${iframeLoading ? "opacity-0 absolute" : ""}`}
                allow="autoplay; fullscreen"
                allowFullScreen
                title={video.name || "Video"}
                onLoad={() => setIframeLoading(false)}
              />
            </>
          ) : (
            <video
              ref={videoRef}
              src={getMediaUrl(video.url)}
              className="w-full h-full"
              controls
              autoPlay
              playsInline
            />
          )}
        </div>
      </div>
    </div>
  );
};

const VideoSwiper = () => {
  const [modalVideo, setModalVideo] = useState<Video | null>(null);

  const { data: videos, isLoading } = useQuery({
    queryKey: ["client-videos"],
    queryFn: productService.getVideos,
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) return null;

  if (!videos || videos.length === 0) return null;

  return (
    <>
      <section className="py-20 section-padding bg-secondary/30">
        <div className="container-narrow">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 text-primary text-xs font-semibold uppercase tracking-widest">
              <Film size={13} /> Product Videos
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">
              See Our <span className="text-primary">Crackers</span> in Action
            </h2>
            <p className="text-muted-foreground text-sm mt-3 max-w-md mx-auto">
              Watch our premium Sivakasi fireworks come to life. Tap a video to play.
            </p>
          </div>

          

          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={16}
            slidesPerView={1.15}
            centeredSlides={false}
            autoplay={{ delay: 4000, disableOnInteraction: true }}
            pagination={{ clickable: true }}
            breakpoints={{
              640: { slidesPerView: 2.15, spaceBetween: 20 },
              1024: { slidesPerView: 3.25, spaceBetween: 24 },
            }}
            className="!pb-12"
          >
            {videos.map((video) => (
              <SwiperSlide key={video.id}>
                <button
                  onClick={() => setModalVideo(video)}
                  className="group relative w-full aspect-video rounded-2xl overflow-hidden bg-foreground/5 cursor-pointer text-left block border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-lg"
                >
                  {video.type === "youtube" && video.url ? (
                    <img
                      src={`https://img.youtube.com/vi/${getYtId(video.url) || ""}/hqdefault.jpg`}
                      alt={video.name || "Video thumbnail"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <video
                      src={getMediaUrl(video.url)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-white transition-transform duration-300">
                      <Play size={24} className="text-primary ml-0.5" />
                    </div>
                  </div>
                  {video.name && (
                    <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-4 pt-8">
                      <p className="text-white text-sm font-semibold truncate">
                        {video.name}
                      </p>
                      {video.product && (
                        <p className="text-white/60 text-xs truncate mt-0.5">
                          {video.product.name}
                        </p>
                      )}
                    </div>
                  )}
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {modalVideo && (
        <VideoModal
          video={modalVideo}
          onClose={() => setModalVideo(null)}
        />
      )}
    </>
  );
};

export default VideoSwiper;
