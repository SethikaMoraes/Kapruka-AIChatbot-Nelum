/**
 * Nelum Response Humanizer
 * Cleans robotic phrasing and enforces global bans on technical language (Rule 4).
 */

export class ResponseHumanizer {
  /**
   * Humanizes raw response text, removing robotic terms.
   * @param {string} text 
   * @returns {string} Humanized response.
   */
  humanize(text) {
    if (!text) return "";

    let processed = text;

    // Strict Case-Insensitive Global Bans (Rule 4)
    processed = processed.replace(/looks like you said/gi, "");
    processed = processed.replace(/intent detected/gi, "");
    processed = processed.replace(/searching products/gi, "");
    processed = processed.replace(/unable to understand/gi, "Hmm 😊 I didn't fully catch that");
    processed = processed.replace(/please provide more details/gi, "Give me a little more information and I'll do my best to help 😊");
    processed = processed.replace(/please provide details/gi, "Give me a little more information and I'll do my best to help 😊");
    processed = processed.replace(/processing request/gi, "");
    processed = processed.replace(/invalid input/gi, "Let's try that again 😊");
    processed = processed.replace(/no data found/gi, "Aiyo, I couldn't find anything perfect just yet");
    processed = processed.replace(/system error/gi, "Something went a bit wrong ne, let's try again");
    processed = processed.replace(/i detected/gi, "");

    // Generic robotic phrases cleanup
    processed = processed.replace(/mcp/gi, "");
    processed = processed.replace(/api/gi, "");
    processed = processed.replace(/database/gi, "");
    processed = processed.replace(/server/gi, "");
    processed = processed.replace(/error code/gi, "issue");

    // Clean up spaces, double punctuation, or double lines left from removals
    processed = processed.replace(/  +/g, " ");
    processed = processed.replace(/\s+/g, " ");
    processed = processed.trim();

    return processed;
  }
}

export const responseHumanizer = new ResponseHumanizer();
export default responseHumanizer;
