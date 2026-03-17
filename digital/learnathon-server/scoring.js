'use strict';

const MIN_RATINGS = 3;
const MIN_CATEGORIES_FOR_OVERALL = 3;

function computeCategoryRanking(categoryRatings) {
  const teams = [];
  for (const [team, voterRatings] of Object.entries(categoryRatings)) {
    const values = Object.values(voterRatings);
    if (values.length < MIN_RATINGS) continue;
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    teams.push({ team, average: Math.round(average * 100) / 100, ratingCount: values.length });
  }
  teams.sort((a, b) => b.average - a.average);
  let rank = 1;
  for (let i = 0; i < teams.length; i++) {
    if (i > 0 && teams[i].average < teams[i - 1].average) {
      rank = i + 1;
    }
    teams[i].rank = rank;
  }
  return teams;
}

function computeOverallStandings(categoryRankings) {
  const teamData = {};
  for (const [categoryId, rankings] of Object.entries(categoryRankings)) {
    for (const { team, rank } of rankings) {
      if (!teamData[team]) {
        teamData[team] = { team, points: 0, rankedIn: 0, ranks: {} };
      }
      teamData[team].points += rank;
      teamData[team].rankedIn++;
      teamData[team].ranks[categoryId] = rank;
    }
  }
  const qualified = Object.values(teamData)
    .filter(t => t.rankedIn >= MIN_CATEGORIES_FOR_OVERALL);
  qualified.sort((a, b) => a.points - b.points);
  let rank = 1;
  for (let i = 0; i < qualified.length; i++) {
    if (i > 0 && qualified[i].points > qualified[i - 1].points) {
      rank = i + 1;
    }
    qualified[i].rank = rank;
  }
  return qualified;
}

function computeAllRankings(ratings, categories) {
  const categoryRankings = {};
  const skippedCategories = [];
  for (const { id } of categories) {
    const categoryData = {};
    for (const [team, teamRatings] of Object.entries(ratings)) {
      if (teamRatings[id]) {
        categoryData[team] = teamRatings[id];
      }
    }
    const ranking = computeCategoryRanking(categoryData);
    if (ranking.length < 2) {
      skippedCategories.push(id);
    }
    categoryRankings[id] = ranking;
  }
  const nonSkipped = {};
  for (const [id, ranking] of Object.entries(categoryRankings)) {
    if (!skippedCategories.includes(id)) {
      nonSkipped[id] = ranking;
    }
  }
  const overall = computeOverallStandings(nonSkipped);
  return { categories: categoryRankings, overall, skippedCategories };
}

module.exports = { computeCategoryRanking, computeOverallStandings, computeAllRankings };
