/**
 * Nelum Response Variation Engine
 * Manages banks of 20+ variations per response category and prevents repetition within 10 turns.
 */

export const VARIATIONS = {
  GENERAL_HELP: [
    "Of course 😊 What's going on?",
    "Always. Tell me what's happening.",
    "I'm here for you. What's up?",
    "Happy to help 😄 What do you need?",
    "Sure thing. Tell me more.",
    "Let's sort it out together.",
    "You can tell me anything 😊",
    "I'm all ears! What can I do for you today?",
    "Always ready to assist you. Tell me what's on your mind 😊",
    "Let's figure this out together, no worries at all.",
    "I've got your back! How can I help you today?",
    "Tell me how I can make things easier for you ne?",
    "Sure, let's solve this together 😊",
    "What's on your mind? I'm here to help.",
    "Always happy to support you. What do you need today?",
    "No worries ne, tell me how I can help.",
    "Let's tackle this together. What is the issue?",
    "I'm here ne! Let me know what you need help with.",
    "Happy to guide you. Tell me more details.",
    "Whatever it is, we will figure it out together 😊"
  ],
  GREETINGS: [
    "Ayubowan 👋 Kohomada?",
    "Hello 😊 Good to see you.",
    "Aney, nice seeing you again.",
    "Hi! What's happening today?",
    "Welcome back 😄",
    "Ayubowan! Hope you are having a wonderful day ne 👋",
    "Hi there! Super glad to chat with you today 😊",
    "Hello! How are things going today?",
    "Ayubowan 👋 Good to have you here.",
    "Hey! What's the latest story today?",
    "Ayubowan machan! How can I help you today?",
    "Hi friend! Excited to chat with you ne 😊",
    "Hello hello! Great to see you today.",
    "Ayubowan 👋 What is the plan for today?",
    "Hi! Hope your day is going beautifully.",
    "Hello! Ready to help you make someone smile today 😊",
    "Ayubowan! Nice to connect with you.",
    "Hey friend! Hope everything is good on your side.",
    "Hello 😊 What's the scene today?",
    "Hi! So glad you stopped by today."
  ],
  GREETINGS_WARM: [
    "Aney! Good to see you again 😄",
    "Machan, so good to talk to you again! What's the plan today? 😄",
    "Aney machan! Welcome back. What are we planning today?",
    "Hello my friend! So wonderful to see you again 😊",
    "Ah machan! Kohomada? Super happy to chat with you again.",
    "Good to see you, buddy! How was your week ne?",
    "Aney! I was just hoping we'd chat today. What's happening?",
    "Welcome back, machan! Ready for another surprise?",
    "Hello hello! Always a pleasure talking to you, friend.",
    "Hey machan! Hope you're doing great today. Tell me what's up.",
    "Aney, nice to see my favorite shopping buddy again!",
    "Hi machan! What exciting thing are we doing today?",
    "Hello friend! Let's plan something awesome again 😊",
    "Kohomada machan? So glad you're back today.",
    "Hey buddy! Always here for a good chat ne.",
    "Aney! Ready to help you choose the best gift again.",
    "Hello my friend! Hope your day is going super.",
    "Ah machan, let's sort out your gifting plan today ne!",
    "Aney, welcome back! Good to catch up again.",
    "Hi! Always happy to assist a great friend like you 😊"
  ],
  UNCERTAINTY: [
    "Take your time.",
    "No rush 😊",
    "It's okay if you're not sure yet.",
    "We can decide together.",
    "No pressure ne! We'll find it.",
    "Take all the time you need, friend.",
    "We can explore options together 😊",
    "No rush at all! Let's keep looking.",
    "It's perfectly fine to take your time.",
    "Don't worry, we'll find the perfect match ne.",
    "No hurry, buddy. Let's think it through.",
    "Let's look at a few more things before deciding.",
    "Take it easy ne. We have plenty of time.",
    "No pressure! We will figure it out together.",
    "It is completely fine to change your mind.",
    "We will sort it out at your own pace 😊",
    "No rush, buddy! Gifting should be fun.",
    "Take a breath! We will choose the best one.",
    "No hurry, let's explore all paths.",
    "It is okay to be unsure ne! That's why I'm here."
  ],
  DECISION_SUPPORT: [
    "Personally, I think this option feels more meaningful.",
    "Between these two, I'd probably choose this one because...",
    "This feels like something your mother would truly appreciate.",
    "If I were you, I'd go with this one ne 😊",
    "This option really stands out as a thoughtful choice.",
    "I have a feeling they will absolutely love this one.",
    "This selection feels very warm and personal, don't you think?",
    "I would personally recommend this one for the occasion.",
    "Between these choices, this one has that special touch.",
    "This one feels like the perfect way to make their day.",
    "This option has such a nice Sri Lankan charm to it.",
    "I think this choice will bring the biggest smile ne!",
    "This feels like a gift they will remember for a long time.",
    "If you want something elegant, this is the one to pick.",
    "This fits the vibe perfectly, machan 😊",
    "My recommendation is this one because it's so unique.",
    "This option represents such a thoughtful gesture.",
    "You can't go wrong with this choice, it's beautiful.",
    "I'd choose this one to make it extra special ne.",
    "This feels like the most heartfelt option available."
  ],
  CELEBRATION: [
    "Excellent choice 🎉",
    "I think they're going to love this.",
    "That's a lovely gift.",
    "Beautiful choice 😊",
    "Amazing selection! They will be thrilled 🎉",
    "That is such a thoughtful gift, really.",
    "Perfect! This is going to make their day.",
    "You chose beautifully ne! So happy about this.",
    "This is going to be a wonderful surprise!",
    "Awesome choice! You're great at this.",
    "This gift has so much meaning ne.",
    "Absolutely wonderful! A very sweet choice.",
    "They are going to be so happy when they receive this!",
    "That's a top-tier choice 🎉 Very nice.",
    "So glad you picked this, it's perfect.",
    "This will make their occasion truly unforgettable.",
    "Excellent selection, machan! Super choice.",
    "I'm sure this will bring a massive smile ne 😊",
    "A lovely selection! Very elegant.",
    "This is such a sweet surprise. Well done!"
  ],
  HESITATION: [
    "That's completely fine 😊 Most people aren't sure at first. Tell me a little about the person and we'll figure it out together.",
    "No worries at all ne! It's hard to decide sometimes. Let's talk about what they like and we can narrow it down.",
    "Don't worry buddy! Gifting is about the thought. Tell me what makes them smile and we'll start there.",
    "No rush ne! We'll figure it out. What is their general vibe? Flowers, cakes, or something different?",
    "Take your time 😊 What does this person usually enjoy in their free time? Let's decide together.",
    "It's okay to be unsure ne! Let's think about what they love doing. Any hobbies?",
    "No worries, machan! Tell me a bit about them, and I'll suggest some nice directions.",
    "That is totally normal 😊 Let's work together. Who is the lucky person we are shopping for today?",
    "No pressure at all! Tell me a little story about them and we'll find a gift that fits ne.",
    "We can take it slow. What usually makes them happy? We'll match that vibe.",
    "Totally fine ne! Let's explore together. Do they like sweet things or elegant things?",
    "No hurry! Tell me what their personality is like, and we'll find something special.",
    "Gifting block is real ne! Don't worry. Let's figure out what they enjoy first.",
    "It's completely okay. We have plenty of choices. What are they interested in these days?",
    "No worries 😊 Let's start with who this is for, and we'll go from there.",
    "Take it easy! We will find the perfect surprise. What is their favorite color or hobby?",
    "Totally fine ne! What usually makes them smile? Let's build a surprise around that.",
    "Don't worry buddy, we got this. Tell me what they like and we'll solve it.",
    "No rush at all! Let's think about their favorite things ne.",
    "It's okay ne! We will locate something wonderful. Who are we planning this for?"
  ],
  CLARIFICATION: [
    "Hmm 😊 I didn't fully catch that. Could you explain it a little differently?",
    "Aney, I want to make sure I get this right. Could you tell me that again in another way?",
    "Hmm, I didn't quite get that ne. Could you explain it a bit differently?",
    "Aney, I want to help you perfectly! Could you clarify what you meant?",
    "Hmm 😊 Could you explain it a little differently? I want to make sure I understand.",
    "Aney, I didn't fully capture that. Tell me again differently ne?",
    "Hmm, I might have missed that. Could you tell me in a simpler way?",
    "Aney, tell me a bit more so I can understand you perfectly 😊",
    "Hmm 😊 I didn't catch that fully. Can we try explaining it differently?",
    "Aney, explain that to me again ne? I'm here to listen.",
    "Hmm, let's try that again. Tell me in another way, friend.",
    "Aney, could you explain that a little differently? Just want to be sure ne.",
    "Hmm 😊 I didn't catch that. Tell me more details, buddy.",
    "Aney, could you clarify that a bit? I want to get the details right.",
    "Hmm, not sure I fully got that ne. Could you rephrase it?",
    "Aney, tell me what you mean in a slightly different way 😊",
    "Hmm 😊 Could you say that differently? I want to be 100% sure I understand.",
    "Aney, I didn't catch that part ne. Let me know what you meant.",
    "Hmm, could you explain that a little differently? Thanks buddy!",
    "Aney, let's try that again ne. Explain it a bit differently for me."
  ],
  NO_PRODUCTS: [
    "Aiyo, I couldn't find anything perfect just yet. Let's try another approach together 😊",
    "Aiyo, no matches ne! Let's try a different search word or category.",
    "Aiyo, nothing found just yet. Maybe we can search for something else?",
    "Aiyo, nothing perfect came up ne! Let's try a different gift category.",
    "Aiyo, no options found. Let's change the price limit or search query and try again.",
    "Aiyo, no matches ne. Let's look for another nice surprise together 😊",
    "Aiyo, I couldn't find a perfect fit. How about we search for cakes or flowers?",
    "Aiyo, nothing turned up ne. Let's try another search word, buddy.",
    "Aiyo, nothing in that range ne. Let's adjust the query or budget limit.",
    "Aiyo, I couldn't locate anything perfect. Let's try another direction ne.",
    "Aiyo, no items found. Let's try another nice idea together.",
    "Aiyo, no matches ne. Let's search for something a little different.",
    "Aiyo, nothing perfect just yet. Let's try another keyword ne.",
    "Aiyo, couldn't find anything matching. Let's try another approach.",
    "Aiyo, no products found ne. Let's try a different search term.",
    "Aiyo, nothing perfect ne. Let's search for another option together.",
    "Aiyo, no matches found. Let's try a different search, buddy.",
    "Aiyo, nothing in stock for that search ne. Let's try another category.",
    "Aiyo, I couldn't find anything matching ne. Let's try a fresh search.",
    "Aiyo, no products found. Let's try a different query, no worries ne!"
  ]
};

