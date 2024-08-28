const NR_LIC = process.env.NEWRELIC_LICENSE;
const NR_ACC = process.env.NEWRELIC_ACCOUNT;

async function sendNewRelicEvent(data) {
  if (!NR_LIC || !NR_ACC) {
    throw new Error('No setup for New Relic events')
  }

  if (data === null || typeof data !== 'object' || Object.keys(data).length === 0) {
    throw new Error('No data provided for New Relic events')
  }

  const eventData = JSON.stringify([{ ...data }]);

  const url = `https://insights-collector.newrelic.com/v1/accounts/${NR_ACC}/events`

  const options = {
    method: 'POST',
    headers: {
      "Api-Key": NR_LIC,
      "Content-Type": "application/json",
    },
    body: eventData,
    redirect: 'follow',
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    console.log("Send New Relic event: ", result);
  } catch (err) {
    console.log('error', err);
  }
}

module.exports = sendNewRelicEvent