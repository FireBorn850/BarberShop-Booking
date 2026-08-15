import React, { useEffect, useState } from 'react';
import { Star, ExternalLink, BadgeCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

interface GoogleReview {
  id: string;
  authorName: string;
  authorPhoto: string | null;
  rating: number;
  text: string;
  relativeDate: string;
  isLocalGuide: boolean;
}

interface ReviewsResponse {
  success: boolean;
  rating: number | null;
  reviewsCount: number;
  placeName: string | null;
  mapsUrl: string | null;
  reviews: GoogleReview[];
  error?: string;
}

const CACHE_KEY = 'google-reviews-cache-v1';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const StarRow: React.FC<{ rating: number; size?: string }> = ({ rating, size = 'w-3.5 h-3.5' }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={`${size} ${n <= Math.round(rating) ? 'fill-amber-500 text-amber-500' : 'text-zinc-300 dark:text-stone-700'}`}
      />
    ))}
  </div>
);

export const GoogleReviews: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const cachedRaw = localStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (Date.now() - cached.savedAt < CACHE_TTL_MS) {
            setData(cached.payload);
            setLoading(false);
            return;
          }
        }

        const { data: fnData, error } = await supabase.functions.invoke('get-google-reviews');

        if (error || !fnData?.success) {
          throw new Error(error?.message || fnData?.error || 'Failed to load reviews');
        }

        setData(fnData);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), payload: fnData }));
      } catch (err) {
        console.warn('GoogleReviews load error:', err);
        setErrored(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (errored || (!loading && (!data || data.reviews.length === 0))) {
    return null;
  }

  return (
    <section
      id="reviews"
      className="py-24 bg-white dark:bg-[#0C0C0C] border-b border-zinc-200 dark:border-stone-800 relative transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="reveal max-w-3xl mb-12 space-y-3">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 uppercase tracking-[0.3em] text-[10px] font-bold">
            <span className="h-[1px] w-8 bg-amber-600 dark:bg-amber-500"></span>
            {t('reviews.eyebrow', 'CLIENT LOVE')}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-4xl sm:text-5xl font-serif font-light text-zinc-900 dark:text-stone-100 tracking-tight">
                {t('reviews.title', 'What Our Clients Say')}
              </h2>

              {data && data.rating !== null ? (
                <div className="flex items-center gap-2 mt-3">
                  <StarRow rating={data.rating} size="w-4 h-4" />
                  <span className="text-sm font-bold text-zinc-900 dark:text-stone-100">
                    {data.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-stone-500">
                    {t('reviews.basedOn', 'based on')} {data.reviewsCount} {t('reviews.onGoogle', 'Google reviews')}
                  </span>
                </div>
              ) : null}
            </div>

            {data && data.mapsUrl ? (
              
                <a href={data.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-300 dark:border-stone-700 rounded-sm text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-stone-300 hover:border-amber-600 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
              >
                {t('reviews.seeAll', 'See all on Google')}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-44 rounded-sm border border-zinc-200 dark:border-stone-800 bg-zinc-100 dark:bg-stone-900 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data && data.reviews.map((review, i) => (
              <div
                key={review.id}
                className="reveal rounded-sm border border-zinc-200 dark:border-stone-800 bg-zinc-50 dark:bg-[#0A0A0A] p-6 shadow-md dark:shadow-xl flex flex-col justify-between"
                style={{ transitionDelay: `${(i % 3) * 100}ms` }}
              >
                <div>
                  <StarRow rating={review.rating} />
                  <p className="text-sm text-zinc-700 dark:text-stone-300 mt-3 leading-relaxed line-clamp-4">
                    {review.text}
                  </p>
                </div>

                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-zinc-200 dark:border-stone-800/80">
                  {review.authorPhoto ? (
                    <img
                      src={review.authorPhoto}
                      alt={review.authorName}
                      className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-stone-800"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-amber-600/20 text-amber-600 dark:text-amber-500 flex items-center justify-center text-xs font-bold">
                      {review.authorName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold text-zinc-900 dark:text-stone-100 truncate">
                        {review.authorName}
                      </p>
                      {review.isLocalGuide ? (
                        <BadgeCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 shrink-0" />
                      ) : null}
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-stone-500">{review.relativeDate}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};