export class ResponseVariationEngine {
  /**
   * Selects a random variation for a given category, ensuring no repeat within 10 turns.
   * @param {object} context 
   * @param {string} category 
   * @returns {string} The selected response variation.
   */
  getVariation(context, category) {
    // 1. Initialize emotionalMemory context if missing
    context.emotionalMemory = context.emotionalMemory || {};
    context.emotionalMemory.usedTemplates = context.emotionalMemory.usedTemplates || [];
    context.emotionalMemory.friendshipScore = context.emotionalMemory.friendshipScore || 0;

    let templates = VARIATIONS[category] || ["Hello 😊"];

    // 2. Unlock warmer greetings for high friendship score (Rule 8)
    if (category === 'GREETINGS' && context.emotionalMemory.friendshipScore > 10) {
      templates = VARIATIONS.GREETINGS_WARM;
    }

    // 3. Filter templates to remove recently used ones
    const used = context.emotionalMemory.usedTemplates;
    let candidates = templates.filter(t => !used.includes(t));

    // If all templates were used, reset history for this category or globally
    if (candidates.length === 0) {
      candidates = templates;
    }

    // 4. Select a random template
    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    // 5. Update the used templates queue (last 10 turns)
    used.push(selected);
    if (used.length > 10) {
      used.shift();
    }

    return selected;
  }
}

export const responseVariationEngine = new ResponseVariationEngine();
export default responseVariationEngine;
