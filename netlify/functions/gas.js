exports.handler = async (event) => {
  // KOTH GAS web app — migrated to its own Google account (solos the ~20k/day urlfetch quota).
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbyESrYFGshz-4yI3HmLrhB2fCbYTciFZDvqblClvy3k4VO60hy0SoZybCSUT60oTWL0bA/exec';

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : null;
    const params = event.queryStringParameters || {};

    let url = GAS_URL;
    const qp = Object.entries(params).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
    if (qp) url += '?' + qp;

    // Timeout so a hung Apps Script call fails fast instead of hanging the proxy (and the user's UI).
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s ceiling

    let res;
    try {
      res = await fetch(url, {
        method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null,
        redirect: 'follow',
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await res.text();
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: data
    };
  } catch (err) {
    const aborted = err && (err.name === 'AbortError');
    return {
      statusCode: aborted ? 504 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: aborted ? 'The server took too long to respond. Please try again.' : err.message
      })
    };
  }
};
