'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { computeCategoryRanking, computeOverallStandings, computeAllRankings } = require('./scoring');

// ---------------------------------------------------------------------------
// computeCategoryRanking
// ---------------------------------------------------------------------------

describe('computeCategoryRanking', () => {
  it('ranks teams by average rating', () => {
    const categoryRatings = {
      TeamA: { voter1: 5, voter2: 4, voter3: 4 },   // avg 4.33
      TeamB: { voter1: 3, voter2: 3, voter3: 3 },   // avg 3.00
      TeamC: { voter1: 5, voter2: 5, voter3: 5 },   // avg 5.00
    };
    const result = computeCategoryRanking(categoryRatings);
    assert.equal(result.length, 3);
    assert.equal(result[0].team, 'TeamC');
    assert.equal(result[0].rank, 1);
    assert.equal(result[1].team, 'TeamA');
    assert.equal(result[1].rank, 2);
    assert.equal(result[2].team, 'TeamB');
    assert.equal(result[2].rank, 3);
  });

  it('excludes teams with fewer than 3 ratings', () => {
    const categoryRatings = {
      TeamA: { voter1: 5, voter2: 4, voter3: 4 },   // 3 ratings — included
      TeamB: { voter1: 3, voter2: 3 },               // 2 ratings — excluded
    };
    const result = computeCategoryRanking(categoryRatings);
    assert.equal(result.length, 1);
    assert.equal(result[0].team, 'TeamA');
  });

  it('detects ties at rank 1', () => {
    const categoryRatings = {
      TeamA: { voter1: 5, voter2: 5, voter3: 5 },   // avg 5.00
      TeamB: { voter1: 5, voter2: 5, voter3: 5 },   // avg 5.00
      TeamC: { voter1: 3, voter2: 3, voter3: 3 },   // avg 3.00
    };
    const result = computeCategoryRanking(categoryRatings);
    assert.equal(result.length, 3);
    const rank1Teams = result.filter(t => t.rank === 1);
    assert.equal(rank1Teams.length, 2);
    assert.ok(rank1Teams.some(t => t.team === 'TeamA'));
    assert.ok(rank1Teams.some(t => t.team === 'TeamB'));
    // TeamC gets rank 3 (two teams ahead)
    const teamC = result.find(t => t.team === 'TeamC');
    assert.equal(teamC.rank, 3);
  });

  it('returns empty array when no team meets threshold', () => {
    const categoryRatings = {
      TeamA: { voter1: 5, voter2: 4 },   // only 2 ratings
      TeamB: { voter1: 3 },              // only 1 rating
    };
    const result = computeCategoryRanking(categoryRatings);
    assert.deepEqual(result, []);
  });
});

// ---------------------------------------------------------------------------
// computeOverallStandings
// ---------------------------------------------------------------------------

describe('computeOverallStandings', () => {
  it('sums rank points across categories, lowest wins', () => {
    const categoryRankings = {
      innovation: [
        { team: 'TeamA', rank: 1, average: 5 },
        { team: 'TeamB', rank: 2, average: 4 },
        { team: 'TeamC', rank: 3, average: 3 },
      ],
      execution: [
        { team: 'TeamB', rank: 1, average: 5 },
        { team: 'TeamA', rank: 2, average: 4 },
        { team: 'TeamC', rank: 3, average: 3 },
      ],
      impact: [
        { team: 'TeamA', rank: 1, average: 5 },
        { team: 'TeamB', rank: 2, average: 4 },
        { team: 'TeamC', rank: 3, average: 3 },
      ],
    };
    // TeamA: 1+2+1 = 4, TeamB: 2+1+2 = 5, TeamC: 3+3+3 = 9
    const result = computeOverallStandings(categoryRankings);
    assert.equal(result[0].team, 'TeamA');
    assert.equal(result[0].points, 4);
    assert.equal(result[0].rank, 1);
    assert.equal(result[1].team, 'TeamB');
    assert.equal(result[1].points, 5);
    assert.equal(result[1].rank, 2);
    assert.equal(result[2].team, 'TeamC');
    assert.equal(result[2].points, 9);
    assert.equal(result[2].rank, 3);
  });

  it('requires ranking in at least 3 categories to qualify', () => {
    const categoryRankings = {
      innovation: [
        { team: 'TeamA', rank: 1, average: 5 },
        { team: 'TeamB', rank: 2, average: 4 },
      ],
      execution: [
        { team: 'TeamA', rank: 1, average: 5 },
        { team: 'TeamB', rank: 2, average: 4 },
      ],
      impact: [
        { team: 'TeamA', rank: 1, average: 5 },
        // TeamB not ranked here
      ],
    };
    // TeamA: ranked in 3 categories — qualifies
    // TeamB: ranked in 2 categories only — does NOT qualify
    const result = computeOverallStandings(categoryRankings);
    assert.equal(result.length, 1);
    assert.equal(result[0].team, 'TeamA');
  });

  it('handles ties in total points', () => {
    const categoryRankings = {
      innovation: [
        { team: 'TeamA', rank: 1, average: 5 },
        { team: 'TeamB', rank: 1, average: 5 },
        { team: 'TeamC', rank: 3, average: 3 },
      ],
      execution: [
        { team: 'TeamA', rank: 1, average: 5 },
        { team: 'TeamB', rank: 1, average: 5 },
        { team: 'TeamC', rank: 3, average: 3 },
      ],
      impact: [
        { team: 'TeamA', rank: 1, average: 5 },
        { team: 'TeamB', rank: 1, average: 5 },
        { team: 'TeamC', rank: 3, average: 3 },
      ],
    };
    // TeamA: 1+1+1=3, TeamB: 1+1+1=3 (tie), TeamC: 3+3+3=9
    const result = computeOverallStandings(categoryRankings);
    const rank1Teams = result.filter(t => t.rank === 1);
    assert.equal(rank1Teams.length, 2);
    assert.ok(rank1Teams.some(t => t.team === 'TeamA'));
    assert.ok(rank1Teams.some(t => t.team === 'TeamB'));
    const teamC = result.find(t => t.team === 'TeamC');
    assert.equal(teamC.rank, 3);
  });
});

