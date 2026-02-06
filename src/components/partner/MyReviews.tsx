import React, { useState, useEffect } from 'react';
import { partnerReviewsService } from '../../services/partner.service';
import { ServiceReview } from '../../services/admin.service';
import { useAuth } from '../../contexts/AuthContext';
import { Star } from 'lucide-react';

const MyReviews = () => {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [stats, setStats] = useState({ total: 0, avgRating: '0' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadReviews();
      loadStats();
    }
  }, [profile]);

  const loadReviews = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const data = await partnerReviewsService.getMyReviews(profile.id);
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!profile?.id) return;

    try {
      const data = await partnerReviewsService.getStats(profile.id);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Cargando reseñas...</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Calificación Promedio</p>
          <div className="flex items-center">
            <Star className="h-8 w-8 text-yellow-500 fill-current mr-2" />
            <p className="text-4xl font-bold text-gray-800">{stats.avgRating}</p>
            <span className="text-gray-600 ml-2">/ 5</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Total de Reseñas</p>
          <p className="text-4xl font-bold text-gray-800">{stats.total}</p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-semibold text-gray-800">{review.rating}.0</span>
              </div>
              <span className="text-xs text-gray-500">
                {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            {review.comment && (
              <p className="text-gray-700 text-sm">{review.comment}</p>
            )}
          </div>
        ))}
      </div>

      {reviews.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aún no tienes reseñas
        </div>
      )}
    </div>
  );
};

export default MyReviews;
