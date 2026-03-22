import { useHistoryStore, useMediaStore } from '@/stores';
import type { MediaItem } from '@/types';

export interface RecommendationItem extends MediaItem {
  score: number;
  reason: string;
}

/**
 * 推荐服务
 * 基于观看历史和内容相似度提供个性化推荐
 */
class RecommendationService {
  /**
   * 获取个性化推荐
   */
  getRecommendations(items: MediaItem[], limit: number = 10): RecommendationItem[] {
    const historyStore = useHistoryStore.getState();
    const history = historyStore.entries;
    
    if (history.length === 0) {
      return this.getPopularItems(items, limit);
    }

    const recommendations: RecommendationItem[] = [];
    const watchedIds = new Set(history.map(h => h.mediaId));

    // 1. 分析用户偏好
    const userPreferences = this.analyzePreferences(history);

    // 2. 找出相似类型的未观看内容
    for (const item of items) {
      if (watchedIds.has(item.id)) continue;

      const score = this.calculateScore(item, userPreferences, history);
      
      if (score > 0) {
        recommendations.push({
          ...item,
          score,
          reason: this.getRecommendationReason(item, userPreferences)
        });
      }
    }

    // 3. 按分数排序并返回
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 获取相似内容推荐
   */
  getSimilarItems(item: MediaItem, items: MediaItem[], limit: number = 6): RecommendationItem[] {
    const recommendations: RecommendationItem[] = [];

    for (const other of items) {
      if (other.id === item.id) continue;

      const score = this.calculateSimilarity(item, other);
      
      if (score > 0.3) {
        recommendations.push({
          ...other,
          score,
          reason: `与《${item.title}》相似`
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 获取"看了又看"推荐
   */
  getWatchNext(historyEntry: { mediaId: string; type: string }, items: MediaItem[]): RecommendationItem[] {
    const sameTypeItems = items.filter(item => item.type === historyEntry.type);
    return this.getRecommendations(sameTypeItems, 8);
  }

  /**
   * 获取热门推荐（当无历史记录时使用）
   */
  getPopularItems(items: MediaItem[], limit: number = 10): RecommendationItem[] {
    return items
      .filter(item => item.voteAverage && item.voteAverage > 7.0)
      .sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0))
      .slice(0, limit)
      .map(item => ({
        ...item,
        score: item.voteAverage || 0,
        reason: '热门推荐'
      }));
  }

  /**
   * 获取最新上线推荐
   */
  getNewReleases(items: MediaItem[], limit: number = 10): RecommendationItem[] {
    return [...items]
      .sort((a, b) => (b.year || 0) - (a.year || 0))
      .slice(0, limit)
      .map(item => ({
        ...item,
        score: 100 - (2026 - (item.year || 2026)),
        reason: '最新上线'
      }));
  }

  /**
   * 分析用户偏好
   */
  private analyzePreferences(history: { mediaId: string; type: string; progress: number }[]) {
    const typeCount: Record<string, number> = {};
    const genrePreferences: Record<string, number> = {};
    let totalWatchTime = 0;

    for (const entry of history) {
      if (entry.progress > 0) {
        typeCount[entry.type] = (typeCount[entry.type] || 0) + 1;
        totalWatchTime++;
      }
    }

    // 计算类型偏好
    const total = Object.values(typeCount).reduce((a, b) => a + b, 0);
    const typePreferences: Record<string, number> = {};
    for (const [type, count] of Object.entries(typeCount)) {
      typePreferences[type] = count / total;
    }

    return {
      typePreferences,
      genrePreferences,
      totalWatchTime,
      preferredTypes: Object.entries(typePreferences)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([type]) => type)
    };
  }

  /**
   * 计算推荐分数
   */
  private calculateScore(
    item: MediaItem,
    preferences: ReturnType<typeof this.analyzePreferences>,
    history: { mediaId: string; type: string }[]
  ): number {
    let score = 50;

    // 1. 类型匹配分数
    const typeScore = preferences.typePreferences[item.type] || 0;
    score += typeScore * 30;

    // 2. 评分分数
    if (item.voteAverage) {
      score += (item.voteAverage / 10) * 20;
    }

    // 3. 热度分数（如果有的话）
    if (item.voteCount && item.voteCount > 1000) {
      score += 10;
    }

    // 4. 新鲜度分数
    const yearDiff = 2026 - (item.year || 2020);
    if (yearDiff < 1) score += 15;
    else if (yearDiff < 3) score += 10;

    // 5. 随机性（避免总是推荐相同内容）
    score += Math.random() * 5;

    return score;
  }

  /**
   * 计算内容相似度
   */
  private calculateSimilarity(item1: MediaItem, item2: MediaItem): number {
    let similarity = 0;
    let total = 0;

    // 1. 类型相同
    if (item1.type === item2.type) {
      similarity += 0.4;
    }
    total += 0.4;

    // 2. 年份相近
    const yearDiff = Math.abs((item1.year || 0) - (item2.year || 0));
    if (yearDiff < 3) {
      similarity += 0.2 * (1 - yearDiff / 3);
    }
    total += 0.2;

    // 3. 评分相近
    const ratingDiff = Math.abs((item1.voteAverage || 5) - (item2.voteAverage || 5));
    if (ratingDiff < 1) {
      similarity += 0.2 * (1 - ratingDiff);
    }
    total += 0.2;

    // 4. 类型标签匹配
    const genres1 = item1.genres?.map(g => g.name.toLowerCase()) || [];
    const genres2 = item2.genres?.map(g => g.name.toLowerCase()) || [];
    const commonGenres = genres1.filter(g => genres2.includes(g));
    if (commonGenres.length > 0) {
      similarity += 0.2 * (commonGenres.length / Math.max(genres1.length, genres2.length));
    }
    total += 0.2;

    return similarity / total;
  }

  /**
   * 获取推荐原因
   */
  private getRecommendationReason(
    item: MediaItem,
    preferences: ReturnType<typeof this.analyzePreferences>
  ): string {
    const reasons: string[] = [];

    // 类型偏好
    if (preferences.preferredTypes.includes(item.type)) {
      reasons.push(`根据您喜欢看${item.type === 'movie' ? '电影' : item.type === 'tv' ? '剧集' : '动漫'}`);
    }

    // 高评分
    if (item.voteAverage && item.voteAverage >= 8.0) {
      reasons.push('高评分佳作');
    }

    // 新片
    if (item.year && item.year >= 2024) {
      reasons.push('最新上线');
    }

    // 类型标签
    if (item.genres && item.genres.length > 0) {
      reasons.push(item.genres[0].name);
    }

    return reasons.length > 0 ? reasons[0] : '为您推荐';
  }
}

export const recommendationService = new RecommendationService();
