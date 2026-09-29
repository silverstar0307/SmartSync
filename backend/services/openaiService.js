const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_now',
});

const getCommunityRecommendations = async (userProfile, availableCommunities) => {
  const userInts = (userProfile.interests || []).map(i => i.toLowerCase().trim());
  
  const recommendations = availableCommunities
    .map(c => {
      const cTags = (c.tags || []).map(t => t.toLowerCase().trim());
      const cDomain = (c.domain || '').toLowerCase().trim();
      
      // Check for overlap
      const matchedTags = cTags.filter(t => userInts.includes(t));
      const isDomainMatch = userInts.includes(cDomain);
      
      let score = 0;
      let reason = '';
      
      if (isDomainMatch || matchedTags.length > 0) {
        score = 80 + Math.min(20, (matchedTags.length + (isDomainMatch ? 1 : 0)) * 5);
        const matchTerms = [...matchedTags, ...(isDomainMatch ? [c.domain] : [])];
        reason = `Matches your interest in ${matchTerms.join(', ')}.`;
      } else {
        score = 0;
        reason = `Explore community related to ${c.domain || 'various topics'}.`;
      }
      
      return {
        id: c.id,
        communityName: c.name,
        reason: reason,
        score: score,
        domain: c.domain,
        tags: c.tags,
        total_members: c.total_members
      };
    })
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score || b.total_members - a.total_members);

  return recommendations;
};

const getPeopleRecommendations = async (userProfile, availableStudents) => {
  const userInts = (userProfile.interests || []).map(i => i.toLowerCase().trim());
  
  const recommendations = availableStudents
    .map(s => {
      const sInts = (s.interests || []).map(i => i.toLowerCase().trim());
      const common = userInts.filter(i => sInts.includes(i));
      const matchPercentage = userInts.length > 0 
        ? Math.round((common.length / userInts.length) * 100) 
        : 0;
        
      const reason = common.length > 0 
        ? `You both share interest in ${common.join(', ')}.` 
        : `Student in ${s.class || 'the same college'}.`;
        
      return {
        studentId: s.id,
        studentName: s.username,
        commonInterests: common,
        matchPercentage: matchPercentage,
        reason: reason
      };
    })
    .filter(rec => rec.matchPercentage > 0)
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
    
  return recommendations;
};

const getMemberSuggestionsForCommunity = async (community, availableUsers) => {
  // If no OpenAI API Key, do interest overlaps matching
  if (process.env.OPENAI_API_KEY === 'dummy_key_for_now' || !process.env.OPENAI_API_KEY) {
    const communityTags = (community.tags || []).map(t => t.toLowerCase());
    const communityDomain = (community.domain || '').toLowerCase();
    
    return availableUsers
      .map(user => {
        const userInterests = (user.interests || []).map(i => i.toLowerCase());
        let score = 0;
        let matchedInterests = [];
        
        userInterests.forEach(interest => {
          if (communityTags.includes(interest) || interest.includes(communityDomain) || communityDomain.includes(interest)) {
            score += 20;
            matchedInterests.push(interest);
          }
        });
        
        return {
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          bio: user.bio,
          profile_photo: user.profile_photo,
          interests: user.interests,
          matchScore: score || 10,
          reason: score > 0 
            ? `Matches community interests: ${matchedInterests.join(', ')}`
            : `Active student with interest in related fields`
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  }

  const prompt = `
You are a community recommendation AI.
Community Details:
- Name: ${community.name}
- Domain: ${community.domain}
- Tags: ${(community.tags || []).join(', ')}
- Description: ${community.description}

Available Students:
${JSON.stringify(availableUsers.map(u => ({ id: u.id, username: u.username, interests: u.interests, bio: u.bio })))}

Task: Identify the top 5 students who are the best match for this community based on interests.

Return ONLY a JSON array with objects containing: { "id": <id>, "matchScore": 85, "reason": "Reason why they are a good match based on interest in..." }
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const resultStr = response.choices[0].message.content;
    const parsed = JSON.parse(resultStr);
    const recommendations = parsed.recommendations || parsed;

    return recommendations.map(rec => {
      const user = availableUsers.find(u => u.id === rec.id);
      if (user) {
        return {
          ...user,
          matchScore: rec.matchScore,
          reason: rec.reason
        };
      }
      return null;
    }).filter(Boolean);
  } catch (error) {
    console.error('OpenAI Error for community member matching:', error);
    return availableUsers.slice(0, 5).map(u => ({ ...u, matchScore: 50, reason: 'Active student interested in networking' }));
  }
};

module.exports = { getCommunityRecommendations, getPeopleRecommendations, getMemberSuggestionsForCommunity };
