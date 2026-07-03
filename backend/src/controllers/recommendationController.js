import RecommendationService from '../services/recommendationService.js';

export const getClassRecommendations = async (req, res) => {
  try {
    const { category, limit } = req.query;
    const data = await RecommendationService.getClassRecommendations({
      userId: req.user?.userId,
      category,
      limit,
    });

    res.json(data);
  } catch (error) {
    console.error('getClassRecommendations error:', error);
    res.status(500).json({ message: error.message });
  }
};