// ---------------------------------------------------------------------------
// computeAllRankings
// ---------------------------------------------------------------------------

describe('computeAllRankings', () => {
  const ratings = {
    TeamA: {
      innovation: { voter1: 5, voter2: 5, voter3: 5 },
      execution:  { voter1: 4, voter2: 4, voter3: 4 },
      impact:     { voter1: 3, voter2: 3, voter3: 3 },
    },
    TeamB: {
      innovation: { voter1: 4, voter2: 4, voter3: 4 },
      execution:  { voter1: 5, voter2: 5, voter3: 5 },
      impact:     { voter1: 4, voter2: 4, voter3: 4 },
    },
    TeamC: {
      innovation: { voter1: 3, voter2: 3, voter3: 3 },
      execution:  { voter1: 3, voter2: 3, voter3: 3 },
      impact:     { voter1: 5, voter2: 5, voter3: 5 },
    },
  };

  const categories = [
    { id: 'innovation' },
    { id: 'execution' },
    { id: 'impact' },
  ];

  it('computes rankings for all categories plus overall', () => {
    const result = computeAllRankings(ratings, categories);
    assert.ok(result.categories);
    assert.ok(result.overall);
    assert.ok(Array.isArray(result.skippedCategories));
    assert.ok(Array.isArray(result.categories.innovation));
    assert.ok(Array.isArray(result.categories.execution));
    assert.ok(Array.isArray(result.categories.impact));
    assert.equal(result.categories.innovation.length, 3);
    assert.equal(result.overall.length, 3);
    assert.equal(result.skippedCategories.length, 0);
    // innovation: TeamA=5.0, TeamB=4.0, TeamC=3.0 → TeamA top
    assert.equal(result.categories.innovation[0].team, 'TeamA');
    // execution: TeamB=5.0, TeamA=4.0, TeamC=3.0 → TeamB top
    assert.equal(result.categories.execution[0].team, 'TeamB');
    // overall points: TeamB=2+1+2=5, TeamA=1+2+3=6, TeamC=3+3+1=7 → TeamB wins
    assert.equal(result.overall[0].team, 'TeamB');
    assert.ok(typeof result.overall[0].points === 'number');
  });

  it('skips categories with fewer than 2 ranked teams', () => {
    const sparseRatings = {
      TeamA: {
        innovation: { voter1: 5, voter2: 5, voter3: 5 },
        // TeamA alone in 'lonely' category
        lonely: { voter1: 5, voter2: 5, voter3: 5 },
      },
      TeamB: {
        innovation: { voter1: 4, voter2: 4, voter3: 4 },
        // TeamB not in 'lonely'
      },
    };
    const sparseCategories = [
      { id: 'innovation' },
      { id: 'lonely' },
    ];
    const result = computeAllRankings(sparseRatings, sparseCategories);
    assert.ok(result.skippedCategories.includes('lonely'));
    assert.ok(!result.skippedCategories.includes('innovation'));
  });
});
